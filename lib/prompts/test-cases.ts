import { InputType, TestCase, TestScenario, TestInputData } from '../types'

const INPUT_CONTEXT: Record<InputType, string> = {
  text: 'User story / mô tả yêu cầu thông thường',
  srs: 'Tài liệu đặc tả yêu cầu phần mềm (SRS - Software Requirements Specification)',
  brd: 'Tài liệu yêu cầu nghiệp vụ (BRD - Business Requirements Document)',
  image: 'Hình ảnh mockup / wireframe / screenshot của giao diện',
  'user-story': 'Tập hợp user stories và acceptance criteria',
  epic: 'Đặc tả Epic / Feature lớn',
  'api-spec': 'Đặc tả API Endpoint / Swagger / Postman',
}

const MAX_INPUT_CHARS = 12000

export function buildTestCasePrompt(
  input: string,
  inputType: InputType,
  projectContext: { name: string; description: string; techStack: string },
  systemInstruction: string
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

## Nội dung đầu vào
${input}

## Yêu cầu output
Phân tích tài liệu trên và tạo bộ test cases toàn diện. Trả về JSON hợp lệ theo đúng format sau, KHÔNG có text nào khác:

{
  "feature": "Tên feature/chức năng chính",
  "scenarios": [
    {
      "id": "S01",
      "name": "Tên kịch bản test",
      "description": "Mô tả ngắn kịch bản này test điều gì"
    }
  ],
  "inputData": [
    {
      "field": "Tên trường/field cần nhập",
      "validValues": ["Giá trị hợp lệ 1", "Giá trị hợp lệ 2"],
      "invalidValues": ["Giá trị không hợp lệ 1", "Giá trị không hợp lệ 2"]
    }
  ],
  "testCases": [
    {
      "id": "TC001",
      "scenarioId": "S01",
      "feature": "Tên sub-feature",
      "title": "Tên ngắn gọn của test case",
      "priority": "P1",
      "type": "positive",
      "preconditions": "Điều kiện cần có trước khi test",
      "steps": ["Bước 1: ...", "Bước 2: ...", "Bước 3: ..."],
      "expectedResult": "Kết quả mong đợi cụ thể và đo được",
      "testData": "Dữ liệu test cụ thể cần dùng (nếu có)"
    }
  ]
}

## Rules mặc định (System Instruction ghi đè được)
- Tối đa 30 test cases. Nếu cần hơn, ưu tiên các case quan trọng nhất
- priority: "P1" (critical), "P2" (important), "P3" (nice-to-have)
- type: "positive" (happy path), "negative" (sai input/lỗi), "edge" (biên)
- Tỉ lệ: ~40% positive, ~40% negative, ~20% edge
- Mỗi scenario ít nhất 1 P1 positive + 2 negative
- Steps: tối đa 5 bước, mỗi bước dưới 100 ký tự
- expectedResult: 1-2 câu ngắn gọn, rõ ràng
- testData: ghi rõ giá trị cụ thể (không dùng "ví dụ như...")
- Viết bằng Tiếng Việt`
}

export function buildRefinePrompt(
  feedback: string,
  inputType: InputType,
  existingTestCases: TestCase[],
  existingScenarios: TestScenario[],
  existingInputData: TestInputData[],
  projectContext: { name: string; description: string; techStack: string },
  systemInstruction: string
): string {
  const instructionBlock = systemInstruction.trim()
    ? `## System Instruction (Quy tắc bắt buộc tuân theo)\n${systemInstruction.trim()}\n\n`
    : ''

  let existingTCsJson = JSON.stringify(existingTestCases, null, 2)
  if (existingTCsJson.length > 8000) {
    existingTCsJson = existingTCsJson.slice(0, 8000) + '\n... (rút gọn)'
  }
  const existingScenariosJson = JSON.stringify(existingScenarios, null, 2)

  return `${instructionBlock}## Project Context
- Tên project: ${projectContext.name}
- Mô tả: ${projectContext.description}
- Tech stack: ${projectContext.techStack}

## Bộ test cases HIỆN TẠI (cần review và cải thiện)
### Scenarios hiện tại:
${existingScenariosJson}

### Test Cases hiện tại:
${existingTCsJson}

## Yêu cầu tinh chỉnh / Input bổ sung
${feedback}

## Nhiệm vụ
1. Review toàn bộ test cases hiện tại
2. Thêm test cases mới từ yêu cầu bổ sung
3. Cập nhật test cases cũ nếu cần (sửa steps, expected result, priority)
4. Loại bỏ test cases trùng lặp hoặc không còn phù hợp
5. Trả về bộ test cases đầy đủ, đã được hợp nhất và tối ưu

Trả về JSON hợp lệ theo đúng format sau, KHÔNG có text nào khác:

{
  "feature": "Tên feature chính",
  "changesSummary": "Tóm tắt ngắn những thay đổi đã thực hiện",
  "added": ["TC ID mới thêm"],
  "updated": ["TC ID đã cập nhật"],
  "removed": ["TC ID đã xoá do trùng/không phù hợp"],
  "scenarios": [...],
  "inputData": [...],
  "testCases": [...]
}`
}
