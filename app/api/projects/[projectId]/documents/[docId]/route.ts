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

  // Direct lookup across generated, built, raw documents & local files by exact ID
  const doc = await storage.getDocumentById(projectId, docId)

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
  const body = await request.json()

  let doc = await storage.getDocumentById(projectId, docId)
  if (!doc) {
    const rawDocs = await storage.getRawDocuments(projectId)
    const rawDoc = rawDocs.find(r => r.id === docId)
    if (rawDoc) {
      if (body.content !== undefined) {
        rawDoc.textContent = typeof body.content === 'string' ? body.content : JSON.stringify(body.content)
      }
      await storage.saveRawDocument(rawDoc)
      return NextResponse.json(rawDoc)
    }
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (body.content !== undefined) {
    doc.content = body.content
  }
  if (body.inputSummary !== undefined) {
    doc.inputSummary = body.inputSummary
  }
  if (body.title !== undefined) {
    doc.title = body.title
  }

  await storage.saveDocument(doc)
  return NextResponse.json(doc)
}

