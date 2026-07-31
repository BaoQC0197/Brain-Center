import { NextResponse } from 'next/server'
import { createQAAgentStream, parseJson } from '@/lib/claude'
import { storage } from '@/lib/storage'
import { GeneratedDocument, QAAgentType, InputType } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

async function resizeImage(base64: string): Promise<string> {
  const sharp = (await import('sharp')).default
  const resized = await sharp(Buffer.from(base64, 'base64'))
    .resize(4000, 4000, { fit: 'inside', withoutEnlargement: true })
    .png().toBuffer()
  return resized.toString('base64')
}

export async function POST(request: Request) {
  const encoder = new TextEncoder()
  const send = (obj: object) => encoder.encode(JSON.stringify(obj) + '\n')

  let projectId: string, agentType: QAAgentType, input: string, inputType: InputType
  let imageBase64: string | undefined
  let additionalParams: Record<string, string> = {}
  const contentType = request.headers.get('content-type') || ''

  try {
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      projectId = form.get('projectId') as string
      agentType = (form.get('agentType') as QAAgentType) || 'test-case'
      input = (form.get('input') as string) || ''
      inputType = (form.get('inputType') as InputType) || 'text'
      const file = form.get('image') as File | null
      if (file) {
        const raw = Buffer.from(await file.arrayBuffer()).toString('base64')
        imageBase64 = await resizeImage(raw)
      }
    } else {
      const body = await request.json()
      projectId = body.projectId
      agentType = body.agentType || 'test-case'
      input = body.input || ''
      inputType = body.inputType || 'text'
      additionalParams = body.additionalParams || {}
      if (body.imageBase64) imageBase64 = await resizeImage(body.imageBase64)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi parse request'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  if (!projectId! || !agentType!) {
    return NextResponse.json({ error: 'Thiếu projectId hoặc agentType' }, { status: 400 })
  }

  const project = await storage.getProject(projectId!)
  if (!project) return NextResponse.json({ error: 'Project không tồn tại' }, { status: 404 })

  const systemInstruction = await storage.getInstruction(projectId!)

  // Fetch previous generated documents in this project for Prerequisite Context Injection
  const projectGenDocs = await storage.getDocuments(projectId!)


  // Step 2: Inject Step 1 Context
  if (agentType === 'test-plan' || agentType === 'test-strategy') {
    const step1Doc = projectGenDocs.find((d: GeneratedDocument) => d.type === 'review-requirement' || d.type === 'acceptance-criteria')
    if (step1Doc) {
      additionalParams.previousStep1Docs = typeof step1Doc.content === 'string' ? step1Doc.content : JSON.stringify(step1Doc.content, null, 2)
    }
  }

  // Step 3: Inject Step 2 Test Plan & Step 1 AC Context
  if (agentType === 'test-case' || agentType === 'test-scenario') {
    const testPlanDoc = projectGenDocs.find((d: GeneratedDocument) => d.type === 'test-plan' || d.type === 'test-strategy')
    if (testPlanDoc) {
      additionalParams.previousTestPlan = typeof testPlanDoc.content === 'string' ? testPlanDoc.content : JSON.stringify(testPlanDoc.content, null, 2)
    }
    const step1Doc = projectGenDocs.find((d: GeneratedDocument) => d.type === 'review-requirement' || d.type === 'acceptance-criteria')
    if (step1Doc) {
      additionalParams.previousStep1Docs = typeof step1Doc.content === 'string' ? step1Doc.content : JSON.stringify(step1Doc.content, null, 2)
    }
  }

  // Step 4: Inject Step 3 Test Cases & Step 2 Master Test Plan for Test Summary Report
  if (agentType === 'test-report' || agentType === 'regression-checklist') {
    const testCaseDoc = projectGenDocs.find((d: GeneratedDocument) => (d.type as string) === 'test-case' || (d.type as string) === 'test-cases')
    if (testCaseDoc) {
      const tcData = testCaseDoc.content
      additionalParams.previousTestCasesData = typeof tcData === 'string' ? tcData : JSON.stringify(tcData, null, 2)

      // Calculate exact execution stats if available
      if (Array.isArray(tcData)) {
        const total = tcData.length
        const passed = tcData.filter((tc: any) => tc.executionStatus === 'PASS').length
        const failed = tcData.filter((tc: any) => tc.executionStatus === 'FAIL').length
        const blocked = tcData.filter((tc: any) => tc.executionStatus === 'BLOCKED').length
        const untried = total - passed - failed - blocked
        additionalParams.executionStats = JSON.stringify({ total, passed, failed, blocked, untried })
      }
    }
    const testPlanDoc = projectGenDocs.find((d: GeneratedDocument) => d.type === 'test-plan' || d.type === 'test-strategy')
    if (testPlanDoc) {
      additionalParams.previousTestPlan = typeof testPlanDoc.content === 'string' ? testPlanDoc.content : JSON.stringify(testPlanDoc.content, null, 2)
    }
  }
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = await createQAAgentStream(
          agentType!,
          input!,
          '',
          { name: project.name, description: project.description, techStack: project.techStack },
          systemInstruction,
          additionalParams,
          imageBase64,
          imageBase64 ? 'image/png' : undefined
        )

        let fullText = ''

        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const text = event.delta.text
            fullText += text
            controller.enqueue(send({ type: 'chunk', text }))
          }
        }

        const final = await stream.finalMessage()
        if (final.stop_reason === 'max_tokens') {
          console.warn('[generate/qa-agent] Max tokens reached, attempting JSON salvage')
        }

        let parsedContent: any = fullText
        if (agentType === 'test-case' || agentType === 'test-plan') {
          try {
            parsedContent = parseJson(fullText)
          } catch {
            parsedContent = fullText
          }
        }

        const docSummaryMap: Record<QAAgentType, string> = {
          'review-requirement': 'Review Requirement Report',
          'acceptance-criteria': 'Acceptance Criteria Specification',
          'test-strategy': 'Test Strategy Document',
          'test-plan': parsedContent?.title || 'Master Test Plan',
          'test-scenario': 'Test Scenarios Suite',
          'test-case': parsedContent?.feature || 'Test Cases Suite',
          'regression-checklist': 'Regression Test Checklist',
          'test-report': 'Test Execution Summary Report',
        }

        const existingDocs = (await storage.getDocuments(projectId!)).filter(d => d.type === (agentType as any))
        const maxVersion = existingDocs.length > 0 ? Math.max(...existingDocs.map(d => d.version || 1)) : 0
        const newVersion = maxVersion + 1

        const doc: GeneratedDocument = {
          id: uuidv4(),
          projectId: projectId!,
          type: agentType as any,
          inputType: inputType!,
          inputSummary: docSummaryMap[agentType!] || agentType!,
          version: newVersion,
          parentDocId: existingDocs.length > 0 ? existingDocs[0].id : undefined,
          createdAt: new Date().toISOString(),
          content: parsedContent,
          scenarios: parsedContent?.scenarios || [],
          inputData: parsedContent?.inputData || [],
        }

        await storage.saveDocument(doc)

        controller.enqueue(send({ type: 'done', doc }))
        controller.close()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Lỗi không xác định'
        console.error('[generate/qa-agent]', msg)
        controller.enqueue(send({ type: 'error', message: msg }))
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' },
  })
}
