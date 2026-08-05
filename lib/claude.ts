import { GoogleGenerativeAI } from '@google/generative-ai'
import { TestCase, TestScenario, TestInputData, TestPlan, InputType, ClarificationReport, ClarifyTargetType } from './types'
import { buildRefinePrompt } from './prompts/test-cases'
import { buildTestPlanPrompt } from './prompts/test-plan'
import { buildClarifyPrompt } from './prompts/clarify'
import { configStorage } from './config-storage'

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''
const genAI = new GoogleGenerativeAI(apiKey)

interface ProjectContext {
  name: string
  description: string
  techStack: string
}

interface TestCaseResult {
  feature: string
  scenarios: TestScenario[]
  inputData: TestInputData[]
  testCases: TestCase[]
}

interface RefineResult extends TestCaseResult {
  changesSummary: string
  added: string[]
  updated: string[]
  removed: string[]
}

export const BASE_SYSTEM_TC = `Bạn là QA Engineer senior chuyên nghiệp. Nhiệm vụ: phân tích tài liệu và tạo test cases toàn diện. Luôn trả về JSON hợp lệ theo đúng format, không thêm text nào khác.`

export const BASE_SYSTEM_TP = `Bạn là QA Lead senior chuyên nghiệp. Nhiệm vụ: phân tích tài liệu và tạo Test Plan chuyên nghiệp, đầy đủ. Luôn trả về JSON hợp lệ theo đúng format, không thêm text nào khác.`

export const BASE_SYSTEM_CLARIFY = `Bạn là Business Analyst / QA Analyst senior, chuyên phân tích yêu cầu theo chuẩn ISTQB. Nhiệm vụ: đọc tài liệu, phân tích test basis, và tạo báo cáo làm rõ (clarification report). Luôn trả về JSON hợp lệ theo đúng format, không thêm text nào khác.`

export function parseJson(text: string): any {
  let start = text.indexOf('{')
  if (start === -1) start = text.indexOf('[')
  if (start === -1) throw new Error('Không tìm thấy JSON trong phản hồi')

  let depth = 0
  let end = -1
  for (let i = start; i < text.length; i++) {
    if (text[i] === '{' || text[i] === '[') depth++
    else if (text[i] === '}' || text[i] === ']') {
      depth--
      if (depth === 0) { end = i; break }
    }
  }

  const jsonStr = end !== -1 ? text.slice(start, end + 1) : text.slice(start)
  try {
    return JSON.parse(jsonStr)
  } catch {
    // Try smart repair for trailing unclosed JSON strings/objects caused by token cutoff
    try {
      let repaired = jsonStr.trim().replace(/,\s*$/, '')
      const openBraces = (repaired.match(/\{/g) || []).length - (repaired.match(/\}/g) || []).length
      const openBrackets = (repaired.match(/\[/g) || []).length - (repaired.match(/\]/g) || []).length
      for (let i = 0; i < openBraces; i++) repaired += '}'
      for (let i = 0; i < openBrackets; i++) repaired += ']'
      return JSON.parse(repaired)
    } catch {
      throw new Error('AI trả về JSON không đầy đủ (response bị cắt ngắn). Thử lại.')
    }
  }
}

export function buildSystemPrompt(base: string, instruction: string): string {
  return instruction.trim()
    ? `${base}\n\n## Quy tắc bắt buộc của project này:\n${instruction.trim()}`
    : base
}

