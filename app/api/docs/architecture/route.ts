import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { exportMarkdownToHtml } from '@/lib/html-export'

const DEFAULT_ARCHITECTURE_DOC = `# Brain Center: Tài liệu Kiến trúc Hệ thống và Quy trình Vận hành

Tài liệu này tổng hợp mục tiêu hệ thống, sơ đồ Use Case theo vai trò, quy trình biên soạn đặc tả với Doc Builder Agent và luồng rà soát làm rõ 6 tầng của hệ thống Brain Center.

---

## 1. Mục tiêu hệ thống

Brain Center là trung tâm điều hành và tự động hóa kiểm thử tập trung cho dự án phần mềm với 4 mục tiêu cốt lõi:

- **Quản lý dự án tập trung**: Quản lý toàn bộ thông tin dự án, cấu hình môi trường, liên kết Figma và danh sách Bug.
- **Tài liệu và Kho lưu trữ**: Quản lý tài liệu yêu cầu Phase 1 Baseline (BRD, SRS, User Story, Ghi âm cuộc họp) và lưu trữ kho tài liệu kiểm thử Phase 2.
- **Task board và Tiến độ**: Theo dõi danh mục công việc Kanban, phân loại mức độ ưu tiên, phân công nhân sự và tiến độ phát hành (Release).
- **Resource và Truy cập nhanh**: Cung cấp liên kết trực tiếp tới các sản phẩm của dự án, trang quản trị Admin, tài liệu thiết kế và môi trường Staging, Production.

---

## 2. Sơ đồ Use Case (Use Case Diagram)

\`\`\`mermaid
mindmap
  root((Brain Center))
    Product Owner và BA
      Khởi tạo BRD SRS User Story
      Biên soạn qua Doc Builder
      Quản lý Kanban Taskboard
    QA và Tester
      Rà soát yêu cầu nghiệp vụ
      Lập kế hoạch kiểm thử
      Sinh kịch bản và Test Cases
      Tạo Regression Checklist
    Project Manager và CTO
      Theo dõi tiến độ Release
      Quản lý tài nguyên dự án
      Truy cập nhanh Staging Prod
\`\`\`

### 2.1. Phân quyền và Chức năng theo Vai trò

| Nhóm người dùng | Chức năng chính trên Brain Center |
| :--- | :--- |
| **Product Owner (PO) và BA** | Tạo và quản lý tài liệu Baseline Phase 1 (BRD, SRS, User Story), ghi âm cuộc họp, điều phối công việc trên bảng Kanban. |
| **QA / Tester** | Rà soát đặc tả yêu cầu với Clarify Sub-agent, lập Test Plan và Strategy, sinh Test Cases chi tiết và xuất báo cáo kiểm thử. |
| **PM và CTO** | Đánh giá tổng quan tiến độ dự án, điều phối thẻ công việc Kanban, truy cập nhanh liên kết Figma, Bug list và môi trường Staging, Production. |
`


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const isRaw = searchParams.get('raw') === 'true'

  let content = ''

  // 1. Try Local File System first (Local dev authoritative source)
  try {
    const artifactPath = path.join(
      process.cwd(),
      'storage',
      'qa_brain_architecture_and_clarify_subagent_spec.md'
    )
    if (fs.existsSync(artifactPath)) {
      content = fs.readFileSync(artifactPath, 'utf-8')
    }
  } catch {}

  // 2. Try Supabase global_configs if local file is empty
  if (!content && isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('global_configs')
      .select('value')
      .eq('key', 'architecture_spec')
      .single()
    if (!error && data?.value) {
      content = data.value
    }
  }

  // 3. Fallback default
  if (!content) {
    content = DEFAULT_ARCHITECTURE_DOC
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
  try {
    const body = await request.json()
    const content = body.content || ''

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // 1. Save to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('global_configs').upsert({
        key: 'architecture_spec',
        value: content,
        updatedAt: new Date().toISOString(),
      })
      if (error) {
        console.error('Supabase update architecture_spec error:', error)
      }
    }

    // 2. Local File System fallback (only when writeable local dev environment)
    try {
      const artifactPath = path.join(
        process.cwd(),
        'storage',
        'qa_brain_architecture_and_clarify_subagent_spec.md'
      )
      fs.writeFileSync(artifactPath, content, 'utf-8')
    } catch {}

    return NextResponse.json({ ok: true, content })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Không thể lưu tài liệu kiến trúc' }, { status: 500 })
  }
}
