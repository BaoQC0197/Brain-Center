import { InputType, ClarifyTargetType } from '../types'

const INPUT_CONTEXT: Record<InputType, string> = {
  text: 'User story / mô tả yêu cầu thông thường',
  srs: 'Tài liệu đặc tả yêu cầu phần mềm (SRS - Software Requirements Specification)',
  brd: 'Tài liệu yêu cầu nghiệp vụ (BRD - Business Requirements Document)',
  image: 'Hình ảnh mockup / wireframe / screenshot của giao diện',
  'user-story': 'Tập hợp user stories và acceptance criteria',
  epic: 'Đặc tả Epic / Feature lớn',
  'api-spec': 'Đặc tả API Endpoint / Swagger / Postman',
}

// Điều chỉnh trọng tâm phân tích theo loại tài liệu sẽ sinh ở bước sau.
// Thêm loại mới = thêm 1 dòng ở đây + thêm literal vào union ClarifyTargetType.
const TARGET_FRAMING: Record<ClarifyTargetType, string> = {
  'review-requirement':
    'Tài liệu đích: REVIEW REQUIREMENT REPORT. Tập trung làm rõ: tính đầy đủ, nhất quán, rõ ràng và khả năng kiểm thử của yêu cầu. Xác định điểm mơ hồ, mâu thuẫn và thiếu sót cần clarify.',
  'acceptance-criteria':
    'Tài liệu đích: ACCEPTANCE CRITERIA (BDD Gherkin). Tập trung làm rõ: actors, happy path, negative scenarios, edge cases, data fields & validation rules, preconditions và expected outcomes.',
  'test-strategy':
    'Tài liệu đích: TEST STRATEGY. Tập trung làm rõ: ranh giới scope (in/out), các test levels cần thiết (unit/integration/system/UAT), test types, risk matrix, entry/exit criteria, tooling và team.',
  'test-plan':
    'Tài liệu đích: TEST PLAN. Tập trung làm rõ: ranh giới scope (test gì / không test gì), các loại test cần thiết, tiêu chí entry/exit, rủi ro, phụ thuộc, môi trường và nguồn lực.',
  'test-scenario':
    'Tài liệu đích: TEST SCENARIOS. Tập trung làm rõ: các user journey, luồng tích hợp, system boundaries, module grouping, bao phủ tất cả happy path và negative flow chính.',
  'test-cases':
    'Tài liệu đích: TEST CASES. Tập trung làm rõ: test conditions, coverage items, các trường dữ liệu & ràng buộc (kiểu, định dạng, min/max, bắt buộc/tuỳ chọn, giá trị biên), actors, và các trigger cho happy path / negative / edge case.',
  'regression-checklist':
    'Tài liệu đích: REGRESSION CHECKLIST. Tập trung làm rõ: các feature/module rủi ro cao nhất, các luồng P1/P2 cốt lõi, integration points dễ bị ảnh hưởng và tần suất regression cần thiết.',
  'test-report':
    'Tài liệu đích: TEST REPORT. Tập trung làm rõ: metrics sẵn có, định nghĩa pass/fail, phân loại mức độ nghiêm trọng defect, và phạm vi đã test.',
}


const MAX_INPUT_CHARS = 12000

export function buildClarifyPrompt(
  input: string,
  inputType: InputType,
  targetType: ClarifyTargetType,
  projectContext: { name: string; description: string; techStack: string },
  systemInstruction: string,
  taskPromptContent?: string
): string {
  if (input.length > MAX_INPUT_CHARS) {
    input = input.slice(0, MAX_INPUT_CHARS) + '\n\n[... nội dung đã được rút gọn do quá dài ...]'
  }
  const instructionBlock = systemInstruction.trim()
    ? `## System Instruction (Quy tắc bắt buộc tuân theo)\n${systemInstruction.trim()}\n\n`
    : ''

  return `${instructionBlock}## Project Context
- Tên project: ${projectContext.name}
- Mô tả: ${projectContext.description}
- Tech stack: ${projectContext.techStack}

## Loại tài liệu đầu vào
${INPUT_CONTEXT[inputType]}

## Mục tiêu phân tích — Tài liệu đích & Tiêu chuẩn bắt buộc
${TARGET_FRAMING[targetType]}
${taskPromptContent?.trim() ? `
### Tiêu chuẩn quốc tế & Cấu trúc chi tiết của tài liệu đích
> ⚠️ BẮT BUỘC: Sub-agent phải đặt câu hỏi đủ để Agent chính có thể tạo tài liệu đúng theo toàn bộ cấu trúc & tiêu chuẩn sau:

${taskPromptContent.trim()}
` : ''}
## Nội dung tài liệu đầu vào cần phân tích
${input}

## Nhiệm vụ
Đóng vai Business Analyst / QA Analyst senior. Phân tích tài liệu trên theo chuẩn ISTQB (test basis, test conditions, coverage items). Mục tiêu là LÀM RÕ để bước sau viết được tài liệu chất lượng, đầy đủ:
1. Tóm tắt hiểu biết về hệ thống/feature.
2. Xác định actors, business rules, data fields + ràng buộc, test conditions, coverage items, test types, yêu cầu phi chức năng, phụ thuộc.
3. Nêu các GIẢ ĐỊNH bạn tự đưa ra (khi tài liệu chưa nói rõ).
4. Chỉ ra các CHỖ THIẾU / MƠ HỒ (gaps).
5. Đặt CÂU HỎI LÀM RÕ (KHÔNG gợi ý sẵn câu trả lời). Để trường suggestedAnswer là chuỗi rỗng "".

Trả về JSON hợp lệ theo đúng format sau, KHÔNG có text nào khác:

{
  "targetType": "${targetType}",
  "understanding": "2-4 câu tóm tắt hệ thống/feature làm gì",
  "actors": ["Vai trò/người dùng liên quan"],
  "businessRules": ["Quy tắc nghiệp vụ đã xác định"],
  "dataFields": [
    { "field": "Tên trường", "constraints": "Kiểu, định dạng, min/max, bắt buộc/tuỳ chọn" }
  ],
  "testConditions": ["Điều kiện test theo ISTQB"],
  "coverageItems": ["Coverage item cần bao phủ"],
  "testTypes": ["Loại test đề xuất (functional, boundary, security...)"],
  "nonFunctional": ["Yêu cầu phi chức năng (hiệu năng, bảo mật, khả dụng...)"],
  "dependencies": ["Phụ thuộc bên ngoài / hệ thống liên quan"],
  "assumptions": ["Giả định đã tự đưa ra"],
  "gaps": ["Thông tin còn thiếu hoặc mơ hồ cần bổ sung"],
  "questions": [
    {
      "id": "Q01",
      "category": "businessRules",
      "question": "Câu hỏi làm rõ cụ thể",
      "why": "Vì sao cần biết để viết test tốt",
      "suggestedAnswer": ""
    }
  ]
}

## Rules
- category chỉ nhận: "actors" | "businessRules" | "data" | "coverage" | "nonFunctional" | "dependencies" | "assumptions" | "general"
- Tối đa 12 câu hỏi, ưu tiên câu ảnh hưởng lớn nhất tới chất lượng test
- Nếu tài liệu đã đủ rõ, để "questions" là mảng rỗng
- KHÔNG sinh gợi ý câu trả lời cho các câu hỏi phỏng vấn (suggestedAnswer luôn để chuỗi rỗng "")
- Viết bằng Tiếng Việt`
}
