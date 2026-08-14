'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Project,
  GeneratedDocument,
  InputType,
  TestCase,
  RawDocument,
  RAW_DOC_META,
  QA_AGENTS,
  QAAgentType,
  ClarificationReport,
  ClarifyQuestion,
} from '@/lib/types'
import DocumentViewer from '@/app/components/DocumentViewer'
import { AiProcessingProgressModal, ProjectDetailSkeleton } from '@/app/components/Skeletons'

const PRIORITY_COLOR: Record<string, string> = {
  P1: 'bg-red-100 text-red-800 border border-red-300',
  P2: 'bg-amber-100 text-amber-800 border border-amber-300',
  P3: 'bg-blue-100 text-blue-800 border border-blue-300',
}

const TYPE_COLOR: Record<string, string> = {
  positive: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
  negative: 'bg-red-100 text-red-800 border border-red-300',
  edge: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
}

const TYPE_LABEL: Record<string, string> = {
  positive: 'Happy Path',
  negative: 'Negative Case',
  edge: 'Edge Case',
}

export const STEP_DIRECTIVES: Record<QAAgentType, { id: string; label: string }[]> = {
  'review-requirement': [
    { id: 'req-gaps', label: 'Rà soát Lỗ hổng và Điểm mơ hồ (Gaps và Ambiguities)' },
    { id: 'bdd-gherkin', label: 'Tiêu chuẩn Nghiệm thu BDD Gherkin (Given-When-Then)' },
    { id: 'business-rules', label: 'Ràng buộc Quy tắc Nghiệp vụ (Business Rules)' },
    { id: 'rbac-matrix', label: 'Phân quyền người dùng và Ma trận RBAC' },
    { id: 'edge-cases', label: 'Phân tích Trường hợp biên và Kịch bản lỗi (Edge Cases)' },
  ],
  'acceptance-criteria': [
    { id: 'req-gaps', label: 'Rà soát Lỗ hổng và Điểm mơ hồ (Gaps và Ambiguities)' },
    { id: 'bdd-gherkin', label: 'Tiêu chuẩn Nghiệm thu BDD Gherkin (Given-When-Then)' },
    { id: 'business-rules', label: 'Ràng buộc Quy tắc Nghiệp vụ (Business Rules)' },
    { id: 'rbac-matrix', label: 'Phân quyền người dùng và Ma trận RBAC' },
    { id: 'edge-cases', label: 'Phân tích Trường hợp biên và Kịch bản lỗi (Edge Cases)' },
  ],
  'test-plan': [
    { id: 'risk-matrix', label: 'Ma trận Bao phủ Rủi ro (Risk-Based Testing Matrix)' },
    { id: 'test-env', label: 'Môi trường và Thiết bị Kiểm thử (Test Environments)' },
    { id: 'exit-criteria', label: 'Tiêu chuẩn Dừng và Chấp nhận (Entry và Exit Criteria)' },
    { id: 'test-levels', label: 'Phân bổ Cấp độ Test (Integration, System và UAT)' },
    { id: 'resource-schedule', label: 'Lịch trình và Phân bổ Nguồn lực (Test Schedule)' },
  ],
  'test-strategy': [
    { id: 'risk-matrix', label: 'Ma trận Bao phủ Rủi ro (Risk-Based Testing Matrix)' },
    { id: 'test-env', label: 'Môi trường và Thiết bị Kiểm thử (Test Environments)' },
    { id: 'exit-criteria', label: 'Tiêu chuẩn Dừng và Chấp nhận (Entry và Exit Criteria)' },
    { id: 'test-levels', label: 'Phân bổ Cấp độ Test (Integration, System và UAT)' },
    { id: 'resource-schedule', label: 'Lịch trình và Phân bổ Nguồn lực (Test Schedule)' },
  ],
  'test-scenario': [
    { id: 'functional', label: 'Functional (Luồng chính Happy Path)' },
    { id: 'non-functional', label: 'Negative (Kịch bản lỗi và Boundary Cases)' },
    { id: 'security', label: 'Security và RBAC (Bảo mật và Phân quyền)' },
    { id: 'performance', label: 'Performance và Load (Hiệu năng và SLA)' },
    { id: 'cross-platform', label: 'Cross-Platform UI/UX (Đa thiết bị, Responsive)' },
    { id: 'api-schema', label: 'API và Integration (Tích hợp Endpoint và Schema)' },
    { id: 'exception-fallback', label: 'Exception và Recovery (Xử lý lỗi và Phục hồi)' },
  ],
  'test-case': [
    { id: 'functional', label: 'Functional (Luồng chính Happy Path)' },
    { id: 'non-functional', label: 'Negative (Kịch bản lỗi và Boundary Cases)' },
    { id: 'security', label: 'Security và RBAC (Bảo mật và Phân quyền)' },
    { id: 'performance', label: 'Performance và Load (Hiệu năng và SLA)' },
    { id: 'cross-platform', label: 'Cross-Platform UI/UX (Đa thiết bị, Responsive)' },
    { id: 'api-schema', label: 'API và Integration (Tích hợp Endpoint và Schema)' },
    { id: 'exception-fallback', label: 'Exception và Recovery (Xử lý lỗi và Phục hồi)' },
  ],
  'regression-checklist': [
    { id: 'go-nogo', label: 'Quyết định Release (Go/No-Go Decision Matrix)' },
    { id: 'critical-suite', label: 'Danh mục Kiểm thử Hồi quy Trọng yếu (Critical Regression Suite)' },
    { id: 'outstanding-bugs', label: 'Phân tích Rủi ro lỗi còn tồn đọng (Outstanding Defects)' },
    { id: 'coverage-stats', label: 'Thống kê Tỷ lệ Pass/Fail và Test Coverage' },
    { id: 'qa-recommendations', label: 'Khuyến nghị cho Đội ngũ Dev/PO (Actionable QA Recommendations)' },
  ],
  'test-report': [
    { id: 'go-nogo', label: 'Quyết định Release (Go/No-Go Decision Matrix)' },
    { id: 'critical-suite', label: 'Danh mục Kiểm thử Hồi quy Trọng yếu (Critical Regression Suite)' },
    { id: 'outstanding-bugs', label: 'Phân tích Rủi ro lỗi còn tồn đọng (Outstanding Defects)' },
    { id: 'coverage-stats', label: 'Thống kê Tỷ lệ Pass/Fail và Test Coverage' },
    { id: 'qa-recommendations', label: 'Khuyến nghị cho Đội ngũ Dev/PO (Actionable QA Recommendations)' },
  ],
}

