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
  const project = await storage.getProject(projectId)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // 1. Try finding in generated documents
  const docs = await storage.getDocuments(projectId)
  let doc = docs.find(d => d.id === docId)

  // 2. If not found in generated docs, search in raw documents (Phase 1 Baseline docs)
  if (!doc) {
    const rawDocs = await storage.getRawDocuments(projectId)
    const rawDoc = rawDocs.find(rd => rd.id === docId)
    if (rawDoc) {
      doc = {
        id: rawDoc.id,
        projectId: rawDoc.projectId,
        type: rawDoc.type as any,
        inputType: 'text',
        inputSummary: rawDoc.name,
        version: 1,
        createdAt: rawDoc.createdAt,
        content: rawDoc.figmaUrl
          ? `🔗 **URL Figma Design**: [${rawDoc.figmaUrl}](${rawDoc.figmaUrl})\n\n---\n\n${rawDoc.textContent || ''}`
          : (rawDoc.textContent || 'Tài liệu dạng file đính kèm.'),
      }
    }
  }

  if (!doc) return NextResponse.json({ error: 'Tài liệu không tồn tại hoặc đã bị xóa' }, { status: 404 })

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

