import { NextResponse } from 'next/server'
import { generateDocBuilderQuestions } from '@/lib/claude'
import { storage } from '@/lib/storage'
import { DocBuilderType, DocBuilderStandard } from '@/lib/types'

async function resizeImage(base64: string): Promise<string> {
  const sharp = (await import('sharp')).default
  const resized = await sharp(Buffer.from(base64, 'base64'))
    .resize(4000, 4000, { fit: 'inside', withoutEnlargement: true })
    .png().toBuffer()
  return resized.toString('base64')
}

export async function POST(request: Request) {
  let projectId: string, docType: DocBuilderType, standard: DocBuilderStandard, initialInput: string
  let previousAnswersText: string | undefined
  let imageBase64: string | undefined
  const contentType = request.headers.get('content-type') || ''

  try {
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      projectId = form.get('projectId') as string
      docType = (form.get('docType') as DocBuilderType) || 'srs'
      standard = (form.get('standard') as DocBuilderStandard) || 'iso-29119'
      initialInput = (form.get('initialInput') as string) || ''
      previousAnswersText = (form.get('previousAnswersText') as string) || undefined
      const file = form.get('image') as File | null
      if (file) {
        const raw = Buffer.from(await file.arrayBuffer()).toString('base64')
        imageBase64 = await resizeImage(raw)
      }
    } else {
      const body = await request.json()
      projectId = body.projectId
      docType = body.docType || 'srs'
      standard = body.standard || 'iso-29119'
      initialInput = body.initialInput || ''
      previousAnswersText = body.previousAnswersText || undefined
      if (body.imageBase64) imageBase64 = await resizeImage(body.imageBase64)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi parse request'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  if (!projectId!) {
    return NextResponse.json({ error: 'Thiếu projectId' }, { status: 400 })
  }
  const project = await storage.getProject(projectId!)
  if (!project) return NextResponse.json({ error: 'Project không tồn tại' }, { status: 404 })

  try {
    const systemInstruction = await storage.getInstruction(projectId!)

    const questionnaire = await generateDocBuilderQuestions(
      docType!,
      standard!,
      initialInput!,
      { name: project.name, description: project.description, techStack: project.techStack },
      systemInstruction,
      imageBase64,
      imageBase64 ? 'image/png' : undefined,
      previousAnswersText
    )
    return NextResponse.json({ questionnaire }, { status: 200 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi khi tạo bộ câu hỏi'
    console.error('[generate/doc-builder/questions]', msg)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
