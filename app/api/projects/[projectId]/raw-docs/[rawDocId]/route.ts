import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage'

type Params = { params: Promise<{ projectId: string; rawDocId: string }> }

export async function DELETE(_: Request, { params }: Params) {
  const { projectId, rawDocId } = await params
  await storage.deleteRawDocument(projectId, rawDocId)
  return NextResponse.json({ ok: true })
}

// Returns full doc including imageBase64 — used by generate page
export async function GET(_: Request, { params }: Params) {
  const { projectId, rawDocId } = await params
  const doc = (await storage.getRawDocuments(projectId)).find(d => d.id === rawDocId)
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(doc)
}

export async function PUT(request: Request, { params }: Params) {
  const { projectId, rawDocId } = await params
  const docs = await storage.getRawDocuments(projectId)
  const idx = docs.findIndex(d => d.id === rawDocId)
  if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  if (body.content !== undefined) docs[idx].textContent = body.content
  if (body.textContent !== undefined) docs[idx].textContent = body.textContent
  if (body.name !== undefined) docs[idx].name = body.name

  await storage.saveRawDocument(docs[idx])
  return NextResponse.json(docs[idx])
}

