import { NextResponse } from 'next/server'
import { generateDocBuilderDocument } from '@/lib/claude'
import { storage } from '@/lib/storage'
import { DocBuilderType, DocBuilderStandard, BuiltDocument, RawDocument, RawDocType } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      projectId,
      docType,
      standard,
      overview,
      answers,
      questions,
      extraNotes,
      saveAsRawDoc = true,
    } = body as {
      projectId: string
      docType: DocBuilderType
      standard: DocBuilderStandard
      overview: string
      answers: Record<string, string>
      questions: { id: string; section: string; question: string }[]
      extraNotes?: string
      saveAsRawDoc?: boolean
    }

    if (!projectId || !docType || !standard) {
      return NextResponse.json({ error: 'Thiếu tham số bắt buộc' }, { status: 400 })
    }

    const project = await storage.getProject(projectId)
    if (!project) return NextResponse.json({ error: 'Project không tồn tại' }, { status: 404 })

    const systemInstruction = await storage.getInstruction(projectId)
    const contentMarkdown = await generateDocBuilderDocument(
      docType,
      standard,
      overview || '',
      answers || {},
      questions || [],
      { name: project.name, description: project.description, techStack: project.techStack },
      systemInstruction,
      extraNotes
    )

    const docId = uuidv4()
    const title = `${docType.toUpperCase()} - Standard (${standard.toUpperCase()})`

    const builtDoc: BuiltDocument = {
      id: docId,
      projectId,
      title,
      docType,
      standard,
      contentMarkdown,
      answers: answers || {},
      createdAt: new Date().toISOString(),
    }

    await storage.saveBuiltDocument(builtDoc)

    let rawDoc: RawDocument | undefined
    if (saveAsRawDoc) {
      const rawTypeMap: Record<DocBuilderType, RawDocType> = {
        brd: 'brd',
        srs: 'srs',
        'user-story': 'user-story',
        'change-request': 'change-request',
        'api-spec': 'api-spec',
      }

      rawDoc = {
        id: uuidv4(),
        projectId,
        type: rawTypeMap[docType] || 'srs',
        name: `[Doc Builder] ${title}`,
        textContent: contentMarkdown,
        createdAt: new Date().toISOString(),
      }
      await storage.saveRawDocument(rawDoc)
    }


    return NextResponse.json({ builtDoc, rawDoc }, { status: 200 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi khi biên soạn tài liệu'
    console.error('[generate/doc-builder/draft]', msg)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
