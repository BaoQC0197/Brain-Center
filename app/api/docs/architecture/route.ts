import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { exportMarkdownToHtml } from '@/lib/html-export'

const DEFAULT_ARCHITECTURE_DOC = `# Brain Center: Tài liệu kiến trúc hệ thống và quy trình vận hành Agent

Tài liệu này tổng hợp mục tiêu hệ thống, các nhóm đối tượng sử dụng, luồng làm việc thực tế và cơ chế phối hợp giữa **Agent chính** và các **Sub-agent** trong hệ thống **Brain Center**.

---

## 1. Mục tiêu và giá trị vận hành của hệ thống

Hệ thống **Brain Center** được thiết kế làm trung tâm hỗ trợ công việc cho đội ngũ phát triển phần mềm (Product Owner, Business Analyst, QA/Tester và Quản lý dự án). Hệ thống giải quyết 3 bài toán thực tế:

1. **Tiết kiệm thời gian lập tài liệu**: Tự động hóa việc tạo tài liệu đặc tả, kế hoạch kiểm thử và bộ test cases thay vì biên soạn thủ công kéo dài nhiều ngày.
2. **Rà soát thiếu sót ngay từ đầu**: Giúp phát hiện các điểm mơ hồ, mâu thuẫn hoặc kịch bản lỗi bị bỏ sót trong yêu cầu nghiệp vụ trước khi tiến hành lập trình.
3. **Chuẩn hóa chất lượng kiểm thử**: Đảm bảo toàn bộ tài liệu kiểm thử được trình bày nhất quán, đầy đủ tiêu chí nghiệm thu và bao phủ các kịch bản biên.

### Bảng so sánh hiệu quả vận hành:

| Tiêu chí | Phương pháp thủ công | Vận hành cùng Brain Center | Hiệu quả mang lại |
| :--- | :--- | :--- | :--- |
| **Thời gian tạo bộ kiểm thử** | 2 - 5 ngày cho một tính năng | 30 giây - 2 phút | Tăng 10 lần tốc độ chuẩn bị kiểm thử |
| **Bao phủ kịch bản biên** | Dễ bỏ sót 30% - 40% trường hợp ngoại lệ | Bao phủ đầy đủ các trường hợp ngoại lệ và kịch bản lỗi | Hạn chế tối đa lỗi phát sinh trên môi trường thật |
| **Rà soát yêu cầu** | Rà soát bằng mắt, phụ thuộc cảm tính | Sub-agent rà soát theo các bẫy nghiệp vụ thực tế | Phát hiện lỗ hổng ngay ở bước thiết kế |
| **Chuẩn hóa quy trình** | Tùy thuộc vào kinh nghiệm từng cá nhân | Đưa về một chuẩn nhất quán toàn công ty | Dễ dàng quản lý và bàn giao công việc |

---

## 2. Các nhóm vai trò sử dụng hệ thống

- **Product Owner (PO) và Business Analyst (BA)**: Khởi tạo BRD, SRS, User Story với Doc Builder Agent và phỏng vấn đa vòng Multi-turn.
- **QA / Tester**: Rà soát và làm rõ yêu cầu, Lập kế hoạch và chiến lược kiểm thử, Sinh kịch bản và bộ Test Cases chi tiết, Tạo Regression Checklist và Báo cáo chất lượng.
- **Project Manager (PM) và CTO**: Theo dõi tiến độ hoàn thành %, tiến độ release toàn bộ dự án và quản lý thẻ công việc trên bảng Kanban.
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
