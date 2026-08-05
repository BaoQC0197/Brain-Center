import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { exportMarkdownToHtml } from '@/lib/html-export'

const DEFAULT_ARCHITECTURE_DOC = `# Brain Center: Tài liệu Kiến trúc Hệ thống và Quy trình Vận hành

Tài liệu này tổng hợp mục tiêu hệ thống, sơ đồ Use Case theo vai trò, quy trình biên soạn đặc tả với Doc Builder Agent và luồng rà soát làm rõ 6 tầng của hệ thống Brain Center.

---

## 1. Mục tiêu hệ thống

Brain Center là trung tâm điều hành và tự động hóa kiểm thử tập trung cho dự án phần mềm với 5 mục tiêu cốt lõi:

- **Tạo tài liệu và Biên soạn cùng AI**: Tận dụng sức mạnh của các Trợ lý AI (Doc Builder Agent, Clarify Sub-agent và QA Testing Agent) để tự động hóa việc biên soạn bài đặc tả (BRD, SRS, User Story), rà soát bẫy nghiệp vụ và lập bộ tài liệu kiểm thử chuẩn mực trong thời gian ngắn.
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

---

## 3. Luồng biên soạn tài liệu đặc tả ban đầu (Doc Builder Agent)

Khi dự án mới bắt đầu hoặc có yêu cầu tính năng mới, người dùng sử dụng **Doc Builder Agent** để tạo tài liệu đặc tả gốc (BRD, SRS, User Story). Luồng phỏng vấn N vòng và tổng hợp dữ liệu diễn ra theo sơ đồ sau:

\`\`\`mermaid
%%{init: {'theme': 'base', 'sequence': {'mirrorActors': false}}}%%
sequenceDiagram
    autonumber
    actor User as PO / BA / QA
    participant UI as Màn hình Doc Builder
    participant Q_Agent as Trợ lý tạo câu hỏi
    participant Draft_Agent as Trợ lý biên soạn tài liệu

    User->>UI: Chọn loại tài liệu, nhập mô tả ban đầu và đính kèm tham chiếu (Meeting Audio, Raw Text, Project Docs)
    UI->>Q_Agent: Gửi thông tin ban đầu và danh sách tài liệu tham chiếu
    Q_Agent-->>UI: Trả về và hiển thị bộ câu hỏi phỏng vấn Vòng 1

    loop Phỏng vấn đào sâu N vòng (Multi-Turn Loop)
        User->>UI: Trả lời Vòng i và chọn "Hỏi thêm vòng tiếp theo"
        UI->>Q_Agent: Gửi câu trả lời Vòng i và toàn bộ lịch sử các vòng trước
        Q_Agent-->>UI: Phân tích lỗ hổng và trả về bộ câu hỏi bổ sung Vòng i+1
    end

    User->>UI: Trả lời Vòng N và chọn "Tự động biên soạn đặc tả"
    UI->>Draft_Agent: Gửi toàn bộ Lịch sử N vòng Q và A + Meeting Audio + Raw Text + Project Docs được chọn
    Note over Draft_Agent: Phân tích, hợp nhất đa nguồn tri thức và tự động<br/>áp dụng giả định thiết kế chuẩn cho các chi tiết còn thiếu
    Draft_Agent-->>UI: Trả về bản tài liệu Markdown hoàn chỉnh và lưu vào kho dữ liệu dự án
\`\`\`

### Cách thức làm việc và Tham chiếu Đa nguồn Dữ liệu:
1. **Phỏng vấn đào sâu N vòng linh hoạt**: Người dùng có thể trả lời qua bao nhiêu vòng phỏng vấn tùy thích (Vòng 1 ➔ Vòng 2 ➔ ... ➔ Vòng N). Ở mỗi vòng, nếu cần đào sâu thêm các góc khuất nghiệp vụ, bấm *"Hỏi thêm vòng tiếp theo"* để Trợ lý phân tích lỗ hổng và tạo tiếp bộ câu hỏi phỏng vấn Vòng N+1.
2. **Tích hợp Đa nguồn Tri thức (Multi-Source Context)**: Khi bắt đầu biên soạn tài liệu đặc tả, **Trợ lý biên soạn tài liệu** không chỉ sử dụng lịch sử phỏng vấn N vòng mà còn tự động tham chiếu và tổng hợp đồng thời từ 4 nguồn:
   - **Lịch sử Q và A từ N vòng phỏng vấn**.
   - **File ghi âm và Transcribe cuộc họp (Meeting Audio / Transcript)**.
   - **Ghi chú và văn bản thô (Raw Texts / Meeting Notes)**.
   - **Các tài liệu dự án liên quan được chọn (Selected Baseline Documents / Figma Links)**.
3. **Tự động áp dụng giả định thiết kế chuẩn**: Đối với các chi tiết nhỏ chưa có câu trả lời trực tiếp trong N vòng phỏng vấn hoặc tài liệu tham chiếu, AI sẽ tự động bổ sung các giả định thiết kế chuẩn để bản đặc tả hoàn chỉnh 100% và không bị đứt đoạn.

---

## 4. Luồng phối hợp giữa Clarify Sub-agent và Primary QA Agent

Để tránh trường hợp AI tự phỏng đoán sai khi sinh Test Plan hoặc Test Cases từ một yêu cầu chưa rõ ràng, quy trình bắt buộc phải đi qua **bước rà soát làm rõ nghiêm ngặt** từ **Sub-agent Clarify** trước khi chuyển giao cho **Primary QA Agent**:

\`\`\`mermaid
%%{init: {'theme': 'base', 'sequence': {'mirrorActors': false}}}%%
sequenceDiagram
    autonumber
    actor User as QA / Tester
    participant UI as Màn hình Dự án
    participant SubAgent as Trợ lý rà soát (Clarify Sub-agent)
    participant PrimaryAgent as Trợ lý kiểm thử chính (Primary QA Agent)

    User->>UI: Chọn loại tài liệu cần tạo, đính kèm tài liệu nền tảng và chỉ thị tập trung
    UI->>SubAgent: Gửi nội dung bài đặc tả + tài liệu nền tảng + chỉ thị tập trung
    SubAgent-->>UI: Trả về báo cáo phân tích rủi ro và bộ câu hỏi rà soát

    loop Vòng lặp rà soát bắt buộc (Cho tới khi AI đối chiếu đạt 100% chuẩn)
        User->>UI: Nhập câu trả lời rà soát thực tế và bấm "Xác nhận câu trả lời"
        UI->>SubAgent: Gửi câu trả lời để AI đối chiếu với tiêu chuẩn tài liệu đích
        alt Nghiệp vụ chưa đạt chuẩn (Phát hiện điểm hở mới)
            SubAgent-->>UI: Trả về bộ câu hỏi rà soát bổ sung
        else Nghiệp vụ đối chiếu đạt chuẩn 100%
            SubAgent-->>UI: Trả xác nhận yêu cầu hoàn toàn làm rõ và sẵn sàng gọi lệnh thực thi
        end
    end

    UI->>PrimaryAgent: Gửi toàn bộ Ngữ cảnh 6 tầng (Bài đặc tả + Lịch sử Q và A rà soát + Chỉ thị + Tài liệu dự án)
    Note over PrimaryAgent: Lắp ráp 6 tầng ngữ cảnh và biên soạn chi tiết<br/>bộ tài liệu kiểm thử (Test Plan / Test Cases)
    PrimaryAgent-->>UI: Trả về kết quả bộ tài liệu kiểm thử hoàn chỉnh và lưu vào dự án
\`\`\`

### Nguyên tắc Rà soát Bắt buộc và Phân công Agent:
1. **Quy trình rà soát là bắt buộc 100% (Không được bỏ qua)**: Hệ thống không cho phép bỏ qua bước làm rõ. Mọi tài liệu kiểm thử trước khi biên soạn đều phải đi qua bước rà soát nghiêm ngặt của Sub-agent Clarify.
2. **Không gợi ý sẵn câu trả lời**: Các câu hỏi phỏng vấn rà soát từ Sub-agent chỉ cung cấp ô nhập câu trả lời trống (\`suggestedAnswer: ""\`) để người dùng (QA/BA) bắt buộc nhập câu trả lời thực tế theo thiết kế của dự án, tránh việc AI tự nghĩ ra câu trả lời ngẫu nhiên.
3. **Vòng lặp rà soát do AI đối chiếu và quyết định**: Người dùng nhập câu trả lời ➔ Sub-agent đối chiếu lại với khung tiêu chuẩn nghiệp vụ của loại tài liệu đích. Nếu phát hiện vẫn chưa rõ ràng hoặc phát sinh góc hở mới, Sub-agent tiếp tục đặt câu hỏi ở vòng tiếp theo. Vòng lặp chỉ kết thúc khi AI xác nhận bài đặc tả và câu trả lời đã đạt 100% độ rõ ràng.
4. **Primary QA Agent (Biên soạn kiểm thử)**: Sau khi Sub-agent phê duyệt độ rõ ràng, Agent chính nhận toàn bộ cấu trúc ngữ cảnh 6 tầng để xuất bài kiểm thử hoàn chỉnh.

---

## 5. Cơ chế tiêm tiêu chuẩn và chỉ thị rà soát (Focus Directives)

Trợ lý rà soát (Clarify Sub-agent) hoạt động dựa trên việc kết hợp tiêu chuẩn nghiệp vụ của từng loại tài liệu với các chỉ thị tập trung do người dùng lựa chọn:

\`\`\`mermaid
flowchart TD
    Target[Người dùng chọn loại tài liệu] --> FetchConfig[Tải tiêu chuẩn nghiệp vụ tương ứng]
    FetchConfig --> CheckCustom{Có cấu hình riêng?}
    CheckCustom -- Có --> ReadCustom[Đọc tiêu chuẩn tuỳ chỉnh từ hệ thống]
    CheckCustom -- Không --> ReadDefault[Đọc tiêu chuẩn mặc định]
    ReadCustom --> Combine[Kết hợp với các tiêu chí tập trung do người dùng đánh dấu]
    ReadDefault --> Combine
    Combine --> Execute[Sub-agent rà soát và đưa ra câu hỏi sát thực tế]
\`\`\`

### Trọng tâm phân tích theo từng loại tài liệu:

| Loại tài liệu cần tạo | Trọng tâm rà soát của Sub-agent |
| :--- | :--- |
| **Rà soát đặc tả** (\`review-requirement\`) | Kiểm tra tính đầy đủ, tính nhất quán và các tiêu chí nghiệm thu của yêu cầu. |
| **Kế hoạch kiểm thử** (\`test-plan\`) | Phân tích phạm vi kiểm thử, ma trận rủi ro, điều kiện bắt đầu/kết thúc và nguồn lực. |
| **Bộ Test Cases** (\`test-case\`) | Phân tích kịch bản người dùng, phân vùng tương đương, giá trị biên và dữ liệu kiểm thử. |
| **Báo cáo kiểm thử** (\`test-report\`) | Rà soát danh mục hồi quy trước bàn giao, tỷ lệ đạt/lỗi và đánh giá điều kiện Release. |

---

## 6. Cấu trúc lắp ráp ngữ cảnh 6 tầng (6-Layer Prompt Assembly)

Khi Trợ lý kiểm thử chính thực thi tạo tài liệu ở bước cuối cùng, hệ thống tự động tổng hợp thông tin từ 6 tầng ngữ cảnh khác nhau để gửi tới AI:

1. **Tầng 1 - Hướng dẫn chung hệ thống**: Định danh vai trò của Trợ lý AI và các nguyên tắc trình bày tài liệu.
2. **Tầng 2 - Quy tắc riêng của dự án**: Các chỉ thị đặc thù do người dùng thiết lập riêng cho từng dự án.
3. **Tầng 3 - Thông tin dự án**: Tên dự án, mô tả, công nghệ sử dụng và các liên kết môi trường.
4. **Tầng 4 - Tài liệu nền tảng**: Nội dung các bản BRD, SRS, User Story đã được chốt ở Phase 1.
5. **Tầng 5 - Báo cáo rà soát và câu trả lời làm rõ**: Kết quả phỏng vấn và câu trả lời thực tế của người dùng từ Sub-agent Clarify.
6. **Tầng 6 - Nhiệm vụ cụ thể**: Yêu cầu chi tiết và cấu trúc đầu ra cần tạo cho lượt chạy hiện tại.
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

  // 2. Default to code-authoritative DEFAULT_ARCHITECTURE_DOC if local file is missing (e.g. Vercel)
  if (!content) {
    content = DEFAULT_ARCHITECTURE_DOC
  }

  // 3. Sync / check Supabase global_configs
  if (isSupabaseConfigured && supabase) {
    try {
      const { data } = await supabase
        .from('global_configs')
        .select('value')
        .eq('key', 'architecture_spec')
        .single()

      if (data?.value && data.value.includes('Mục tiêu hệ thống')) {
        content = data.value
      } else {
        // Force sync newest architecture doc to Supabase DB!
        await supabase.from('global_configs').upsert({
          key: 'architecture_spec',
          value: content,
          updatedAt: new Date().toISOString(),
        })
      }
    } catch {}
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
