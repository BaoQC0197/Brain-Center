import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage'

export async function GET(_: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const project = await storage.getProject(projectId)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(project)
}

export async function PUT(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const existing = await storage.getProject(projectId)
  if (!existing) return NextResponse.json({ error: 'Project không tồn tại' }, { status: 404 })

  try {
    const body = await req.json()
    const { name, description, techStack, stagingUrl, stagingAdminUrl, prodUrl, prodAdminUrl, bugListUrl, figmaUrl } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Tên project không được để trống' }, { status: 400 })
    }

    const updatedProject = {
      ...existing,
      name: name.trim(),
      description: (description || '').trim(),
      techStack: (techStack || '').trim(),
      stagingUrl: (stagingUrl || '').trim(),
      stagingAdminUrl: (stagingAdminUrl || '').trim(),
      prodUrl: (prodUrl || '').trim(),
      prodAdminUrl: (prodAdminUrl || '').trim(),
      bugListUrl: (bugListUrl || '').trim(),
      figmaUrl: (figmaUrl || '').trim(),
      updatedAt: new Date().toISOString(),
    }


    await storage.saveProject(updatedProject)
    return NextResponse.json(updatedProject)
  } catch {
    return NextResponse.json({ error: 'Không thể cập nhật dự án' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  await storage.deleteProject(projectId)
  return NextResponse.json({ ok: true })
}

