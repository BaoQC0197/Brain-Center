import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage'
import { Project } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

export async function GET() {
  const projects = await storage.getProjects()
  return NextResponse.json(projects)
}

export async function POST(request: Request) {
  const body = await request.json()
  const project: Project = {
    id: uuidv4(),
    name: body.name,
    description: body.description || '',
    techStack: body.techStack || '',
    stagingUrl: body.stagingUrl || '',
    stagingAdminUrl: body.stagingAdminUrl || '',
    prodUrl: body.prodUrl || '',
    prodAdminUrl: body.prodAdminUrl || '',
    bugListUrl: body.bugListUrl || '',
    figmaUrl: body.figmaUrl || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  await storage.saveProject(project)
  return NextResponse.json(project, { status: 201 })
}

export async function PUT(request: Request) {
  try {
    const { orders } = await request.json() as { orders: { id: string; sortOrder: number }[] }
    if (Array.isArray(orders)) {
      await storage.reorderProjects(orders)
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: 'Invalid orders format' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Lỗi cập nhật thứ tự' }, { status: 500 })
  }
}
