import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage'
import { RawDocument, RawDocType } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  // strip imageBase64 from list response to keep payload small
  const docs = (await storage.getRawDocuments(projectId)).map(({ imageBase64: _, ...rest }) => rest)
  return NextResponse.json(docs)
}


export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const contentType = request.headers.get('content-type') || ''

  let name: string, type: RawDocType, textContent: string | undefined
  let imageBase64: string | undefined, imageMime: string | undefined
  let figmaUrl: string | undefined, audioBase64: string | undefined, audioMime: string | undefined

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData()
    name = form.get('name') as string
    type = form.get('type') as RawDocType
    textContent = (form.get('textContent') as string) || undefined
    figmaUrl = (form.get('figmaUrl') as string) || undefined

    const file = form.get('image') as File | null
    const docFile = form.get('file') as File | null

    if (file) {
      const rawBuf = Buffer.from(await file.arrayBuffer())
      const sharp = (await import('sharp')).default
      const resized = await sharp(rawBuf)
        .resize(4000, 4000, { fit: 'inside', withoutEnlargement: true })
        .png()
        .toBuffer()
      imageBase64 = resized.toString('base64')
      imageMime = 'image/png'
      if (!name) name = file.name
    } else if (docFile) {
      const buf = Buffer.from(await docFile.arrayBuffer())
      if (!name) name = docFile.name
      // Extract text content from text/md/json files directly
      const text = buf.toString('utf-8')
      textContent = textContent ? `${textContent}\n\n${text}` : text
    }
  } else {
    const body = await request.json()
    name = body.name
    type = body.type
    textContent = body.textContent
    figmaUrl = body.figmaUrl
    audioBase64 = body.audioBase64
    audioMime = body.audioMime
  }

  if (!name?.trim() || !type) {
    return NextResponse.json({ error: 'Thiếu name hoặc type' }, { status: 400 })
  }

  const doc: RawDocument = {
    id: uuidv4(),
    projectId,
    type,
    name: name.trim(),
    textContent,
    imageBase64,
    imageMime,
    audioBase64,
    audioMime,
    figmaUrl,
    createdAt: new Date().toISOString(),
  }

  await storage.saveRawDocument(doc)

  const { imageBase64: _, ...response } = doc
  return NextResponse.json(response, { status: 201 })
}

