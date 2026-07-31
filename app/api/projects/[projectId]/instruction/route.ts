import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage'

export async function GET(_: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const content = await storage.getInstruction(projectId)
  return NextResponse.json({ content })
}

export async function PUT(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const { content } = await request.json()
  await storage.saveInstruction(projectId, content ?? '')
  return NextResponse.json({ ok: true })
}

