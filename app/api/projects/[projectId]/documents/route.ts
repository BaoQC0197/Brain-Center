import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage'
import { GeneratedDocument } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

export async function GET(_: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const docs = await storage.getDocuments(projectId)
  return NextResponse.json(docs)
}


export async function POST(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params
    const body = await req.json()
    const { type, inputSummary, content } = body

    if (!type || !content) {
      return NextResponse.json({ error: 'Thiếu thông tin type hoặc content' }, { status: 400 })
    }

    const existingDocs = (await storage.getDocuments(projectId)).filter(d => d.type === type)
    const maxVersion = existingDocs.length > 0 ? Math.max(...existingDocs.map(d => d.version || 1)) : 0
    const newVersion = maxVersion + 1

    const doc: GeneratedDocument = {
      id: uuidv4(),
      projectId,
      type,
      inputType: 'text',
      inputSummary: inputSummary || `Imported ${type} File`,
      version: newVersion,
      createdAt: new Date().toISOString(),
      content,
    }

    await storage.saveDocument(doc)
    return NextResponse.json(doc)
  } catch {
    return NextResponse.json({ error: 'Không thể lưu document' }, { status: 500 })
  }
}