// Map agent type → clarify target type (same as agent key for all Phase 2)
const AGENT_TO_CLARIFY_TARGET: Record<QAAgentType, string> = {
  'review-requirement': 'review-requirement',
  'acceptance-criteria': 'acceptance-criteria',
  'test-strategy': 'test-strategy',
  'test-plan': 'test-plan',
  'test-scenario': 'test-scenario',
  'test-case': 'test-cases',
  'regression-checklist': 'regression-checklist',
  'test-report': 'test-report',
}

function parseDirectivesText(text?: string): { id: string; label: string }[] {
  if (!text) return []
  return text.split('\n').map(line => line.trim()).filter(Boolean).map(line => {
    const parts = line.split('|')
    if (parts.length >= 2) {
      return { id: parts[0].trim(), label: parts.slice(1).join('|').trim() }
    }
    return { id: line, label: line }
  })
}

export default function QAAgentHubPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const searchParams = useSearchParams()
  const agentParam = (searchParams.get('agent') as QAAgentType) || 'test-case'

  const [project, setProject] = useState<Project | null>(null)
  const [rawDocs, setRawDocs] = useState<RawDocument[]>([])
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDocument[]>([])
  const [selectedRawIds, setSelectedRawIds] = useState<Set<string>>(new Set())

  // Agent & Directives State
  const [selectedAgent, setSelectedAgent] = useState<QAAgentType>(agentParam)
  const [stepDirectivesMap, setStepDirectivesMap] = useState<Record<string, { id: string; label: string }[]>>(STEP_DIRECTIVES)
  const [selectedDirectives, setSelectedDirectives] = useState<Set<string>>(new Set(['functional']))
  const [inputType, setInputType] = useState<InputType>('text')
  const [textInput, setTextInput] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Clarify Sub-agent State
  type ClarifyPhase = 'idle' | 'analyzing' | 'questioning' | 'executing'
  const [clarifyPhase, setClarifyPhase] = useState<ClarifyPhase>('idle')
  const [clarifyReport, setClarifyReport] = useState<ClarificationReport | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [clarifyError, setClarifyError] = useState('')

  // Execution State
  const [loading, setLoading] = useState(false)
  const [streamChars, setStreamChars] = useState(0)
  const [result, setResult] = useState<GeneratedDocument | null>(null)
  const [rawMarkdownOutput, setRawMarkdownOutput] = useState<string>('')
  const [error, setError] = useState('')

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    setPageLoading(true)
    Promise.all([
      fetch(`/api/projects/${projectId}`).then(r => r.json()),
      fetch(`/api/projects/${projectId}/raw-docs`).then(r => r.json()),
      fetch(`/api/projects/${projectId}/documents`).then(r => r.json()),
      fetch('/api/configs').then(r => r.json()).catch(() => ({})),
    ]).then(([proj, raws, docs, configsData]) => {
      setProject(proj)
      setRawDocs(raws)
      setGeneratedDocs(docs)
      const ids = new Set<string>(raws.map((d: RawDocument) => d.id))
      setSelectedRawIds(ids)

      let currentMap = STEP_DIRECTIVES
      if (configsData?.configs) {
        const cfg = configsData.configs
        currentMap = {
          'review-requirement': parseDirectivesText(cfg['directives_step1']?.content) || STEP_DIRECTIVES['review-requirement'],
          'acceptance-criteria': parseDirectivesText(cfg['directives_step1']?.content) || STEP_DIRECTIVES['acceptance-criteria'],
          'test-plan': parseDirectivesText(cfg['directives_step2']?.content) || STEP_DIRECTIVES['test-plan'],
          'test-strategy': parseDirectivesText(cfg['directives_step2']?.content) || STEP_DIRECTIVES['test-strategy'],
          'test-case': parseDirectivesText(cfg['directives_step3']?.content) || STEP_DIRECTIVES['test-case'],
          'test-scenario': parseDirectivesText(cfg['directives_step3']?.content) || STEP_DIRECTIVES['test-scenario'],
          'regression-checklist': parseDirectivesText(cfg['directives_step4']?.content) || STEP_DIRECTIVES['regression-checklist'],
          'test-report': parseDirectivesText(cfg['directives_step4']?.content) || STEP_DIRECTIVES['test-report'],
        }
        setStepDirectivesMap(currentMap)
      }

      const initialAgent = (agentParam && QA_AGENTS[agentParam]) ? agentParam : 'test-case'
      setSelectedAgent(initialAgent)
      const currentDirectives = currentMap[initialAgent] || []
      setSelectedDirectives(new Set(currentDirectives.slice(0, 3).map(d => d.id)))

      if (Array.isArray(docs) && docs.length > 0) {
        const existingDoc = docs.find((d: GeneratedDocument) => (d.type as string) === (initialAgent as string) || (initialAgent === 'test-case' && ((d.type as string) === 'test-case' || (d.type as string) === 'test-cases')))
        if (existingDoc) setResult(existingDoc)
      }
    }).finally(() => {
      setPageLoading(false)
    })
  }, [projectId, agentParam])

  function handleSelectAgent(type: QAAgentType) {
    setSelectedAgent(type)
    const existingDoc = generatedDocs.find(d => (d.type as string) === (type as string) || (type === 'test-case' && ((d.type as string) === 'test-case' || (d.type as string) === 'test-cases')))
    setResult(existingDoc || null)
    setRawMarkdownOutput('')
    setClarifyPhase('idle')
    setClarifyReport(null)
    setAnswers({})
    const currentDirectives = stepDirectivesMap[type] || STEP_DIRECTIVES[type] || []
    setSelectedDirectives(new Set(currentDirectives.slice(0, 3).map(d => d.id)))
  }

  function toggleRaw(id: string) {
    setSelectedRawIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleDirective(id: string) {
    setSelectedDirectives(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function buildCombinedInput(): Promise<{ text: string; imageBase64?: string; imageMime?: string }> {
    const selectedDocs = rawDocs.filter(d => selectedRawIds.has(d.id))
    const textDocs = selectedDocs.filter(d => d.type !== 'wireframe')
    const imageDocs = selectedDocs.filter(d => d.type === 'wireframe')

    const savedText = textDocs.map(d => {
      const meta = RAW_DOC_META[d.type] || { label: d.type }
      if (d.type === 'figma' || d.figmaUrl) {
        const fUrl = d.figmaUrl || d.textContent || ''
        const extraNote = d.textContent && d.textContent !== fUrl ? `\n${d.textContent}` : ''
        return `=== 🎨 Figma Design Link Spec: ${d.name} ===\n🔗 Figma Link: ${fUrl}${extraNote}`
      }
      return `=== ${meta.label}: ${d.name} ===\n${d.textContent || ''}`
    }).join('\n\n')

    const currentDirectives = stepDirectivesMap[selectedAgent] || STEP_DIRECTIVES[selectedAgent] || []
    const selectedLabels = Array.from(selectedDirectives)
      .map(id => currentDirectives.find(d => d.id === id)?.label)
      .filter(Boolean)

    const directivesSection = selectedLabels.length > 0
      ? `=== YÊU CẦU ĐỊNH HƯỚNG TRỌNG TÂM CỦA ĐỘI NGŨ QA ===\nTác vụ này BẮT BUỘC phải tập trung bao phủ tối đa các khía cạnh kiểm thử sau:\n${selectedLabels.map(l => `- ${l}`).join('\n')}`
      : ''

    const userNotes = textInput.trim() ? `=== GHI CHÚ BỔ SUNG KHÁC ===\n${textInput.trim()}` : ''
    const finalInputNotes = [directivesSection, userNotes].filter(Boolean).join('\n\n')

    const combinedText = [savedText, finalInputNotes].filter(Boolean).join('\n\n---\n\n')

    let imageBase64: string | undefined
    let imageMime: string | undefined

    if (imageFile) {
      const buf = await imageFile.arrayBuffer()
      imageBase64 = Buffer.from(buf).toString('base64')
      imageMime = imageFile.type
    } else if (imageDocs.length > 0) {
      const res = await fetch(`/api/projects/${projectId}/raw-docs/${imageDocs[0].id}`)
      const full: RawDocument = await res.json()
      imageBase64 = full.imageBase64
      imageMime = full.imageMime
    }

    return { text: combinedText || '(Phân tích từ các tài liệu Yêu cầu Phase 1 đã chọn)', imageBase64, imageMime }
  }

  async function handleClarify(e: React.FormEvent) {
    e.preventDefault()
    setClarifyPhase('analyzing')
    setClarifyError('')
    setClarifyReport(null)
    setAnswers({})

    try {
      const { text, imageBase64 } = await buildCombinedInput()
      const targetType = AGENT_TO_CLARIFY_TARGET[selectedAgent]

      const res = await fetch('/api/generate/clarify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          input: text,
          inputType: imageBase64 ? 'image' : inputType,
          targetType,
          ...(imageBase64 ? { imageBase64 } : {}),
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Có lỗi khi phân tích yêu cầu')
      }

      const data = await res.json()
      const report: ClarificationReport = data.report

      // Initialize answers with empty strings for user input
      const preAnswers: Record<string, string> = {}
      for (const q of report.questions) {
        preAnswers[q.id] = ''
      }
      setAnswers(preAnswers)
      setClarifyReport(report)
      setClarifyPhase('questioning')
    } catch (err: unknown) {
      setClarifyError(err instanceof Error ? err.message : 'Lỗi phân tích yêu cầu')
      setClarifyPhase('idle')
    }
  }

  async function handleExecuteAgent(e?: React.FormEvent, skipClarify = false) {
    if (e) e.preventDefault()
    // If not yet clarified, run clarify first
    if (!skipClarify && clarifyPhase === 'idle') {
      return handleClarify(e || ({ preventDefault: () => {} } as React.FormEvent))
    }

    setClarifyPhase('executing')
    setLoading(true)
    setError('')
    setResult(null)
    setRawMarkdownOutput('')
    setStreamChars(0)

    try {
      const { text, imageBase64 } = await buildCombinedInput()

      // Build clarify context string from Q&A answers to inject into agent
      let clarifyContext = ''
      if (clarifyReport && Object.keys(answers).length > 0) {
        const qaLines = clarifyReport.questions.map(q => {
          const ans = (answers[q.id] || '').trim() || '(Chưa có thông tin trả lời từ người dùng)'
          return `Q[${q.id}] ${q.question}\nA: ${ans}`
        }).join('\n\n')
        clarifyContext = `=== BÁO CÁO LÀM RÕ YÊU CẦU (Requirements Clarification Report) ===\n\nHiểu biết hệ thống:\n${clarifyReport.understanding}\n\nCác Actor: ${clarifyReport.actors.join(', ')}\n\nBusiness Rules:\n${clarifyReport.businessRules.map(r => `- ${r}`).join('\n')}\n\nTest Conditions:\n${clarifyReport.testConditions.map(r => `- ${r}`).join('\n')}\n\nCâu hỏi & Trả lời Làm rõ:\n${qaLines}`
      }

      const res = await fetch('/api/generate/qa-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          agentType: selectedAgent,
          input: text,
          inputType: imageBase64 ? 'image' : inputType,
          ...(imageBase64 ? { imageBase64 } : {}),
          ...(clarifyContext ? { additionalParams: { clarifyContext } } : {}),
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Có lỗi xảy ra khi gọi Agent')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let resultDoc: GeneratedDocument | null = null
      let accumulatedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.trim()) continue
          const event = JSON.parse(line)
          if (event.type === 'chunk') {
            const chunkStr = event.text as string
            accumulatedText += chunkStr
            setStreamChars(n => n + chunkStr.length)
          } else if (event.type === 'done') {
            resultDoc = event.doc as GeneratedDocument
          } else if (event.type === 'error') {
            throw new Error(event.message)
          }
        }
      }

      if (resultDoc) {
        setResult(resultDoc)
        setRawMarkdownOutput(accumulatedText)
        setGeneratedDocs(prev => [resultDoc!, ...prev.filter(d => d.id !== resultDoc!.id)])
      } else {
        throw new Error('Không nhận được phản hồi từ Agent')
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
      setClarifyPhase('questioning')
    }
    setLoading(false)
  }

  const currentAgent = QA_AGENTS[selectedAgent] || QA_AGENTS['test-case']

  // Strict Sequential Dependency Validation Checks
  const hasPhase1Docs = rawDocs.length > 0
  const hasDoc = (docType: string) => generatedDocs.some(d => d.type === docType)

  function getGenerateLockInfo(type: QAAgentType): { isLocked: boolean; warning: string; reqAgent?: QAAgentType } {
    switch (type) {
      case 'review-requirement':
      case 'acceptance-criteria':
        if (!hasPhase1Docs) return { isLocked: true, warning: 'Cần upload hoặc tạo ít nhất 1 tài liệu Yêu cầu ở Phase 1 Baseline.' }
        return { isLocked: false, warning: '' }
      case 'test-plan':
      case 'test-strategy':
        if (!hasDoc('review-requirement') && !hasDoc('acceptance-criteria')) return { isLocked: true, warning: 'Chưa có tài liệu Step 1 (Requirements Review và AC). Hãy chạy Step 1 trước!', reqAgent: 'review-requirement' }
        return { isLocked: false, warning: '' }
      case 'test-case':
      case 'test-scenario':
        if (!hasDoc('test-plan') && !hasDoc('test-strategy')) return { isLocked: true, warning: 'Chưa có tài liệu Step 2 (Master Test Strategy và Plan). Hãy chạy Step 2 trước!', reqAgent: 'test-plan' }
        return { isLocked: false, warning: '' }
      case 'test-report':
      case 'regression-checklist':
        if (!hasDoc('test-case') && !hasDoc('test-cases') && !hasDoc('test-scenario')) return { isLocked: true, warning: 'Chưa có tài liệu Step 3 (Test Scenarios và Detailed Cases). Hãy chạy Step 3 trước!', reqAgent: 'test-case' }
        return { isLocked: false, warning: '' }
      default:
        return { isLocked: false, warning: '' }
    }
  }

  const lockInfo = getGenerateLockInfo(selectedAgent)
  const isLocked = lockInfo.isLocked
  const dependencyWarning = lockInfo.warning
  const missingPrerequisiteAgent = lockInfo.reqAgent || null
  const hasStep1Doc = generatedDocs.some(d => (d.type as string) === 'review-requirement' || (d.type as string) === 'acceptance-criteria')
  const hasStep2Doc = generatedDocs.some(d => (d.type as string) === 'test-plan' || (d.type as string) === 'test-strategy')
  const hasStep3Doc = generatedDocs.some(d => (d.type as string) === 'test-case' || (d.type as string) === 'test-cases' || (d.type as string) === 'test-scenario')

  if (pageLoading) {
    return <ProjectDetailSkeleton />
  }

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Compact High-Density Header Bar */}
      <div className="bg-white border-2 border-indigo-300 rounded-2xl p-4 md:p-5 space-y-3.5 shadow-sm text-slate-900">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <Link
              href={`/projects/${projectId}`}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3 py-1 rounded-xl text-xs font-extrabold border border-slate-300 transition-all shrink-0 cursor-pointer"
            >
              ← Trở về
            </Link>
            <span className="text-xs bg-indigo-600 text-white px-2.5 py-0.5 rounded-md font-mono font-extrabold shadow-xs">
              Step {currentAgent.stepOrder}
            </span>
            <h1 className="text-base md:text-xl font-extrabold text-slate-900 tracking-tight">{currentAgent.label}</h1>
          </div>
        </div>

        {/* 4 Agent Selector Tabs */}
        <div className="pt-2 border-t-2 border-slate-100 flex flex-wrap gap-2">
          {(Object.entries(QA_AGENTS) as [QAAgentType, typeof QA_AGENTS[QAAgentType]][]).map(([type, agent]) => {
            const tabLocked = getGenerateLockInfo(type).isLocked
            const isCurrent = selectedAgent === type
            return (
              <button
                key={type}
                onClick={() => handleSelectAgent(type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs md:text-sm font-extrabold transition-all border-2 cursor-pointer ${
                  isCurrent
                    ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                    : tabLocked
                    ? 'bg-slate-100 border-slate-300 text-slate-400 opacity-60'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>Step {agent.stepOrder}:</span>
                <span>{agent.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Sequential Dependency Warning Banner */}
      {dependencyWarning && (
        <div className={`p-4 rounded-2xl text-xs md:text-sm flex items-center justify-between gap-4 flex-wrap border-2 shadow-sm font-bold ${
          isLocked
            ? 'bg-amber-50 border-amber-300 text-amber-900'
            : 'bg-blue-50 border-blue-300 text-blue-900'
        }`}>
          <div className="flex items-center gap-2">
            <span className="font-extrabold leading-relaxed">{dependencyWarning}</span>
          </div>
          {missingPrerequisiteAgent ? (
            <button
              onClick={() => { setSelectedAgent(missingPrerequisiteAgent); setResult(null); setRawMarkdownOutput('') }}
              className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-amber-500 transition-all shadow-xs shrink-0 cursor-pointer"
            >
              Mở khoá bằng Step {QA_AGENTS[missingPrerequisiteAgent].stepOrder} ({QA_AGENTS[missingPrerequisiteAgent].label}) ➔
            </button>
          ) : (
            <Link
              href={!hasPhase1Docs ? `/projects/${projectId}` : `/projects/${projectId}/generate?agent=acceptance-criteria`}
              className="bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-amber-500 transition-all shadow-xs shrink-0"
            >
              Bổ sung tài liệu ➔
            </Link>
          )}
        </div>
      )}

      {/* Input Configuration Panel */}
      <div className="bg-sky-50/80 border-2 border-sky-400 border-l-8 border-l-sky-600 rounded-2xl p-5 space-y-4 shadow-md text-slate-900">
        {/* 1. Saved Phase 1 raw docs selector */}
        {rawDocs.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs md:text-sm font-extrabold text-slate-900 flex items-center justify-between">
              <span>Chọn Tài liệu Baseline và Ghi âm Cuộc họp làm ngữ cảnh ({selectedRawIds.size}/{rawDocs.length} Docs đã chọn):</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {rawDocs.map(doc => {
                const isAudio = doc.type === 'meeting-minutes' || Boolean(doc.audioBase64)
                const meta = RAW_DOC_META[doc.type] || { label: doc.type }
                const checked = selectedRawIds.has(doc.id)
                const len = (doc.textContent || '').length
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => toggleRaw(doc.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs md:text-sm font-extrabold border-2 transition-all cursor-pointer ${
                      checked
                        ? isAudio
                          ? 'bg-teal-600 border-teal-700 text-white shadow-xs'
                          : 'bg-sky-600 border-sky-700 text-white shadow-xs'
                        : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span>{checked ? '✓' : '○'}</span>
                    <span className="max-w-[240px] truncate">{doc.name}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-bold">
                      {isAudio ? 'Audio Transcript' : meta.label} {len > 0 ? `(${len.toLocaleString('vi-VN')} ký tự)` : ''}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white border-2 border-slate-300 rounded-xl p-4 text-xs md:text-sm text-slate-700 flex items-center justify-between font-bold">
            <span>Dự án chưa chọn tài liệu Phase 1 nào. Bạn có thể dán nội dung trực tiếp bên dưới.</span>
            <Link href={`/projects/${projectId}`} className="text-indigo-600 underline font-extrabold">Thêm doc ở Phase 1</Link>
          </div>
        )}

        {/* 2. Smart Context Reference Pipeline Card */}
        <div className="bg-white border-2 border-sky-300 rounded-xl p-3.5 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs md:text-sm font-extrabold font-mono text-sky-900 uppercase tracking-wide">
              Tham chiếu Kế thừa Ngữ cảnh cho Step {currentAgent.stepOrder} ({currentAgent.label})
            </span>
            <span className="text-[10px] md:text-xs bg-sky-100 text-sky-900 border border-sky-300 px-2.5 py-0.5 rounded-full font-mono font-bold">
              Kế thừa Tự động Pipeline
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-bold">
            {selectedAgent === 'review-requirement' && (
              <div className="bg-sky-50 border-2 border-sky-200 rounded-xl p-3 text-sky-950 col-span-2 space-y-1">
                <div className="font-extrabold text-sky-900 flex items-center gap-1.5">
                  <span>Nguồn Ngữ cảnh Chính:</span>
                  <span>Tài liệu Yêu cầu Baseline Phase 1</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  Agent Step 1 phân tích trực tiếp các file BRD, SRS, Wireframe, Figma từ Phase 1 để tìm lỗ hổng và tạo Acceptance Criteria.
                </p>
              </div>
            )}

            {selectedAgent === 'test-plan' && (
              <>
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-3 text-emerald-950 space-y-1">
                  <div className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                    <span>Kế thừa từ Step 1:</span>
                    <span className="underline">{hasStep1Doc ? '✓ Review Requirements và AC' : 'Chưa có (Nên chạy Step 1 trước)'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">Lấy kết quả Acceptance Criteria của Step 1 để tính toán phạm vi và nguồn lực kiểm thử.</p>
                </div>
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3 text-purple-950 space-y-1">
                  <div className="font-extrabold text-purple-900 flex items-center gap-1.5">
                    <span>Kết hợp:</span>
                    <span>Tài liệu Phase 1 Baseline</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">Đối chiếu trực tiếp với đặc tả nghiệp vụ gốc.</p>
                </div>
              </>
            )}

            {selectedAgent === 'test-case' && (
              <>
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-3 text-emerald-950 space-y-1">
                  <div className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                    <span>Kế thừa từ Step 2:</span>
                    <span className="underline">{hasStep2Doc ? '✓ Master Test Plan và Strategy' : 'Chưa có (Nên chạy Step 2 trước)'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">Lấy Ma trận tính năng và Chiến lược test từ Step 2 để sinh Test Scenarios và Test Cases.</p>
                </div>
                <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-3 text-purple-950 space-y-1">
                  <div className="font-extrabold text-purple-900 flex items-center gap-1.5">
                    <span>Kết hợp đồng thời:</span>
                    <span>Tiêu chí nghiệm thu (Step 1) và Tài liệu Yêu cầu gốc (Phase 1)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">Đảm bảo các Test Cases vừa bám sát màn hình/file gốc Phase 1, vừa phủ 100% Tiêu chí nghiệm thu BDD của Step 1.</p>
                </div>
              </>
            )}

            {selectedAgent === 'test-report' && (
              <>
                <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-3 text-emerald-950 space-y-1">
                  <div className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                    <span>Kế thừa Cốt lõi từ Step 3:</span>
                    <span className="underline">{hasStep3Doc ? '✓ Bộ Test Cases và Trạng thái Pass/Fail' : 'Chưa có Test Cases'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">Tự động trích xuất toàn bộ số lượng Test Cases và Kết quả thực thi từ Step 3.</p>
                </div>
                <div className="bg-indigo-50 border-2 border-indigo-300 rounded-xl p-3 text-indigo-950 space-y-1">
                  <div className="font-extrabold text-indigo-900 flex items-center gap-1.5">
                    <span>Kế thừa Tiêu chí dừng từ Step 2:</span>
                    <span className="underline">{hasStep2Doc ? '✓ Exit Criteria Benchmark' : 'Khuyên dùng thêm Step 2'}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">So sánh tỷ lệ Pass Rate với Benchmark của Step 2 để đưa ra quyết định Go/No-Go.</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 3. Testing Directives Multi-Select Checkboxes & Optional Custom Notes */}
        <form onSubmit={handleExecuteAgent} className="space-y-4">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="block text-xs md:text-sm font-extrabold text-slate-900">
                Định hướng kiểm thử ưu tiên (Checkbox chọn nhiều):
              </label>
              <span className="text-[11px] text-slate-600 font-medium">Bấm chọn các góc độ kiểm thử bạn muốn AI ưu tiên bao phủ:</span>
            </div>

            {/* Checkbox Chips Tailored per Step */}
            <div className="flex flex-wrap gap-2">
              {(stepDirectivesMap[selectedAgent] || STEP_DIRECTIVES[selectedAgent] || []).map(directive => {
                const checked = selectedDirectives.has(directive.id)
                return (
                  <button
                    key={directive.id}
                    type="button"
                    onClick={() => toggleDirective(directive.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs md:text-sm font-extrabold border-2 transition-all shadow-2xs ${
                      checked
                        ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                        : 'bg-white border-slate-300 text-slate-800 hover:bg-indigo-50'
                    }`}
                  >
                    <span>{checked ? '✓' : '○'}</span>
                    <span>{directive.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs md:text-sm font-extrabold text-slate-900">
              Ghi chú bổ sung khác (Tuỳ chọn)
            </label>
            <textarea
              value={textInput}
              onChange={e => setTextInput(e.target.value)}
              placeholder="Nhập ghi chú chi tiết nếu có (Ví dụ: Kiểm tra kỹ API thanh toán qua VNPay, phân quyền Admin...)..."
              rows={2}
              disabled={isLocked || clarifyPhase !== 'idle'}
              className="w-full bg-white border-2 border-slate-300 rounded-xl p-3 text-xs md:text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y font-semibold disabled:opacity-40"
            />
          </div>

          {clarifyError && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl text-xs md:text-sm font-bold">{clarifyError}</div>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap">
            {clarifyPhase === 'questioning' && (
              <button
                type="button"
                onClick={() => { setClarifyPhase('idle'); setClarifyReport(null); setAnswers({}) }}
                className="text-xs md:text-sm font-bold text-slate-600 hover:text-slate-900 underline transition-colors"
              >
                ← Nhập lại yêu cầu
              </button>
            )}
            <div className="flex gap-3 ml-auto">
              {clarifyPhase !== 'idle' && clarifyPhase !== 'questioning' && (
                <span className="text-xs md:text-sm font-bold text-indigo-700 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse inline-block" />
                  {clarifyPhase === 'analyzing' ? 'Sub-agent đang phân tích yêu cầu...' : 'AI Agent đang tạo tài liệu...'}
                </span>
              )}
              <button
                type="submit"
                disabled={loading || isLocked || clarifyPhase === 'analyzing' || (selectedRawIds.size === 0 && !textInput.trim())}
                className={`px-8 py-3.5 rounded-xl text-sm md:text-base font-extrabold transition-all shadow-md flex items-center gap-2 ${
                  isLocked
                    ? 'bg-slate-300 text-slate-600 cursor-not-allowed border-2 border-slate-400'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50'
                }`}
              >
                {clarifyPhase === 'analyzing' ? (
                  <>Sub-agent đang phân tích...</>
                ) : isLocked ? (
                  <>Nút bị Khoá (Cần hoàn thành Step trước)</>
                ) : clarifyPhase === 'idle' ? (
                  <>Phân tích và Làm rõ Yêu cầu ➔</>
                ) : (
                  <>Chạy lại Agent (không Làm rõ)</>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Progress Loading Animation Modal for Phase 2 QA Lifecycle Operations */}
      {clarifyPhase === 'analyzing' && (
        <AiProcessingProgressModal
          title={`Trợ lý đang phân tích và rà soát yêu cầu cho ${currentAgent.label}...`}
          steps={[
            "Đọc ngữ cảnh và tài liệu đính kèm...",
            `Đối chiếu tiêu chuẩn ${currentAgent.testingStandard}...`,
            "Phát hiện lỗ hổng và điểm mơ hồ nghiệp vụ...",
            "Tạo bộ câu hỏi phỏng vấn làm rõ..."
          ]}
          standard={currentAgent.testingStandard}
        />
      )}

      {/* Clarify Sub-agent Q&A Panel */}
      {clarifyPhase === 'questioning' && clarifyReport && (
        <div className="bg-amber-50/80 border-2 border-amber-400 border-l-8 border-l-amber-500 rounded-2xl p-6 space-y-6 shadow-md text-slate-900">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs bg-amber-600 text-white px-3 py-1 rounded-md font-mono font-extrabold shadow-xs">REQUIREMENTS ANALYST SUB-AGENT</span>
                <h2 className="font-extrabold text-slate-900 text-lg md:text-xl">Báo cáo Phân tích và Làm rõ Yêu cầu</h2>
              </div>
              <p className="text-xs md:text-sm text-slate-700 mt-2 font-bold leading-relaxed">
                Sub-agent đã phân tích tài liệu và đưa ra các câu hỏi làm rõ. Đọc và chỉnh sửa câu trả lời (nếu cần), sau đó bấm <strong>Xác nhận và Chạy Agent</strong>.
              </p>
            </div>
          </div>

          {/* Understanding Summary */}
          <div className="bg-white border-2 border-amber-200 rounded-xl p-4 space-y-2">
            <p className="text-xs md:text-sm font-extrabold text-amber-800 uppercase tracking-wide">Hiểu biết hệ thống</p>
            <p className="text-xs md:text-sm text-slate-800 font-semibold leading-relaxed">{clarifyReport.understanding}</p>
            {clarifyReport.actors.length > 0 && (
              <p className="text-xs text-slate-600 font-bold">
                <strong className="text-slate-800">Actors:</strong> {clarifyReport.actors.join(' · ')}
              </p>
            )}
            {clarifyReport.gaps.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-extrabold text-red-700 mb-1">Điểm còn thiếu hoặc mơ hồ:</p>
                <ul className="list-disc ml-4 space-y-0.5">
                  {clarifyReport.gaps.map((g, i) => <li key={i} className="text-xs text-red-700 font-semibold">{g}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Questions */}
          {clarifyReport.questions.length > 0 ? (
            <div className="space-y-4">
              <p className="text-xs md:text-sm font-extrabold text-slate-900">
                Câu hỏi Làm rõ ({clarifyReport.questions.length} câu) — Câu trả lời đề xuất đã được điền sẵn. Chỉnh sửa nếu cần:
              </p>
              {clarifyReport.questions.map((q: ClarifyQuestion, idx: number) => (
                <div key={q.id} className="bg-white border-2 border-amber-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 w-7 h-7 bg-amber-600 text-white rounded-lg flex items-center justify-center font-mono font-extrabold text-xs">{idx + 1}</span>
                    <div className="flex-1 space-y-1">
                      <p className="text-xs md:text-sm font-extrabold text-slate-900">{q.question}</p>
                      <p className="text-[10px] md:text-xs text-slate-500 font-semibold italic">{q.why}</p>
                      <span className="inline-block text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded font-mono font-bold uppercase">{q.category}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] md:text-xs font-extrabold text-slate-600 mb-1 uppercase tracking-wide">Câu trả lời:</label>
                    <textarea
                      value={answers[q.id] ?? ''}
                      onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Nhập câu trả lời cụ thể cho câu hỏi này..."
                      rows={3}
                      className="w-full bg-amber-50 border-2 border-amber-300 rounded-xl p-3 text-xs md:text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-4 text-xs md:text-sm text-emerald-800 font-bold">
              ✅ Tài liệu đã đủ rõ ràng — Không có câu hỏi nào cần làm rõ thêm. Bấm "Xác nhận & Chạy Agent" để tiếp tục.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl text-xs md:text-sm font-bold">{error}</div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3 flex-wrap border-t-2 border-amber-200 pt-4">
            <button
              type="button"
              onClick={() => handleExecuteAgent(undefined, true)}
              disabled={loading}
              className="text-xs md:text-sm font-bold text-slate-600 hover:text-slate-900 underline transition-colors disabled:opacity-50"
            >
              Bỏ qua Làm rõ, chạy thẳng Agent ➔
            </button>
            <button
              type="button"
              onClick={() => handleExecuteAgent(undefined, true)}
              disabled={loading}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm md:text-base font-extrabold transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                streamChars > 0
                  ? <>Agent đang suy luận & tạo doc... {streamChars.toLocaleString('vi-VN')} ký tự</>
                  : <>Đang kết nối AI Agent...</>
              ) : (
                <>✅ Xác nhận & Chạy Agent {currentAgent.label} ➔</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Output Stream Loading / Generating Indicator */}
      {loading && (
        <div className="bg-white border-2 border-indigo-400 rounded-2xl p-8 text-center space-y-4 shadow-md">
          <div className="flex items-center justify-center gap-3">
            <span className="w-4 h-4 rounded-full bg-indigo-600 animate-ping" />
            <h3 className="font-extrabold text-slate-900 text-lg md:text-xl">AI Agent đang thực thi {currentAgent.label}...</h3>
          </div>
          <p className="text-xs md:text-sm text-slate-600 font-semibold max-w-md mx-auto">
            Đang áp dụng tiêu chuẩn {currentAgent.testingStandard} để phân tích dữ liệu & khởi tạo tài liệu đặc tả.
          </p>
          {streamChars > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 font-mono text-xs md:text-sm font-bold py-2 px-4 rounded-xl inline-block">
              Đã nhận {streamChars.toLocaleString('vi-VN')} ký tự dữ liệu
            </div>
          )}
        </div>
      )}

      {/* Output Results Section */}
      {result && !loading && (
        <div className="bg-emerald-50/90 border-2 border-emerald-400 border-l-8 border-l-emerald-600 rounded-2xl p-6 space-y-6 shadow-md text-slate-900">
          <div className="flex items-center justify-between border-b-2 border-emerald-200 pb-4 flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-xs md:text-sm bg-emerald-600 text-white px-3 py-1 rounded-md font-mono font-extrabold">
                  {currentAgent.label}
                </span>
                <h2 className="font-extrabold text-slate-900 text-lg md:text-2xl">{result.inputSummary}</h2>
                <span className="text-xs bg-white text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded font-mono font-extrabold">
                  v{result.version}
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-700 mt-1 font-bold">Đã lưu kết quả thành công vào dự án</p>
            </div>
            <div className="flex gap-2">
              <a
                href={`/api/projects/${projectId}/documents/${result.id}`}
                target="_blank"
                className="bg-white text-emerald-900 px-4 py-2 rounded-xl text-xs md:text-sm font-extrabold hover:bg-slate-100 transition-all border-2 border-emerald-300 shadow-xs"
              >
                Mở HTML đầy đủ

              </a>
              <Link href={`/projects/${projectId}`} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs md:text-sm font-extrabold hover:bg-emerald-500 transition-all shadow-xs">
                Về Project Dashboard ➔
              </Link>
            </div>
          </div>

          {/* Test Cases view if test-case */}
          {((result.type as string) === 'test-case' || result.type === 'test-cases') && Array.isArray(result.content) && (
            <div className="space-y-3">
              {(result.content as TestCase[]).map(tc => (
                <div key={tc.id} className="bg-white rounded-xl border-2 border-emerald-200 overflow-hidden shadow-xs">
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b-2 border-slate-200 flex-wrap">
                    <span className="font-mono text-xs text-slate-700 font-extrabold">{tc.id}</span>
                    <span className="font-extrabold text-slate-900 text-xs md:text-sm flex-1 truncate">{tc.title}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${PRIORITY_COLOR[tc.priority]}`}>{tc.priority}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${TYPE_COLOR[tc.type]}`}>{TYPE_LABEL[tc.type]}</span>
                  </div>
                  <div className="p-4 text-xs md:text-sm space-y-2 text-slate-800 font-semibold">
                    {tc.preconditions && <p className="text-slate-600"><strong className="text-slate-900">Preconditions:</strong> {tc.preconditions}</p>}
                    <ol className="list-decimal ml-5 space-y-1">
                      {tc.steps?.map((s, i) => <li key={i}>{s}</li>)}
                    </ol>
                    <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs md:text-sm font-bold">
                      <strong>Expected:</strong> {tc.expectedResult}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Formatted Markdown / Document View for non-array results */}
          {(((result.type as string) !== 'test-case' && result.type !== 'test-cases') || !Array.isArray(result.content)) && (
            <DocumentViewer
              content={rawMarkdownOutput || (typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2))}
              docType={result.type}
              title={result.inputSummary}
              version={result.version}
              createdAt={result.createdAt}
              projectId={projectId}
              docId={result.id}
            />
          )}
        </div>
      )}
    </div>
  )
}
