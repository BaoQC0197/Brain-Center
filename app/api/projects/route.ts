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

