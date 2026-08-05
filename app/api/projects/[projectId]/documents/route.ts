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
    const contentType = req.headers.get('content-type') || ''
    let type: string, inputSummary: string, content: string

    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      type = form.get('type') as string
      inputSummary = form.get('inputSummary') as string
      content = (form.get('content') as string) || ''
      const file = form.get('file') as File | null

      if (file) {
        const buf = Buffer.from(await file.arrayBuffer())
        const fileNameLower = (file.name || '').toLowerCase()
        const mimeType = (file.type || '').toLowerCase()

        let extracted = ''
        if (fileNameLower.endsWith('.pdf') || mimeType.includes('pdf')) {
          try {
            const pdfParse = require('pdf-parse')
            const pdfData = await pdfParse(buf)
            extracted = (pdfData.text || '').trim().replace(/\0/g, '').replace(/\r\n/g, '\n')
          } catch (pdfErr) {
            console.error('[documents POST] pdf-parse error:', pdfErr)
          }
        } else if (fileNameLower.endsWith('.docx') || mimeType.includes('wordprocessingml')) {
          try {
            const mammoth = (await import('mammoth')).default
            const result = await mammoth.extractRawText({ buffer: buf })
            extracted = (result.value || '').trim()
          } catch (docxErr) {
            console.error('[documents POST] mammoth error:', docxErr)
          }
        } else {
          extracted = buf.toString('utf-8').replace(/\0/g, '')
        }

        if (extracted) {
          content = content ? `${content}\n\n${extracted}` : extracted
        }
      }
    } else {
      const body = await req.json()
      type = body.type
      inputSummary = body.inputSummary
      content = body.content
    }

    if (!type || !content) {
      return NextResponse.json({ error: 'Thiếu thông tin type hoặc content' }, { status: 400 })
    }

    const existingDocs = (await storage.getDocuments(projectId)).filter(d => d.type === (type as any))
    const maxVersion = existingDocs.length > 0 ? Math.max(...existingDocs.map(d => d.version || 1)) : 0
    const newVersion = maxVersion + 1

    const doc: GeneratedDocument = {
      id: uuidv4(),
      projectId,
      type: type as any,
      inputType: 'text',
      inputSummary: inputSummary || `Imported ${type} File`,
      version: newVersion,
      createdAt: new Date().toISOString(),
      content,
    }

    await storage.saveDocument(doc)
    return NextResponse.json(doc)
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Không thể lưu document' }, { status: 500 })
  }
}

