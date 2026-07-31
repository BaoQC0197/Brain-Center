import { NextResponse } from 'next/server'
import { analyzeRequirements } from '@/lib/claude'
import { storage } from '@/lib/storage'
import { InputType, ClarifyTargetType } from '@/lib/types'

async function resizeImage(base64: string): Promise<string> {
  const sharp = (await import('sharp')).default
  const resized = await sharp(Buffer.from(base64, 'base64'))
    .resize(4000, 4000, { fit: 'inside', withoutEnlargement: true })
    .png().toBuffer()
  return resized.toString('base64')
}

export async function POST(request: Request) {
  let projectId: string, input: string, inputType: InputType, targetType: ClarifyTargetType
  let imageBase64: string | undefined
  const contentType = request.headers.get('content-type') || ''

  try {
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      projectId = form.get('projectId') as string
      input = form.get('input') as string
      inputType = (form.get('inputType') as InputType) || 'text'
      targetType = (form.get('targetType') as ClarifyTargetType) || 'test-cases'
      const file = form.get('image') as File | null
      if (file) {
        const raw = Buffer.from(await file.arrayBuffer()).toString('base64')
        imageBase64 = await resizeImage(raw)
      }
    } else {
      const body = await request.json()
      projectId = body.projectId
      input = body.input || ''
      inputType = body.inputType || 'text'
      targetType = body.targetType || 'test-cases'
      if (body.imageBase64) imageBase64 = await resizeImage(body.imageBase64)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi parse request'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  if (!projectId! || (!input!?.trim() && !imageBase64)) {
    return NextResponse.json({ error: 'Thiếu projectId hoặc input' }, { status: 400 })
  }
  const project = await storage.getProject(projectId!)
  if (!project) return NextResponse.json({ error: 'Project không tồn tại' }, { status: 404 })

  try {
    const systemInstruction = await storage.getInstruction(projectId!)

    const report = await analyzeRequirements(
      input! || '(Phân tích từ hình ảnh)',
      inputType!,
      targetType!,
      { name: project.name, description: project.description, techStack: project.techStack },
      systemInstruction,
      imageBase64,
      imageBase64 ? 'image/png' : undefined
    )
    return NextResponse.json({ report }, { status: 200 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi không xác định'
    console.error('[generate/clarify]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
