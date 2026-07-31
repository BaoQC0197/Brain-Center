import { NextResponse } from 'next/server'
import { fetchFigmaFrame } from '@/lib/figma'
import { storage } from '@/lib/storage'
import { RawDocument } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    const { projectId, figmaUrl, name } = await request.json()

    if (!projectId || !figmaUrl?.trim()) {
      return NextResponse.json({ error: 'Thiếu projectId hoặc figmaUrl' }, { status: 400 })
    }

    const token = process.env.FIGMA_ACCESS_TOKEN
    if (!token || token === 'your_figma_token_here') {
      return NextResponse.json(
        { error: 'Chưa cấu hình FIGMA_ACCESS_TOKEN trong .env.local' },
        { status: 500 }
      )
    }

    const result = await fetchFigmaFrame(figmaUrl.trim(), token)

    const doc: RawDocument = {
      id: uuidv4(),
      projectId,
      type: 'figma',
      name: name?.trim() || result.name,
      imageBase64: result.imageBase64,
      imageMime: result.imageMime,
      createdAt: new Date().toISOString(),
    }

    await storage.saveRawDocument(doc)


    // Return without imageBase64 to keep response light
    const { imageBase64: _, ...response } = doc
    return NextResponse.json({ ...response, previewUrl: `data:${result.imageMime};base64,${result.imageBase64}` }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi không xác định'
    console.error('[figma/fetch]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
