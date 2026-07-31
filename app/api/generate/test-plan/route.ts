import { NextResponse } from 'next/server'
import { createClaudeStream, parseJson, buildSystemPrompt, BASE_SYSTEM_TP } from '@/lib/claude'
import { storage } from '@/lib/storage'
import { GeneratedDocument, InputType } from '@/lib/types'
import { buildTestPlanPrompt } from '@/lib/prompts/test-plan'
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

  let projectId: string, input: string, inputType: InputType
  let timeline = '', team = '', objectives = ''
  let imageBase64: string | undefined
  const contentType = request.headers.get('content-type') || ''

  try {
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      projectId = form.get('projectId') as string
      input = form.get('input') as string
      inputType = (form.get('inputType') as InputType) || 'text'
      timeline = (form.get('timeline') as string) || ''
      team = (form.get('team') as string) || ''
      objectives = (form.get('objectives') as string) || ''
      const file = form.get('image') as File | null
      if (file) {
        const raw = Buffer.from(await file.arrayBuffer()).toString('base64')
        imageBase64 = await resizeImage(raw)
      }
    } else {
      const body = await request.json()
      projectId = body.projectId
      input = body.input
      inputType = body.inputType || 'text'
      timeline = body.timeline || ''
      team = body.team || ''
      objectives = body.objectives || ''
      if (body.imageBase64) imageBase64 = await resizeImage(body.imageBase64)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi parse request'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  if (!projectId! || !input!?.trim()) {
    return NextResponse.json({ error: 'Thiếu projectId hoặc input' }, { status: 400 })
  }
  const project = await storage.getProject(projectId!)
  if (!project) return NextResponse.json({ error: 'Project không tồn tại' }, { status: 404 })

  const systemInstruction = await storage.getInstruction(projectId!)
  const systemPrompt = buildSystemPrompt(BASE_SYSTEM_TP, systemInstruction)
  const userPrompt = buildTestPlanPrompt(
    input!,
    inputType!,
    { name: project.name, description: project.description, techStack: project.techStack },
    systemInstruction,
    { timeline, team, objectives }
  )

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const claudeStream = createClaudeStream(systemPrompt, userPrompt, imageBase64, imageBase64 ? 'image/png' : undefined)
        let fullText = ''

        for await (const event of claudeStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            const text = event.delta.text
            fullText += text
            controller.enqueue(send({ type: 'chunk', text }))
          }
        }

        const final = await claudeStream.finalMessage()
        if (final.stop_reason === 'max_tokens') {
          throw new Error('Output quá lớn. Hãy chia nhỏ tài liệu đầu vào.')
        }

        const parsed = parseJson(fullText)
        const doc: GeneratedDocument = {
          id: uuidv4(),
          projectId: projectId!,
          type: 'test-plan',
          inputType: inputType!,
          inputSummary: parsed.title || 'Test Plan',
          version: 1,
          createdAt: new Date().toISOString(),
          content: parsed,
        }
        await storage.saveDocument(doc)

        controller.enqueue(send({ type: 'done', doc }))
        controller.close()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Lỗi không xác định'
        console.error('[generate/test-plan]', msg)
        controller.enqueue(send({ type: 'error', message: msg }))
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8' },
  })
}
