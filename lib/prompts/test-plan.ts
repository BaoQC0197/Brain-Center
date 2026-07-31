import { InputType } from '../types'

const INPUT_CONTEXT: Record<InputType, string> = {
  text: 'Mô tả / yêu cầu thông thường',
  srs: 'Tài liệu đặc tả yêu cầu phần mềm (SRS)',
  brd: 'Tài liệu yêu cầu nghiệp vụ (BRD)',
  image: 'Hình ảnh mockup / wireframe / danh sách tính năng',
  'user-story': 'Tập hợp user stories và acceptance criteria',
  epic: 'Đặc tả Epic / Feature lớn',
  'api-spec': 'Đặc tả API Endpoint / Swagger / Postman',
}

const MAX_INPUT_CHARS = 12000

export function buildTestPlanPrompt(
  input: string,
  inputType: InputType,
  projectContext: { name: string; description: string; techStack: string },
  systemInstruction: string,
  additionalContext?: { timeline?: string; team?: string; objectives?: string }
): string {
  if (input.length > MAX_INPUT_CHARS) {
    input = input.slice(0, MAX_INPUT_CHARS) + '\n\n[... nội dung đã được rút gọn do quá dài ...]'
  }
  const instructionBlock = systemInstruction.trim()
    ? `## System Instruction (Quy tắc bắt buộc tuân theo)\n${systemInstruction.trim()}\n\n`
    : ''

  const ctxBlock = additionalContext
    ? `## Context bổ sung
- Timeline: ${additionalContext.timeline || 'Chưa xác định'}
- Team/Resources: ${additionalContext.team || 'Chưa xác định'}
- Mục tiêu cụ thể: ${additionalContext.objectives || 'Theo yêu cầu chung'}

`
    : ''

  return `${instructionBlock}## Project Context
- Tên project: ${projectContext.name}
- Mô tả: ${projectContext.description}
- Tech stack: ${projectContext.techStack}

${ctxBlock}## Loại tài liệu đầu vào
${INPUT_CONTEXT[inputType]}

## Nội dung đầu vào
${input}

## Nhiệm vụ
Phân tích tài liệu trên và tạo Test Plan chuyên nghiệp. Trả về JSON hợp lệ theo đúng format, KHÔNG có text nào khác:

{
  "title": "Test Plan — [Tên tính năng/Sprint/Release]",
  "version": "1.0",
  "scope": "Mô tả phạm vi kiểm thử: hệ thống/module nào sẽ được test, test trên môi trường nào",
  "objectives": [
    "Mục tiêu 1: đảm bảo X hoạt động đúng theo yêu cầu",
    "Mục tiêu 2: ..."
  ],
  "testStrategy": "Mô tả chiến lược test tổng thể: test từ layer nào, automation hay manual, ưu tiên gì",
  "testTypes": ["Functional Testing", "Regression Testing", "UI Testing", "API Testing"],
  "featuresToTest": [
    "Tính năng 1: mô tả ngắn",
    "Tính năng 2: mô tả ngắn"
  ],
  "featuresToSkip": [
    "Module X: lý do không test (ví dụ: đã có coverage, ngoài scope)"
  ],
  "entryExitCriteria": {
    "entry": [
      "Build đã được deploy lên môi trường test",
      "Test data đã được chuẩn bị"
    ],
    "exit": [
      "100% P1 test cases passed",
      "Không còn bug blocker/critical"
    ]
  },
  "risks": [
    {
      "risk": "Mô tả rủi ro",
      "impact": "Cao",
      "mitigation": "Giải pháp giảm thiểu"
    }
  ],
  "testEnvironment": "Mô tả môi trường: OS, browser, device, API endpoint, DB",
  "schedule": "Timeline dự kiến: estimate effort và phân bổ thời gian",
  "resources": [
    "QA Engineer: X người",
    "Tool: Jira, TestRail, Postman..."
  ]
}`
}
