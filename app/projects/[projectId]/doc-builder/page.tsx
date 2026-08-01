'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Project,
  RawDocument,
  RAW_DOC_META,
  DocBuilderType,
  DocBuilderStandard,
  DocBuilderQuestionnaire,
  DOC_BUILDER_TYPES,
  DOC_BUILDER_STANDARDS,
  DOC_TYPE_DEFAULT_STANDARD,
  DOC_TYPE_RECOMMENDED_STANDARDS,
} from '@/lib/types'

import { DocBuilderSkeleton } from '@/app/components/Skeletons'
import DocumentViewer from '@/app/components/DocumentViewer'

export default function DocBuilderPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)

  // Step state: 1 = Config, 2 = Questionnaire, 3 = Generating, 4 = Review
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Step 1 states (Phase 1 Requirement Docs)
  const [docType, setDocType] = useState<DocBuilderType>('srs')
  const [standard, setStandard] = useState<DocBuilderStandard>(DOC_TYPE_DEFAULT_STANDARD['srs'])
  const [initialInput, setInitialInput] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  // Auto reselect matching standard when docType changes
  function handleDocTypeChange(newType: DocBuilderType) {
    setDocType(newType)
    const defaultStd = DOC_TYPE_DEFAULT_STANDARD[newType] || 'iso-25010'
    setStandard(defaultStd)
  }

  // Step 2 states (Multi-turn Questionnaire by Round)
  interface QuestionItem { id: string; section: string; question: string; why?: string }
  interface RoundHistoryItem {
    roundNumber: number
    title: string
    overview: string
    questions: QuestionItem[]
    answersAtSubmission: Record<string, string>
  }

  const [questionnaireRounds, setQuestionnaireRounds] = useState<RoundHistoryItem[]>([])
  const [activeTabRound, setActiveTabRound] = useState<number>(1)
  const [currentQuestions, setCurrentQuestions] = useState<QuestionItem[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [extraNotes, setExtraNotes] = useState('')
  const [round, setRound] = useState<number>(1)

  // Step 3 & 4 states
  const [draftContent, setDraftContent] = useState('')
  const [editingContent, setEditingContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // Global loading / error
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [rawDocs, setRawDocs] = useState<RawDocument[]>([])
  const [selectedRawIds, setSelectedRawIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}`).then(r => r.json()),
      fetch(`/api/projects/${projectId}/raw-docs`).then(r => r.json()),
    ]).then(([proj, rDocs]) => {
      setProject(proj)
      if (Array.isArray(rDocs)) {
        setRawDocs(rDocs)
        setSelectedRawIds(new Set(rDocs.map((d: RawDocument) => d.id)))
      }
    })
  }, [projectId])

  function toggleRaw(id: string) {
    setSelectedRawIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }


  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  async function generateQuestions() {
    if (!initialInput || !initialInput.trim()) {
      setError('Vui lòng nhập "Mô tả / Yêu cầu ban đầu" để AI có dữ liệu sinh bộ câu hỏi phỏng vấn!')
      return
    }
    setLoading(true)
    setError('')
    setRound(1)
    try {
      let imageBase64: string | undefined
      if (imageFile) {
        const buf = await imageFile.arrayBuffer()
        imageBase64 = Buffer.from(buf).toString('base64')
      }

      const res = await fetch('/api/generate/doc-builder/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          docType,
          standard,
          initialInput,
          ...(imageBase64 ? { imageBase64 } : {}),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Không thể sinh câu hỏi đặc tả')
      }

      const { questionnaire: q } = await res.json()
      const round1Item: RoundHistoryItem = {
        roundNumber: 1,
        title: q.title || `Bộ câu hỏi phỏng vấn Vòng 1 cho ${docType.toUpperCase()}`,
        overview: q.overview || '',
        questions: q.questions || [],
        answersAtSubmission: {},
      }

      setQuestionnaireRounds([round1Item])
      setActiveTabRound(1)
      setCurrentQuestions(q.questions || [])

      const initialAnswers: Record<string, string> = {}
      q.questions.forEach((item: { id: string }) => {
        initialAnswers[item.id] = ''
      })
      setAnswers(initialAnswers)

      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi khi sinh bộ câu hỏi')
    }
    setLoading(false)
  }

  async function generateNextRoundQuestions() {
    if (questionnaireRounds.length === 0) return
    setLoading(true)
    setError('')

    try {
      // Save current round's answers to history
      setQuestionnaireRounds(prev => prev.map(r => r.roundNumber === round ? { ...r, answersAtSubmission: { ...answers } } : r))

      // Format ALL previous rounds QA for context
      const formattedQA = questionnaireRounds.flatMap(rItem => {
        const rAnswers = rItem.roundNumber === round ? answers : rItem.answersAtSubmission
        return rItem.questions.map(q => {
          const ans = (rAnswers[q.id] || '').trim() || '(BA/PO chọn thiết kế chuẩn)'
          return `[Vòng ${rItem.roundNumber}] Q: ${q.question}\nA: ${ans}`
        })
      }).join('\n\n')

      let imageBase64: string | undefined
      if (imageFile) {
        const buf = await imageFile.arrayBuffer()
        imageBase64 = Buffer.from(buf).toString('base64')
      }

      const res = await fetch('/api/generate/doc-builder/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          docType,
          standard,
          initialInput,
          previousAnswersText: formattedQA,
          ...(imageBase64 ? { imageBase64 } : {}),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Không thể sinh câu hỏi Vòng tiếp theo')
      }

      const { questionnaire: nextQ } = await res.json()
      const nextRoundNum = round + 1

      const nextRoundItem: RoundHistoryItem = {
        roundNumber: nextRoundNum,
        title: nextQ.title || `Bộ câu hỏi phỏng vấn Vòng ${nextRoundNum} cho ${docType.toUpperCase()}`,
        overview: nextQ.overview || '',
        questions: nextQ.questions || [],
        answersAtSubmission: {},
      }

      setQuestionnaireRounds(prev => [...prev, nextRoundItem])
      setRound(nextRoundNum)
      setActiveTabRound(nextRoundNum)
      setCurrentQuestions(nextQ.questions || [])

      // Init blank answers for new round questions while keeping previous round answers intact
      const newAnswers = { ...answers }
      nextQ.questions.forEach((item: { id: string }) => {
        newAnswers[item.id] = ''
      })
      setAnswers(newAnswers)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi khi sinh bộ câu hỏi Vòng tiếp theo')
    }
    setLoading(false)
  }

  async function generateDocumentDraft(customAnswers?: Record<string, string>) {
    if (questionnaireRounds.length === 0) return
    setStep(3)
    setLoading(true)
    setError('')

    const effectiveAnswers = customAnswers || answers
    const allQuestions = questionnaireRounds.flatMap(r => r.questions)
    const activeOverview = questionnaireRounds[0]?.overview || ''

    try {
      const res = await fetch('/api/generate/doc-builder/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          docType,
          standard,
          overview: activeOverview,
          answers: effectiveAnswers,
          questions: allQuestions,
          extraNotes,
          saveAsRawDoc: true,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Có lỗi khi biên soạn tài liệu đặc tả')
      }

      const data = await res.json()
      setDraftContent(data.builtDoc.contentMarkdown)
      setEditingContent(data.builtDoc.contentMarkdown)
      setStep(4)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi khi tạo tài liệu đặc tả')
      setStep(2)
    }
    setLoading(false)
  }

  function downloadMarkdown() {
    const blob = new Blob([editingContent], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${docType.toUpperCase()}_${standard.toUpperCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!project) {
    return <DocBuilderSkeleton />
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Breadcrumb & Navigation Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs md:text-sm text-slate-700 font-mono font-bold">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Projects</Link>
          <span>/</span>
          <Link href={`/projects/${projectId}`} className="hover:text-indigo-600 transition-colors">{project.name}</Link>
          <span>/</span>
          <span className="text-slate-900 font-extrabold">Doc Builder Agent</span>
        </div>

        <Link
          href={`/projects/${projectId}`}
          className="bg-white border-2 border-slate-300 text-slate-800 px-4 py-2 rounded-xl text-xs md:text-sm font-bold hover:bg-slate-100 transition-all shadow-xs"
        >
          ← Trở về
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-indigo-100 border-2 border-indigo-300 border-l-8 border-l-indigo-600 rounded-2xl p-6 shadow-sm text-slate-900">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs md:text-sm bg-indigo-600 text-white px-3 py-1 rounded-md font-extrabold font-mono shadow-xs">
                Phase 1 Baseline Builder
              </span>
              <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Document Builder Agent (Yêu cầu & Đặc tả)</h1>
            </div>
            <p className="text-xs md:text-sm text-slate-700 mt-2 font-semibold leading-relaxed">
              Xây dựng tài liệu Yêu cầu chuẩn mực (BRD, SRS, User Story, Epic, API Spec) khi chưa có doc hoặc thông tin mơ hồ từ đối tác
            </p>
          </div>
        </div>

        {/* Step Wizard Progress Bar */}
        <div className="mt-6 grid grid-cols-4 gap-2.5 text-xs md:text-sm">
          {[
            { s: 1, label: '1. Chọn loại doc' },
            { s: 2, label: '2. Phỏng vấn' },
            { s: 3, label: '3. AI tổng hợp' },
            { s: 4, label: '4. Baseline' },
          ].map(item => (
            <div
              key={item.s}
              className={`flex items-center justify-center py-2.5 px-3 rounded-xl border-2 font-extrabold transition-all shadow-xs ${
                step === item.s
                  ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm'
                  : step > item.s
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-900'
                  : 'bg-white border-slate-300 text-slate-500'
              }`}
            >
              {step > item.s ? '✓ ' : ''}{item.label}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-between shadow-xs">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-xs font-bold opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* BƯỚC 1: Chọn Loại Tài liệu Yêu cầu & Tiêu chuẩn */}
      {step === 1 && (
        <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-6 space-y-6 shadow-sm text-slate-900">
          {/* Phase 1 Baseline & Audio Meeting Record Context Reference Selector */}
          {rawDocs.length > 0 && (
            <div className="bg-white border-2 border-slate-300 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs md:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span>📌 Dữ liệu tham chiếu ({selectedRawIds.size}/{rawDocs.length} tài liệu)</span>
                </span>
                <span className="text-[10px] md:text-xs bg-slate-100 text-slate-700 border border-slate-300 px-2.5 py-0.5 rounded-full font-semibold">
                  Tích chọn để làm ngữ cảnh cho AI
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
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
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                        checked
                          ? isAudio
                            ? 'bg-teal-600 border-teal-700 text-white shadow-xs'
                            : 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{checked ? '✓' : '○'}</span>
                      <span>{isAudio ? '🎙️' : '📄'}</span>
                      <span className="max-w-[200px] truncate">{doc.name}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded font-mono font-semibold">
                        {isAudio ? 'Audio' : meta.label} {len > 0 ? `(${len.toLocaleString('vi-VN')} ký tự)` : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Inline Flex Grid for Section 1 & Section 2 */}
          <div className="grid md:grid-cols-2 gap-6 border-b-2 border-slate-200 pb-5">

            {/* 1. Document Type Compact Pill Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm md:text-base font-extrabold text-slate-900">
                  1. Chọn Loại tài liệu <span className="text-red-600 font-bold">*</span>
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                {(Object.entries(DOC_BUILDER_TYPES) as [DocBuilderType, typeof DOC_BUILDER_TYPES[DocBuilderType]][]).map(([k, meta]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleDocTypeChange(k)}
                    className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold transition-all border-2 flex items-center gap-1.5 ${
                      docType === k
                        ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                        : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span>{meta.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs font-semibold text-slate-500 italic">
                {DOC_BUILDER_TYPES[docType]?.desc}
              </p>
            </div>

            {/* 2. Standard Compact Pill Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm md:text-base font-extrabold text-slate-900">
                  2. Chọn Tiêu chuẩn áp dụng <span className="text-red-600 font-bold">*</span>
                </label>
                <span className="text-xs text-indigo-800 font-mono font-bold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {DOC_BUILDER_STANDARDS[standard]?.tag}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(Object.entries(DOC_BUILDER_STANDARDS) as [DocBuilderStandard, typeof DOC_BUILDER_STANDARDS[DocBuilderStandard]][]).map(([k, meta]) => {
                  const isRecommended = DOC_TYPE_RECOMMENDED_STANDARDS[docType]?.includes(k)
                  const isDefault = DOC_TYPE_DEFAULT_STANDARD[docType] === k
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setStandard(k)}
                      className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold transition-all border-2 flex items-center gap-1.5 ${
                        standard === k
                          ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                          : isRecommended
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900 hover:bg-indigo-100'
                          : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <span>{meta.label}</span>
                      {isDefault && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${standard === k ? 'bg-white/30 text-white' : 'bg-indigo-100 text-indigo-900'}`}>
                          Khuyên dùng
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs font-semibold text-slate-500 italic">
                {DOC_BUILDER_STANDARDS[standard]?.desc}
              </p>
            </div>
          </div>

          {/* Initial Input / Vague Notes */}
          <div className="space-y-2">
            <label className="block text-sm md:text-base font-extrabold text-slate-900">
              3. Mô tả / Yêu cầu ban đầu <span className="text-red-600 font-bold">*</span>
            </label>
            <p className="text-xs md:text-sm text-slate-600 font-semibold">Dán các đoạn chat, email, note họp... AI sẽ phân tích để đặt bộ câu hỏi phỏng vấn đặc tả còn thiếu</p>
            <textarea
              value={initialInput}
              onChange={e => setInitialInput(e.target.value)}
              placeholder="Ví dụ: Khách hàng muốn xây hệ thống đặt phòng họp online. Cần đăng nhập Google, xem lịch trống, đặt phòng và gửi mail thông báo..."
              rows={4}
              className="w-full bg-white border-2 border-slate-300 rounded-xl p-4 text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
            />
          </div>

          {/* Action Button */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={generateQuestions}
              disabled={loading}
              className="bg-indigo-600 text-white px-7 py-3 rounded-xl text-sm md:text-base font-bold hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang sinh bộ câu hỏi...</span>
                </>
              ) : (
                <>Bắt đầu Phỏng vấn AI cho {DOC_BUILDER_TYPES[docType]?.label} ➔</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Progress Loading Overlay Banner when generating questions */}
      {loading && step === 1 && (
        <div className="bg-white border-2 border-indigo-300 rounded-2xl p-8 text-center space-y-4 shadow-lg animate-pulse">
          <div className="flex items-center justify-center gap-3">
            <div className="w-7 h-7 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <h3 className="text-lg md:text-xl font-extrabold text-slate-900">
              Requirements Analyst Agent đang phân tích & sinh Bộ câu hỏi...
            </h3>
          </div>
          <p className="text-xs md:text-sm text-slate-600 font-semibold max-w-lg mx-auto">
            AI đang đối chiếu thông tin với chuẩn <strong className="text-indigo-900">{DOC_BUILDER_STANDARDS[standard]?.label}</strong> để phát hiện toàn bộ các rủi ro & điểm mơ hồ.
          </p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden max-w-md mx-auto border border-slate-300">
            <div className="bg-gradient-to-r from-indigo-600 to-sky-500 h-full w-3/4 rounded-full animate-pulse" />
          </div>
        </div>
      )}

      {/* BƯỚC 2: AI Sinh Bộ Câu Hỏi & QA/BA Trả Lời Theo Vòng */}
      {step === 2 && questionnaireRounds.length > 0 && (
        <div className="bg-slate-50 border-2 border-slate-300 rounded-2xl p-6 space-y-6 shadow-sm text-slate-900">
          <div className="flex items-center justify-between border-b-2 border-slate-200 pb-4 flex-wrap gap-3">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">
                {questionnaireRounds[activeTabRound - 1]?.title || `Bộ câu hỏi Vòng ${activeTabRound}`}
              </h2>
              <p className="text-xs md:text-sm text-slate-600 mt-1 font-semibold leading-relaxed">
                {questionnaireRounds[activeTabRound - 1]?.overview}
              </p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="bg-white border-2 border-slate-300 text-slate-800 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold hover:bg-slate-100 transition-all shadow-xs"
            >
              ← Chọn lại loại doc
            </button>
          </div>

          {/* Round Selector Tabs */}
          <div className="flex items-center gap-2 border-b-2 border-slate-200 pb-3 flex-wrap">
            <span className="text-xs font-bold text-slate-600 font-mono uppercase mr-2">
              Các vòng phỏng vấn:
            </span>
            {questionnaireRounds.map(rItem => {
              const isActive = activeTabRound === rItem.roundNumber
              const isCurrentActiveRound = round === rItem.roundNumber
              return (
                <button
                  key={rItem.roundNumber}
                  type="button"
                  onClick={() => setActiveTabRound(rItem.roundNumber)}
                  className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold border-2 transition-all flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm scale-105'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-indigo-50'
                  }`}
                >
                  <span>💬 Vòng {rItem.roundNumber}</span>
                  {isCurrentActiveRound && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${isActive ? 'bg-white/30 text-white' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'}`}>
                      Hiện tại
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Questions of Active Tab Round */}
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-sm md:text-base font-extrabold text-slate-900">
                Câu hỏi Vòng {activeTabRound} ({questionnaireRounds[activeTabRound - 1]?.questions.length || 0} mục) — {activeTabRound < round ? 'Lịch sử đáp án đã ghi nhận:' : 'Bổ sung hoặc xác nhận câu trả lời:'}
              </p>
              {activeTabRound < round && (
                <span className="text-xs bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1 rounded-lg font-bold">
                  🔒 Đã hoàn thành Vòng {activeTabRound}
                </span>
              )}
            </div>

            {questionnaireRounds[activeTabRound - 1]?.questions.map((q) => (
              <div key={q.id} className="bg-white border-2 border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">{q.id}</span>
                  <span className="text-xs bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-0.5 rounded-md font-bold">{q.section}</span>
                  <span className="font-extrabold text-slate-900 text-sm md:text-base">{q.question}</span>
                </div>
                {q.why && <p className="text-xs text-slate-500 font-semibold">Lý do: {q.why}</p>}
                <div>
                  <textarea
                    value={answers[q.id] ?? ''}
                    onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Nhập câu trả lời hoặc chỉnh sửa..."
                    rows={2}
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-3 text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold resize-y"
                  />
                </div>
              </div>
            ))}

            {activeTabRound === round && (
              <div className="space-y-1 pt-2">
                <label className="block text-xs md:text-sm font-extrabold text-slate-900">Ghi chú bổ sung khác (Tuỳ chọn)</label>
                <textarea
                  value={extraNotes}
                  onChange={e => setExtraNotes(e.target.value)}
                  placeholder="Yêu cầu thêm về thuật ngữ, quy định nghiệp vụ riêng..."
                  rows={2}
                  className="w-full bg-white border-2 border-slate-300 rounded-xl p-3 text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                />
              </div>
            )}
          </div>

          {/* Multi-Turn Elicitation Action Bar */}
          <div className="flex gap-3 justify-between items-center pt-4 border-t-2 border-slate-200 flex-wrap">
            <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-700 bg-white border border-slate-300 px-3.5 py-1.5 rounded-xl font-mono">
              <span>💬 Vòng {round}</span>
              <span>•</span>
              <span>Tổng {questionnaireRounds.flatMap(r => r.questions).length} câu hỏi</span>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={generateNextRoundQuestions}
                disabled={loading}
                className="bg-white text-indigo-900 border-2 border-indigo-400 hover:bg-indigo-50 px-4 py-3 rounded-xl text-xs md:text-sm font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                title="Yêu cầu AI phân tích tiếp các lỗ hổng nâng cao để hỏi Vòng tiếp theo"
              >
                <span>💬 {loading ? 'AI đang phân tích...' : `Hỏi thêm Vòng ${round + 1} (Tuỳ chọn)`}</span>
              </button>

              <button
                type="button"
                onClick={() => generateDocumentDraft()}
                disabled={loading}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs md:text-sm font-bold hover:bg-indigo-500 transition-all shadow-sm flex items-center gap-1.5"
                title="AI dùng câu trả lời hiện có + Tự động lấp lỗ hổng bằng Giả định thiết kế để ra ngay tài liệu hoàn chỉnh"
              >
                <span>🚀 AI Biên soạn Đặc tả Hoàn chỉnh ➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BƯỚC 3: Đang Sinh Tài Liệu */}
      {step === 3 && (
        <div className="bg-white border-2 border-indigo-300 rounded-2xl p-10 text-center space-y-5 shadow-lg animate-pulse text-slate-900">
          <div className="flex items-center justify-center gap-3">
            <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">AI đang biên soạn tài liệu Yêu cầu Phase 1...</h2>
          </div>
          <p className="text-xs md:text-sm font-semibold text-slate-600 max-w-lg mx-auto leading-relaxed">
            AI đang áp dụng các khung chuẩn của <strong className="text-indigo-900">{DOC_BUILDER_STANDARDS[standard]?.label}</strong> kết hợp câu trả lời phỏng vấn để tổng hợp tạo file <strong className="text-indigo-900">{docType.toUpperCase()} Baseline</strong> hoàn chỉnh.
          </p>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden max-w-md mx-auto border border-slate-300">
            <div className="bg-gradient-to-r from-indigo-600 via-sky-500 to-emerald-500 h-full w-4/5 rounded-full animate-pulse" />
          </div>
          <p className="text-xs font-mono font-semibold text-slate-500">Tiến trình: Đang tổng hợp các giả định nghiệp vụ & cấu trúc tiêu chuẩn...</p>
        </div>
      )}

      {/* BƯỚC 4: Review & Lưu Baseline */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-indigo-50/80 border-2 border-indigo-300 rounded-2xl p-6 flex-wrap gap-3 shadow-sm text-slate-900">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">{docType.toUpperCase()} Requirement Baseline</h2>
                <span className="text-xs md:text-sm bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-md font-bold">Đã lưu Phase 1 Baseline</span>
              </div>
              <p className="text-xs md:text-sm text-slate-600 mt-1 font-semibold">Tiêu chuẩn: {DOC_BUILDER_STANDARDS[standard]?.label}</p>
            </div>

            <Link
              href={`/projects/${projectId}/generate?agent=review-requirement`}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs md:text-sm font-bold hover:bg-indigo-500 transition-all shadow-sm"
            >
              Chuyển sang Phase 2: Review Requirement ➔
            </Link>
          </div>

          <DocumentViewer
            content={editingContent}
            docType={docType}
            title={`${docType.toUpperCase()} Requirement Baseline`}
            version={1}
            isEditable={true}
            onSaveContent={setEditingContent}
          />

          <div className="flex justify-between items-center pt-2 flex-wrap gap-3">
            <button
              onClick={() => setStep(1)}
              className="bg-white border-2 border-slate-300 text-slate-800 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold hover:bg-slate-100 transition-all shadow-xs"
            >
              Soạn tài liệu yêu cầu khác
            </button>

            <Link
              href={`/projects/${projectId}`}
              className="bg-slate-100 text-slate-900 border-2 border-slate-300 px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold hover:bg-slate-200 transition-all shadow-xs"
            >
              ← Trở về
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
