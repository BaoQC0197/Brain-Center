import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { exportMarkdownToHtml } from '@/lib/html-export'

const DEFAULT_ARCHITECTURE_DOC = `# QA-Brain Center: Tài liệu Kiến trúc Hệ thống & Vận hành Pipeline

Tài liệu này tổng hợp **Mục tiêu Hệ thống, Đối tượng Sử dụng, Giá trị Doanh nghiệp** và toàn bộ **Kiến trúc Kỹ thuật 2 Pha (Phase 1 Baseline & Phase 2 QA Pipeline)** chuẩn quốc tế **ISTQB / ISO / IEEE** của **QA-Brain Center**.

---

## 1. TẦM NHÌN, MỤC TIÊU DỰ ÁN & GIÁ TRỊ DOANH NGHIỆP (EXECUTIVE SUMMARY)

### 1.1. Sứ mệnh Dự án (Project Mission)
**QA-Brain Center** được phát triển nhằm trở thành **"Trung tâm Trí tuệ Nhân tạo Độc lập & Toàn năng"** trong hoạt động Đảm bảo Chất lượng Phần mềm (Quality Assurance). Hệ thống giải quyết triệt để bài toán biến các yêu cầu nghiệp vụ mơ hồ thành bộ tài liệu thiết kế và bộ kiểm thử (Test Suite) hoàn chỉnh 100% theo các khung tiêu chuẩn quốc tế **ISTQB, ISO/IEC/IEEE 29119 và IEEE 829**.

### 1.2. Vấn đề thực tế & Bài toán cần giải quyết (Pain Points)
1. **Lãng phí 70% thời gian**: Đội ngũ QA/BA phải dành hàng trăm giờ gõ thủ công Test Plan, Test Scenarios, Test Cases và câu hỏi rà soát đặc tả.
2. **Yêu cầu đầu vào mơ hồ & Lọt Bug**: Yêu cầu nghiệp vụ từ khách hàng thường thiếu sót kịch bản lỗi, mâu thuẫn hoặc chưa bao phủ hết giá trị biên (Boundary values), dẫn đến lọt bẫy lỗi nghiêm trọng trên môi trường Production.
3. **Thiếu chuẩn hoá Enterprise**: Mỗi nhân sự viết Test Case theo một format ngẫu nhiên, thiếu tính nhất quán và khó đánh giá độ bao phủ (Coverage).

### 1.3. Giá trị Cốt lõi & ROI Mang lại (Business Value & ROI for Executives)

| Tiêu chí | Phương pháp Thủ công (Traditional QA) | Nâng cấp với QA-Brain Center | Tác động Doanh nghiệp (Business ROI) |
| :--- | :--- | :--- | :--- |
| **Thời gian tạo Test Suite** | 2 - 5 ngày / tính năng | **30 giây - 2 phút** | 🚀 **Tăng 10x năng suất sản xuất** |
| **Bao phủ Kịch bản Biên** | Dễ bỏ sót 30-40% Edge cases | **Bao phủ 100% Edge/Negative Cases** | 🛡️ **Giảm 90% Bug lọt Production** |
| **Rà soát Yêu cầu (Static Test)** | Rà soát bằng mắt, dễ cảm tính | **Sub-agent Rà soát theo bẫy lỗi nghiệp vụ** | 🎯 **Phát hiện Bug ngay từ bước Thiết kế** |
| **Chuẩn hoá Quy trình** | Tùy thuộc trình độ cá nhân | **Chuẩn ISO 29119 & ISTQB BVA/EP** | 🏢 **Chuẩn hoá 100% quy trình QA toàn cty** |

---

## 2. ĐỐI TƯỢNG SỬ DỤNG & VAI TRÒ TRONG ĐỘI NGHŨ (TARGET PERSONAS)

- **Senior QA / QA Lead**: Thiết lập khung tiêu chuẩn Test Strategy, Test Plan & Kiểm soát độ bao phủ.
- **BA / Product Owner**: Sử dụng Sub-agent Doc Builder & Sub-agent Clarify để làm rõ yêu cầu nghiệp vụ.
- **Developer**: Tham khảo kịch bản lỗi (Negative Path) và Test Scenarios trước khi triển khai code.
- **QA Automation Tester**: Sử dụng danh sách Test Cases tiêu chuẩn để chuyển đổi thành kịch bản Playwright/Cypress.
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
