import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage'
import { exportToHtml } from '@/lib/html-export'

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ projectId: string; docId: string }> }
) {
  const { projectId, docId } = await params
  await storage.deleteDocument(projectId, docId)
  return NextResponse.json({ ok: true })
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ projectId: string; docId: string }> }
) {
  const { projectId, docId } = await params
  const docs = await storage.getDocuments(projectId)
  const doc = docs.find(d => d.id === docId)
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const project = await storage.getProject(projectId)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const html = exportToHtml(doc, project.name, doc.inputSummary)
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string; docId: string }> }
) {
  const { projectId, docId } = await params
  const docs = await storage.getDocuments(projectId)
  const idx = docs.findIndex(d => d.id === docId)
  if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json()
  if (body.content !== undefined) docs[idx].content = body.content
  if (body.inputSummary !== undefined) docs[idx].inputSummary = body.inputSummary

  await storage.saveDocument(docs[idx])
  return NextResponse.json(docs[idx])
}

