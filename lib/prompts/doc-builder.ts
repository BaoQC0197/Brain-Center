import { DocBuilderType, DocBuilderStandard, DOC_BUILDER_TYPES, DOC_BUILDER_STANDARDS } from '../types'
import { buildAssembledPrompt, ProjectContext } from '../prompt-builder'

export function getDocTypeTaskKey(docType: DocBuilderType): string {
  switch (docType) {
    case 'brd': return 'doc_builder_brd'
    case 'srs': return 'doc_builder_srs'
    case 'user-story': return 'doc_builder_user_story'
    case 'api-spec': return 'doc_builder_api_spec'
    case 'change-request': return 'doc_builder_change_request'
    default: return 'doc_builder_srs'
  }
}

export async function buildQuestionnairePrompt(
  docType: DocBuilderType,
  standard: DocBuilderStandard,
  initialInput: string,
  projectContext: ProjectContext,
  systemInstruction?: string,
  previousAnswersText?: string
): Promise<{ systemPrompt: string; userPrompt: string }> {
  const typeMeta = DOC_BUILDER_TYPES[docType] || { label: docType, desc: docType }
  const stdMeta = DOC_BUILDER_STANDARDS[standard] || { label: standard, tag: standard, desc: standard }
  const taskKey = getDocTypeTaskKey(docType)
  const isRound1 = !previousAnswersText || !previousAnswersText.trim()

  const kbText = previousAnswersText
    ? `MÔ TẢ BAN ĐẦU:\n${initialInput}\n\nLỊCH SỬ PHỎNG VẤN VÀ CÂU TRẢ LỜI CÁC VÒNG TRƯỚC:\n${previousAnswersText}`
    : (initialInput || 'Chưa có mô tả ban đầu (Người dùng bắt đầu phỏng vấn Vòng 1).')

  const jsonSchemaFormat = `

BẮT BUỘC TRẢ VỀ JSON HỢP LỆ 100% THEO ĐÚNG CẤU TRÚC KHUÔN MẪU SAU (KHÔNG THÊM VĂN BẢN NGOÀI JSON):
{
  "docType": "${docType}",
  "standard": "${standard}",
  "title": "Bộ câu hỏi phỏng vấn ${isRound1 ? 'Vòng 1 (Thăm dò tổng quan)' : 'bổ sung Vòng tiếp theo'} cho ${typeMeta.label}",
  "overview": "Tóm tắt định hướng chiến lược cho tài liệu ${typeMeta.label} dự án ${projectContext.name}",
  "questions": [
    {
      "id": "Q1",
      "section": "Thăm dò Mục tiêu & Phạm vi",
      "question": "Nội dung câu hỏi ngắn gọn...",
      "why": "Lý do hỏi...",
      "suggestedAnswer": ""
    },
    {
      "id": "Q2",
      "section": "Thăm dò Người dùng & Nền tảng",
      "question": "Nội dung câu hỏi ngắn gọn...",
      "why": "Lý do hỏi...",
      "suggestedAnswer": ""
    }
  ]
}`

  const userReqText = isRound1
    ? `YÊU CẦU PHỎNG VẤN VÒNG 1 (THĂM DÒ TỔNG QUAN):
BẮT BUỘC CHỈ SINH ĐÚNG 2 CÂU HỎI TỔNG QUAN, NGẮN GỌN VÀ DỄ TRẢ LỜI để thăm dò người dùng muốn làm sản phẩm/tính năng gì.
- Câu 1: Bài toán kinh doanh cốt lõi & Mục tiêu lớn nhất mà tài liệu ${typeMeta.label} này cần giải quyết là gì?
- Câu 2: Ai là đối tượng người dùng chính (Target User Personas) và phạm vi hệ thống mong muốn?
TUYỆT ĐỐI KHÔNG ĐẶT CÂU HỎI QUÁ SÂU HOẶC QUÁ CHI TIẾT KỸ THUẬT Ở VÒNG 1 ĐỂ TRÁNH LẠC ĐỀ.
Tiêu chuẩn áp dụng: ${stdMeta.label} (${stdMeta.tag})${jsonSchemaFormat}`
    : `YÊU CẦU PHỎNG VẤN ĐÀO SÂU VÒNG TIẾP THEO:
Nhiệm vụ của bạn:
1. Đọc kỹ và phân tích trực tiếp các CÂU TRẢ LỜI CỦA NGƯỜI DÙNG từ các vòng trước (trong phần LỊCH SỬ PHỎNG VẤN).
2. Tìm ra những điểm thông tin còn thiếu, khía cạnh chưa rõ hoặc bẫy lỗi nghiệp vụ phát sinh trực tiếp từ câu trả lời của người dùng.
3. Sinh BẮT BUỘC ĐÚNG 2 CÂU HỎI BỔ SUNG ĐÀO SÂU NHẤT tập trung vào Luồng nghiệp vụ (Workflow), Quy tắc (Business Rules) hoặc Kịch bản ngoại lệ còn thiếu cho ${typeMeta.label}.
Tiêu chuẩn áp dụng: ${stdMeta.label} (${stdMeta.tag})${jsonSchemaFormat}`

  return buildAssembledPrompt({
    taskKey,
    projectContext,
    knowledgeBaseText: kbText,
    userPromptText: userReqText,
    projectInstructionOverride: systemInstruction,
  })
}

