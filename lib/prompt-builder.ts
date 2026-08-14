import { configStorage } from './config-storage'

export interface ProjectContext {
  name: string
  description: string
  techStack: string
}

export interface PromptBuilderInput {
  taskKey: string
  projectContext: ProjectContext
  knowledgeBaseText?: string
  userPromptText?: string
  projectInstructionOverride?: string
  additionalParams?: Record<string, string>
}

export interface AssembledPrompt {
  systemPrompt: string
  userPrompt: string
}

/**
 * Central Prompt Builder Engine
 * Assembles System Instruction + Task Prompt + Project Context + Knowledge Base (Requirements Baseline)
 */
export async function buildAssembledPrompt(input: PromptBuilderInput): Promise<AssembledPrompt> {
  const {
    taskKey,
    projectContext,
    knowledgeBaseText = '',
    userPromptText = '',
    projectInstructionOverride = '',
    additionalParams,
  } = input

  // 1. Layer 1: System Instruction ("AI là ai?")
  const globalSystemInstruction = await configStorage.getGlobalSystemInstruction()
  let systemPrompt = globalSystemInstruction.trim()

  if (projectInstructionOverride && projectInstructionOverride.trim()) {
    systemPrompt += `\n\n## QUY TẮC ĐẶC THÙ RIÊNG CỦA PROJECT NÀY:\n${projectInstructionOverride.trim()}`
  }

  // 2. Layer 2: Task Prompt ("Làm nhiệm vụ gì?")
  const taskPromptConfig = await configStorage.getTaskPrompt(taskKey)

  const figmaPromptText = additionalParams?.figmaLinks
    ? `\n\n📌 **BẮT BUỘC VỀ TÀI LIỆU THAM CHIẾU**: Trong phần thông tin đầu trang "Tài liệu tham chiếu" (Reference Documents) của báo cáo/tài liệu, BẮT BUỘC phải trích dẫn chi tiết danh sách Link Figma Design: [Figma Link](${additionalParams.figmaLinks}) và tên các tài liệu Phase 1 được tham chiếu.`
    : ''

  // 3. Layer 3 & 4: Project Context & Knowledge Base Search ("Project hiện tại" & "Requirement/BRD Baseline")
  let userPrompt = `## 1. PROJECT CONTEXT (PROJECT HIỆN TẠI):
- Tên dự án: ${projectContext.name}
- Mô tả dự án: ${projectContext.description || 'Chưa có mô tả'}
- Tech Stack: ${projectContext.techStack || 'Chưa rõ'}${figmaPromptText}

## 2. KNOWLEDGE BASE SEARCH & REQUIREMENTS BASELINE:
${knowledgeBaseText.trim() || '(Không có tài liệu Yêu cầu Baseline đính kèm)'}

${userPromptText.trim() ? `## 3. THÔNG TIN VÀ YÊU CẦU BỔ SUNG TỪ USER/QA:\n${userPromptText.trim()}\n` : ''}
${additionalParams?.clarifyContext ? `## 4. BÁO CÁO LÀM RÕ YÊU CẦU (Requirements Analyst Sub-agent):\n> Đây là kết quả phân tích từ Requirements Analyst Sub-agent. BẮT BUỘC đọc kỹ và áp dụng toàn bộ câu trả lời làm rõ bên dưới để sinh tài liệu chính xác nhất.\n\n${additionalParams.clarifyContext}\n` : ''}
${additionalParams && Object.keys(additionalParams).filter(k => k !== 'clarifyContext').length > 0 ? `## ${additionalParams?.clarifyContext ? '5' : '4'}. THAM SỐ CẤU HÌNH BỔ SUNG:\n${JSON.stringify(Object.fromEntries(Object.entries(additionalParams).filter(([k]) => k !== 'clarifyContext')), null, 2)}\n` : ''}
## ${additionalParams?.clarifyContext ? '6' : additionalParams && Object.keys(additionalParams).filter(k => k !== 'clarifyContext').length > 0 ? '5' : '4'}. NHIỆM VỤ THỰC THI (TASK PROMPT):
${taskPromptConfig.trim()}
`

  return { systemPrompt, userPrompt }
}
