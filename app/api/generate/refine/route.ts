import { NextResponse } from 'next/server'
import { refineTestCases } from '@/lib/claude'
import { storage } from '@/lib/storage'
import { GeneratedDocument, InputType, TestCase } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type') || ''
  let projectId: string, docId: string, feedback: string, inputType: InputType
  let imageBase64: string | undefined, imageMime: string | undefined

  try {
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      projectId = form.get('projectId') as string
      docId = form.get('docId') as string
      feedback = form.get('feedback') as string
      inputType = (form.get('inputType') as InputType) || 'text'
      const file = form.get('image') as File | null
      if (file) {
        const buf = await file.arrayBuffer()
        imageBase64 = Buffer.from(buf).toString('base64')
        imageMime = file.type
      }
    } else {
      const body = await request.json()
      projectId = body.projectId
      docId = body.docId
      feedback = body.feedback
      inputType = body.inputType || 'text'
    }

    if (!projectId || !docId || !feedback?.trim()) {
      return NextResponse.json({ error: 'Thiếu projectId, docId hoặc feedback' }, { status: 400 })
    }

    const project = await storage.getProject(projectId)
    if (!project) return NextResponse.json({ error: 'Project không tồn tại' }, { status: 404 })

    const docs = await storage.getDocuments(projectId)
    const parentDoc = docs.find(d => d.id === docId)
    if (!parentDoc || parentDoc.type !== 'test-cases') {
      return NextResponse.json({ error: 'Tài liệu gốc không tồn tại hoặc không phải test-cases' }, { status: 404 })
    }

    const systemInstruction = await storage.getInstruction(projectId)
    const existing = {
      feature: parentDoc.inputSummary,
      testCases: parentDoc.content as TestCase[],
      scenarios: parentDoc.scenarios || [],
      inputData: parentDoc.inputData || [],
    }

    const result = await refineTestCases(
      feedback,
      inputType,
      existing,
      { name: project.name, description: project.description, techStack: project.techStack },
      systemInstruction,
      imageBase64,
      imageMime
    )

    const doc: GeneratedDocument = {
      id: uuidv4(),
      projectId,
      type: 'test-cases',
      inputType,
      inputSummary: result.feature,
      version: (parentDoc.version || 1) + 1,
      parentDocId: docId,
      createdAt: new Date().toISOString(),
      content: result.testCases,
      scenarios: result.scenarios,
      inputData: result.inputData,
    }

    await storage.saveDocument(doc)

    return NextResponse.json({ doc, changesSummary: result.changesSummary, added: result.added, updated: result.updated, removed: result.removed }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định'
    console.error('[generate/refine]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
