import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { exportMarkdownToHtml } from '@/lib/html-export'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const isRaw = searchParams.get('raw') === 'true'

  const artifactPath = path.join(
    process.cwd(),
    'storage',
    'qa_brain_architecture_and_clarify_subagent_spec.md'
  )

  let content = ''
  if (fs.existsSync(artifactPath)) {
    content = fs.readFileSync(artifactPath, 'utf-8')
  } else {
    // Fallback: check brain artifacts dir
    const brainDir = path.join(
      process.env.HOME || '/Users/mac',
      '.gemini/antigravity-ide/brain/7c98f451-eca3-41e3-b350-dc581dcbaebc/qa_brain_architecture_and_clarify_subagent_spec.md'
    )
    if (fs.existsSync(brainDir)) {
      content = fs.readFileSync(brainDir, 'utf-8')
    }
  }

  if (!content) {
    return NextResponse.json({ error: 'Spec document not found' }, { status: 404 })
  }

  if (isRaw) {
    return NextResponse.json({ content })
  }

  const html = exportMarkdownToHtml(
    'QA-Brain Engine: Kiến trúc Hệ thống, Logic Sub-agent Clarify & Hướng dẫn Vận hành',
    content,
    'QA-Brain Core Architecture',
    'architecture-spec',
    1,
    new Date().toISOString()
  )

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}

export async function PUT(request: Request) {
  const artifactPath = path.join(
    process.cwd(),
    'storage',
    'qa_brain_architecture_and_clarify_subagent_spec.md'
  )

  const body = await request.json()
  const content = body.content || ''

  if (!content) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 })
  }

  fs.writeFileSync(artifactPath, content, 'utf-8')

  // Sync to brain artifact if exists
  const brainDir = path.join(
    process.env.HOME || '/Users/mac',
    '.gemini/antigravity-ide/brain/7c98f451-eca3-41e3-b350-dc581dcbaebc/qa_brain_architecture_and_clarify_subagent_spec.md'
  )
  if (fs.existsSync(brainDir)) {
    fs.writeFileSync(brainDir, content, 'utf-8')
  }

  return NextResponse.json({ ok: true, content })
}