export async function buildDocumentDraftPrompt(
  docType: DocBuilderType,
  standard: DocBuilderStandard,
  overview: string,
  answers: Record<string, string>,
  questions: { id: string; section: string; question: string }[],
  projectContext: ProjectContext,
  systemInstruction?: string,
  extraNotes?: string
): Promise<{ systemPrompt: string; userPrompt: string }> {
  const typeMeta = DOC_BUILDER_TYPES[docType] || { label: docType, desc: docType }
  const stdMeta = DOC_BUILDER_STANDARDS[standard] || { label: standard, tag: standard, desc: standard }
  const taskKey = getDocTypeTaskKey(docType)

  const formattedQA = questions.map(q => {
    const ans = (answers[q.id] || '').trim() || '(BA/PO áp dụng thiết kế tiêu chuẩn)'
    return `### [${q.section}] ${q.question}\n- **Nội dung thu thập:** ${ans}`
  }).join('\n\n')

  const kbText = `TÓM TẮT ĐỊNH HƯỚNG:\n${overview}\n\nTHÔNG TIN ĐÃ THU THẬP TỪ CÂU HỎI PHỎNG VẤN:\n${formattedQA}`

  const userReqText = `YÊU CẦU: Biên soạn hoàn chỉnh tài liệu Phase 1: ${typeMeta.label}.\nBẮT BUỘC: Cấu trúc tài liệu phân chia theo ĐÚNG CÁC BƯỚC QUY CHUẨN của ${typeMeta.label}.\nTiêu chuẩn áp dụng: ${stdMeta.label}${extraNotes ? `\nGhi chú thêm: ${extraNotes}` : ''}

QUY TẮC QUAN TRỌNG KHI THÔNG TIN ĐẦU VÀO CÒN MƠ HỒ HOẶC THIẾU CÂU TRẢ LỜI:
- Với bất kỳ mục nghiệp vụ nào còn chưa có câu trả lời chi tiết từ người dùng, bạn với tư cách Senior Business Analyst hãy tự động đề xuất CÁC GIẢ ĐỊNH THIẾT KẾ CHUẨN MỰC (Standard Business Assumptions) để tạo ra tài liệu ${typeMeta.label} hoàn chỉnh 100%, mạch lạc, không để trống hoặc dùng ký tự giữ chỗ [Placeholder].
- Tất cả các giả định tự đưa ra phải được trình bày rõ ràng trong mục "3. Các Giả định & Ràng buộc Nghiệp vụ (Business Assumptions & Constraints)".`

  return buildAssembledPrompt({
    taskKey,
    projectContext,
    knowledgeBaseText: kbText,
    userPromptText: userReqText,
    projectInstructionOverride: systemInstruction,
  })
}