// Streaming version — returns Gemini stream with Anthropic-compatible format
export function createClaudeStream(
  systemPrompt: string,
  userPrompt: string,
  imageBase64?: string,
  imageMime?: string,
  responseMimeType?: string
) {
  const currentKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim()

  if (!currentKey || currentKey === 'your_gemini_api_key_here') {
    throw new Error(
      'Chưa cấu hình GEMINI_API_KEY hợp lệ trong file .env.local. Vui lòng lấy key tại https://aistudio.google.com/app/apikey và cập nhật vào .env.local'
    )
  }

  const client = new GoogleGenerativeAI(currentKey)
  const primaryModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const fallbackModels = Array.from(new Set([primaryModel, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-pro']))

  const contents: Array<string | { inlineData: { data: string; mimeType: string } }> = imageBase64
    ? [
        {
          inlineData: {
            data: imageBase64,
            mimeType: imageMime || 'image/png',
          },
        },
        userPrompt,
      ]
    : [userPrompt]

  let finishReason = 'end_turn'

  async function* generator() {
    let resultStream: any = null
    let lastError: any = null

    for (const modelToUse of fallbackModels) {
      let attempts = 0
      const maxAttempts = 2

      while (attempts < maxAttempts) {
        try {
          attempts++
          const model = client.getGenerativeModel({
            model: modelToUse,
            systemInstruction: systemPrompt,
            generationConfig: {
              maxOutputTokens: 16384,
              ...(responseMimeType ? { responseMimeType } : {}),
            },
          })
          resultStream = await model.generateContentStream(contents)
          if (resultStream) break
        } catch (err: any) {
          lastError = err
          const errStr = err?.message || String(err)
          if ((errStr.includes('503') || errStr.includes('Service Unavailable') || errStr.includes('high demand') || errStr.includes('404')) && attempts < maxAttempts) {
            console.warn(`[Gemini API 503] Model ${modelToUse} high demand / unavailable (attempt ${attempts}/${maxAttempts}). Retrying...`)
            await new Promise(res => setTimeout(res, 1000))
            continue
          }
          if (errStr.includes('API_KEY_SERVICE_BLOCKED') || errStr.includes('UNAUTHENTICATED') || errStr.includes('401')) {
            throw new Error('⚠️ API Key hiện tại thuộc Dự án Google Cloud đang bị KHÓA DỊCH VỤ Gemini API (API_KEY_SERVICE_BLOCKED). Vui lòng vào https://aistudio.google.com/app/apikey ➔ Bấm "Create API key" ➔ Chọn "Create API key in NEW project" (Tạo trong dự án mới) để có Key hoạt động ngay lập tức.')
          }
          if (errStr.includes('429') || errStr.includes('Quota exceeded')) {
            throw new Error('⚠️ Dự án Google Cloud của Key hiện tại bị hạn chế dung lượng (Limit = 0 hoặc 429 Rate Limit). Vui lòng vào https://aistudio.google.com/app/apikey ➔ Bấm "Create API key" ➔ Chọn "Create API key in NEW project" (Tạo trong dự án mới).')
          }
          if (errStr.includes('API_KEY_INVALID') || errStr.includes('API key not valid')) {
            throw new Error('⚠️ API Key Gemini không hợp lệ. Vui lòng lấy Key chuẩn (bắt đầu bằng AIzaSy...) từ https://aistudio.google.com/app/apikey và dán vào file .env.local')
          }
          console.warn(`[Gemini API] Model ${modelToUse} failed: ${errStr}. Trying fallback model...`)
          break
        }
      }

      if (resultStream) break
    }

    if (!resultStream) {
      const lastErrStr = lastError?.message || String(lastError)
      if (lastErrStr.includes('503') || lastErrStr.includes('Service Unavailable') || lastErrStr.includes('high demand')) {
        throw new Error('⚠️ Máy chủ Google Gemini hiện đang quá tải tạm thời (503 Service Unavailable). Hệ thống đã tự động thử chuyển sang các model dự phòng (Gemini 2.5/2.0/1.5 Flash) nhưng chưa thành công, vui lòng bấm nút "Chạy lại Agent" sau 5-10 giây.')
      }
      throw new Error(lastErrStr || 'Không thể kết nối đến máy chủ AI')
    }

    try {
      for await (const chunk of resultStream.stream) {
        let text = ''
        try {
          text = chunk.text()
        } catch {
          const parts = chunk.candidates?.[0]?.content?.parts
          if (parts && parts.length > 0 && 'text' in parts[0]) {
            text = (parts[0] as any).text || ''
          }
        }
        if (text) {
          yield {
            type: 'content_block_delta',
            delta: {
              type: 'text_delta',
              text: text,
            },
          }
        }
      }

      const response = await resultStream.response.catch(() => null)
      if (response) {
        const candidate = response.candidates?.[0]
        if (candidate?.finishReason === 'MAX_TOKENS') {
          finishReason = 'max_tokens'
        }
      }
    } catch (err: any) {
      const errStr = err?.message || String(err)
      if (errStr.includes('503') || errStr.includes('Service Unavailable') || errStr.includes('high demand')) {
        throw new Error('⚠️ Máy chủ Google Gemini hiện đang quá tải tạm thời (503 Service Unavailable). Vui lòng thử lại sau vài giây.')
      }
      throw new Error(errStr)
    }
  }

  const gen = generator()
  return Object.assign(gen, {
    finalMessage: async () => ({ stop_reason: finishReason }),
  })
}

// Accumulates a full response via streaming, then returns the complete text with non-streaming fallback.
async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  imageBase64?: string,
  imageMime?: string,
  responseMimeType?: string
): Promise<string> {
  try {
    const stream = createClaudeStream(systemPrompt, userPrompt, imageBase64, imageMime, responseMimeType)
    let fullText = ''
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        fullText += event.delta.text
      }
    }
    if (fullText.trim()) return fullText
  } catch (err: any) {
    const errStr = err?.message || String(err)
    if (errStr.includes('API_KEY') || errStr.includes('401') || errStr.includes('429')) {
      throw err
    }
    console.warn('[callClaude] Stream failed, attempting direct generateContent fallback:', errStr)
  }

  // Resilient Non-Streaming Fallback with Model Failover
  const currentKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim()
  const client = new GoogleGenerativeAI(currentKey)
  const primaryModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const fallbackModels = Array.from(new Set([primaryModel, 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-pro']))

  const contents: Array<string | { inlineData: { data: string; mimeType: string } }> = imageBase64
    ? [{ inlineData: { data: imageBase64, mimeType: imageMime || 'image/png' } }, userPrompt]
    : [userPrompt]

  let lastError: any = null
  for (const modelToUse of fallbackModels) {
    try {
      const model = client.getGenerativeModel({
        model: modelToUse,
        systemInstruction: systemPrompt,
        generationConfig: {
          maxOutputTokens: 16384,
          ...(responseMimeType ? { responseMimeType } : {}),
        },
      })
      const res = await model.generateContent(contents)
      const text = res.response.text()
      if (text) return text
    } catch (err: any) {
      lastError = err
      console.warn(`[callClaude non-stream] Model ${modelToUse} failed:`, err?.message || err)
    }
  }

  throw lastError || new Error('⚠️ Máy chủ Google Gemini đang quá tải. Vui lòng bấm nút "Chạy lại Agent" sau 5-10 giây.')
}

export async function refineTestCases(
  feedback: string,
  inputType: InputType,
  existing: TestCaseResult,
  projectContext: ProjectContext,
  systemInstruction: string = '',
  imageBase64?: string,
  imageMime?: string
): Promise<RefineResult> {
  const systemPrompt = buildSystemPrompt(BASE_SYSTEM_TC, systemInstruction)
  const userPrompt = buildRefinePrompt(
    feedback,
    inputType,
    existing.testCases,
    existing.scenarios,
    existing.inputData,
    projectContext,
    systemInstruction
  )

  const text = await callClaude(systemPrompt, userPrompt, imageBase64, imageMime)
  const parsed = parseJson(text)

  return {
    feature: parsed.feature || existing.feature,
    changesSummary: parsed.changesSummary || '',
    added: parsed.added || [],
    updated: parsed.updated || [],
    removed: parsed.removed || [],
    scenarios: parsed.scenarios || existing.scenarios,
    inputData: parsed.inputData || existing.inputData,
    testCases: parsed.testCases || [],
  }
}

// Requirements Analyst subagent — chạy trước bước sinh để làm rõ tài liệu.
// Non-streaming vì cần JSON hoàn chỉnh để render danh sách câu hỏi.
export async function analyzeRequirements(
  input: string,
  inputType: InputType,
  targetType: ClarifyTargetType,
  projectContext: ProjectContext,
  systemInstruction: string = '',
  imageBase64?: string,
  imageMime?: string
): Promise<ClarificationReport> {
  const systemPrompt = buildSystemPrompt(BASE_SYSTEM_CLARIFY, systemInstruction)

  // Fetch the task prompt for this target type so the sub-agent knows the
  // exact standard & output structure it needs to prepare clarification questions for.
  // e.g. test-case → ISTQB EP&BVA schema; test-plan → IEEE 829 14-section structure
  // Map clarify target type → config-storage key (test-cases→test-case, others match)
  const taskKey = targetType === 'test-cases' ? 'test-case' : targetType
  const taskPromptContent = await configStorage.getTaskPrompt(taskKey)

  const userPrompt = buildClarifyPrompt(input, inputType, targetType, projectContext, systemInstruction, taskPromptContent)
  const text = await callClaude(systemPrompt, userPrompt, imageBase64, imageMime)
  const parsed = parseJson(text)

  return {
    targetType: parsed.targetType || targetType,
    understanding: parsed.understanding || '',
    actors: parsed.actors || [],
    businessRules: parsed.businessRules || [],
    dataFields: parsed.dataFields || [],
    testConditions: parsed.testConditions || [],
    coverageItems: parsed.coverageItems || [],
    testTypes: parsed.testTypes || [],
    nonFunctional: parsed.nonFunctional || [],
    dependencies: parsed.dependencies || [],
    assumptions: parsed.assumptions || [],
    gaps: parsed.gaps || [],
    questions: parsed.questions || [],
  }
}

// Keep for backward compat (refine route may use indirectly)
export async function generateTestPlan(
  input: string,
  inputType: InputType,
  projectContext: ProjectContext,
  systemInstruction: string = '',
  additionalContext?: { timeline?: string; team?: string; objectives?: string },
  imageBase64?: string,
  imageMime?: string
): Promise<TestPlan> {
  const systemPrompt = buildSystemPrompt(BASE_SYSTEM_TP, systemInstruction)
  const userPrompt = buildTestPlanPrompt(input, inputType, projectContext, systemInstruction, additionalContext)
  const text = await callClaude(systemPrompt, userPrompt, imageBase64, imageMime)
  return parseJson(text) as TestPlan
}

// ── Document Builder Agent ──────────────────────────────────────────────────
import { buildQuestionnairePrompt, buildDocumentDraftPrompt } from './prompts/doc-builder'
import { DocBuilderType, DocBuilderStandard, DocBuilderQuestionnaire } from './types'

export const BASE_SYSTEM_DOC_BUILDER = `Bạn là Senior BA / QA Consultant Agent chuyên nghiệp. Nhiệm vụ: thiết lập tài liệu dự án theo các tiêu chuẩn quốc tế (IEEE 829, ISO 29119, ISTQB, Agile AC).`

export async function generateDocBuilderQuestions(
  docType: DocBuilderType,
  standard: DocBuilderStandard,
  initialInput: string,
  projectContext: ProjectContext,
  systemInstruction: string = '',
  imageBase64?: string,
  imageMime?: string,
  previousAnswersText?: string
): Promise<DocBuilderQuestionnaire> {
  const { systemPrompt, userPrompt } = await buildQuestionnairePrompt(docType, standard, initialInput, projectContext, systemInstruction, previousAnswersText)
  const text = await callClaude(systemPrompt, userPrompt, imageBase64, imageMime, 'application/json')
  const parsed = parseJson(text)

  let rawQuestions = parsed.questions || parsed.questionnaire || parsed.items || parsed.questions_list || []
  if (!Array.isArray(rawQuestions) && parsed && typeof parsed === 'object') {
    const arrKey = Object.keys(parsed).find(k => Array.isArray(parsed[k]))
    if (arrKey) rawQuestions = parsed[arrKey]
  }
  const questionsList = Array.isArray(rawQuestions) ? rawQuestions : []

  return {
    docType: parsed.docType || docType,
    standard: parsed.standard || standard,
    title: parsed.title || `Bộ câu hỏi thu thập cho ${docType}`,
    overview: parsed.overview || '',
    questions: questionsList,
  }
}

export async function generateDocBuilderDocument(
  docType: DocBuilderType,
  standard: DocBuilderStandard,
  overview: string,
  answers: Record<string, string>,
  questions: { id: string; section: string; question: string }[],
  projectContext: ProjectContext,
  systemInstruction: string = '',
  extraNotes?: string
): Promise<string> {
  const { systemPrompt, userPrompt } = await buildDocumentDraftPrompt(
    docType,
    standard,
    overview,
    answers,
    questions,
    projectContext,
    systemInstruction,
    extraNotes
  )
  return await callClaude(systemPrompt, userPrompt)
}

// ── PHASE 2: QA Agents Stream Execution ────────────────────────────────────
import { buildQAAgentPrompt } from './prompts/qa-agents'
import { QAAgentType } from './types'

export async function createQAAgentStream(
  agentType: QAAgentType,
  inputDocsText: string,
  userPromptText: string,
  projectContext: ProjectContext,
  systemInstruction: string = '',
  additionalParams?: Record<string, string>,
  imageBase64?: string,
  imageMime?: string
) {
  const { systemPrompt, userPrompt } = await buildQAAgentPrompt(
    agentType,
    inputDocsText,
    userPromptText,
    projectContext,
    systemInstruction,
    additionalParams
  )
  const isJson = agentType === 'test-case' || agentType === 'test-plan'
  return createClaudeStream(systemPrompt, userPrompt, imageBase64, imageMime, isJson ? 'application/json' : undefined)
}
