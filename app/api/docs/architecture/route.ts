import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { exportMarkdownToHtml } from '@/lib/html-export'

const DEFAULT_ARCHITECTURE_DOC = `# QA-Brain Center: Tài liệu kiến trúc hệ thống & vận hành pipeline

Tài liệu này tổng hợp **mục tiêu hệ thống, đối tượng sử dụng, giá trị doanh nghiệp** và toàn bộ **kiến trúc kỹ thuật 2 pha (Phase 1 Baseline & Phase 2 QA Pipeline)** chuẩn quốc tế **ISTQB / ISO / IEEE** của **QA-Brain Center**.

---

## 1. Tầm nhìn, mục tiêu dự án & giá trị doanh nghiệp (Executive summary)

### 1.1. Sứ mệnh dự án (Project mission)
**QA-Brain Center** được phát triển nhằm trở thành **"Trung tâm trí tuệ nhân tạo độc lập & toàn năng"** trong hoạt động Đảm bảo chất lượng phần mềm (Quality Assurance). Hệ thống giải quyết triệt để bài toán biến các yêu cầu nghiệp vụ mơ hồ thành bộ tài liệu thiết kế và bộ kiểm thử (Test suite) hoàn chỉnh 100% theo các khung tiêu chuẩn quốc tế **ISTQB, ISO/IEC/IEEE 29119 và IEEE 829**.

### 1.2. Vấn đề thực tế & bài toán cần giải quyết (Pain points)
1. **Lãng phí 70% thời gian**: Đội ngũ QA/BA phải dành hàng trăm giờ gõ thủ công Test plan, Test scenarios, Test cases và câu hỏi rà soát đặc tả.
2. **Yêu cầu đầu vào mơ hồ & lọt bug**: Yêu cầu nghiệp vụ từ khách hàng thường thiếu sót kịch bản lỗi, mâu thuẫn hoặc chưa bao phủ hết giá trị biên (Boundary values), dẫn đến lọt bẫy lỗi nghiêm trọng trên môi trường Production.
3. **Thiếu chuẩn hóa doanh nghiệp**: Mỗi nhân sự viết Test case theo một format ngẫu nhiên, thiếu tính nhất quán và khó đánh giá độ bao phủ (Coverage).

### 1.3. Giá trị cốt lõi & ROI mang lại (Business value & ROI for executives)

| Tiêu chí | Phương pháp thủ công (Traditional QA) | Nâng cấp với QA-Brain Center | Tác động doanh nghiệp (Business ROI) |
| :--- | :--- | :--- | :--- |
| **Thời gian tạo Test Suite** | 2 - 5 ngày / tính năng | **30 giây - 2 phút** | 🚀 **Tăng 10x năng suất sản xuất** |
| **Bao phủ kịch bản biên** | Dễ bỏ sót 30-40% Edge cases | **Bao phủ 100% Edge/Negative cases** | 🛡️ **Giảm 90% Bug lọt Production** |
| **Rà soát yêu cầu (Static Test)** | Rà soát bằng mắt, dễ cảm tính | **Sub-agent rà soát theo bẫy lỗi nghiệp vụ** | 🎯 **Phát hiện Bug ngay từ bước thiết kế** |
| **Chuẩn hóa quy trình** | Tùy thuộc trình độ cá nhân | **Chuẩn ISO 29119 & ISTQB BVA/EP** | 🏢 **Chuẩn hóa 100% quy trình QA toàn công ty** |

---

## 2. Đối tượng sử dụng & vai trò trong đội ngũ (Target personas)

- **BA / Product Owner**: Sử dụng Sub-agent Doc Builder & Sub-agent Clarify để làm rõ yêu cầu đặc tả (BRD, SRS, User Story).
- **QA / Tester**: Thiết lập Master Test Plan (IEEE 829), sinh kịch bản Test Scenarios & bộ Test Cases chi tiết (ISTQB), tạo Regression Checklist & quản lý Kanban Taskboard.
- **Developer & Technical Lead**: Tham khảo kịch bản lỗi (Negative Path) và Test Scenarios trước khi triển khai code.
- **Project Manager & CTO**: Giám sát tiến độ hoàn thành %, tiến độ release và truy cập 1-click các môi trường Web/Admin & Bug List.
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
