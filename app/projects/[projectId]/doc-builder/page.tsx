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

  // Step 2 states
  const [questionnaire, setQuestionnaire] = useState<DocBuilderQuestionnaire | null>(null)
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
    ]).then(([proj, raws]) => {
      setProject(proj)
      if (Array.isArray(raws)) {
        setRawDocs(raws)
        setSelectedRawIds(new Set(raws.map((d: any) => d.id)))
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
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = ev => setImagePreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function generateQuestions() {
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
      setQuestionnaire(q)

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
    if (!questionnaire) return
    setLoading(true)
    setError('')

    try {
      const formattedQA = questionnaire.questions.map(q => {
        const ans = (answers[q.id] || '').trim() || '(Chưa có câu trả lời từ người dùng)'
        return `Q: ${q.question}\nA: ${ans}`
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

      setQuestionnaire(prev => {
        if (!prev) return nextQ
        return {
          ...prev,
          questions: [...prev.questions, ...nextQ.questions],
        }
      })

      const newAnswers = { ...answers }
      nextQ.questions.forEach((item: { id: string }) => {
        newAnswers[item.id] = ''
      })
      setAnswers(newAnswers)
      setRound(prev => prev + 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi khi sinh bộ câu hỏi Vòng tiếp theo')
    }
    setLoading(false)
  }

  async function generateDocumentDraft(customAnswers?: Record<string, string>) {
    if (!questionnaire) return
    setStep(3)
    setLoading(true)
    setError('')

    const effectiveAnswers = customAnswers || answers

    try {
      const res = await fetch('/api/generate/doc-builder/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          docType,
          standard,
          overview: questionnaire.overview,
          answers: effectiveAnswers,
          questions: questionnaire.questions,
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
    return <div className="text-slate-600 text-sm py-12 text-center font-mono font-bold">Đang tải dự án...</div>
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Breadcrumb & Navigation Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-xs md:text-sm text-slate-700 font-mono font-bold">
          <Link href="/" className="hover:text-purple-700 transition-colors">Projects</Link>
          <span>/</span>
          <Link href={`/projects/${projectId}`} className="hover:text-purple-700 transition-colors">{project.name}</Link>
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
      <div className="bg-purple-50/90 border-2 border-purple-400 border-l-8 border-l-purple-600 rounded-2xl p-6 shadow-md text-slate-900">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs md:text-sm bg-purple-600 text-white px-3 py-1 rounded-md font-extrabold font-mono shadow-xs">
                Phase 1 Baseline Builder
              </span>
              <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Document Builder Agent (Yêu cầu & Đặc tả sản phẩm)</h1>
            </div>
            <p className="text-xs md:text-sm text-slate-700 mt-2 font-bold leading-relaxed">
              Xây dựng tài liệu Yêu cầu chuẩn mực (BRD, SRS, User Story, Epic, API Spec) khi chưa có doc hoặc thông tin mơ hồ từ đối tác
            </p>
          </div>
        </div>

        {/* Step Wizard Progress Bar */}
        <div className="mt-6 grid grid-cols-4 gap-2.5 text-xs md:text-sm">
          {[
            { s: 1, label: '1. Chọn loại doc Yêu cầu' },
            { s: 2, label: '2. Sinh & trả lời câu hỏi' },
            { s: 3, label: '3. AI tổng hợp doc' },
            { s: 4, label: '4. Review & lưu Baseline' },
          ].map(item => (
            <div
              key={item.s}
              className={`flex items-center justify-center py-2.5 px-3 rounded-xl border-2 font-extrabold transition-all shadow-xs ${
                step === item.s
                  ? 'bg-purple-600 border-purple-700 text-white shadow-sm'
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
        <div className="bg-purple-50/70 border-2 border-purple-300 rounded-2xl p-6 space-y-6 shadow-md text-slate-900">
          {/* Phase 1 Baseline & Audio Meeting Record Context Reference Selector */}
          {rawDocs.length > 0 && (
            <div className="bg-white border-2 border-purple-300 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs md:text-sm font-extrabold font-mono text-purple-950 uppercase tracking-wide flex items-center gap-1.5">
                  <span>📌 AI đang tự động tham chiếu các tài liệu Baseline & Ghi âm cuộc họp ({selectedRawIds.size}/{rawDocs.length} Docs):</span>
                </span>
                <span className="text-[10px] md:text-xs bg-purple-100 text-purple-900 border border-purple-300 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  Bật/tắt để chọn ngữ cảnh
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
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs md:text-sm font-extrabold border-2 transition-all ${
                        checked
                          ? isAudio
                            ? 'bg-teal-600 border-teal-700 text-white shadow-xs'
                            : 'bg-purple-600 border-purple-700 text-white shadow-xs'
                          : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <span>{checked ? '✓' : '○'}</span>
                      <span>{isAudio ? '🎙️' : '📄'}</span>
                      <span className="max-w-[240px] truncate">{doc.name}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-bold">
                        {isAudio ? 'Audio Transcript' : meta.label} {len > 0 ? `(${len.toLocaleString('vi-VN')} ký tự)` : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Inline Flex Grid for Section 1 & Section 2 */}
          <div className="grid md:grid-cols-2 gap-6 border-b-2 border-purple-200 pb-5">

            {/* 1. Document Type Compact Pill Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm md:text-base font-extrabold text-slate-900">
                  1. Chọn Loại tài liệu Yêu cầu *
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                {(Object.entries(DOC_BUILDER_TYPES) as [DocBuilderType, typeof DOC_BUILDER_TYPES[DocBuilderType]][]).map(([k, meta]) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => handleDocTypeChange(k)}
                    className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-extrabold transition-all border-2 flex items-center gap-1.5 ${
                      docType === k
                        ? 'bg-purple-600 border-purple-700 text-white shadow-xs'
                        : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <span>{meta.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs font-bold text-slate-600 italic">
                {DOC_BUILDER_TYPES[docType]?.desc}
              </p>
            </div>

            {/* 2. Standard Compact Pill Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm md:text-base font-extrabold text-slate-900">
                  2. Chọn Tiêu chuẩn áp dụng *
                </label>
                <span className="text-xs md:text-sm text-indigo-800 font-mono font-extrabold bg-indigo-100 px-2.5 py-0.5 rounded-full border border-indigo-300">
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
                      className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-extrabold transition-all border-2 flex items-center gap-1.5 ${
                        standard === k
                          ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                          : isRecommended
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900 hover:bg-indigo-100'
                          : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <span>{meta.label}</span>
                      {isDefault && (
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${standard === k ? 'bg-white/30 text-white' : 'bg-indigo-200 text-indigo-900'}`}>
                          ★ Khuyên dùng
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <p className="text-xs font-bold text-slate-600 italic">
                {DOC_BUILDER_STANDARDS[standard]?.desc}
              </p>
            </div>
          </div>

          {/* Initial Input / Vague Notes */}
          <div className="space-y-2">
            <label className="block text-sm md:text-base font-extrabold text-slate-900">
              3. Mô tả / Yêu cầu ban đầu để AI bắt đầu Phỏng vấn (Tuỳ chọn)
            </label>
            <p className="text-xs md:text-sm text-slate-700 font-medium">Dán các đoạn chat, email, note họp mơ hồ... AI sẽ phân tích để đặt bộ câu hỏi đặc tả còn thiếu</p>
            <textarea
              value={initialInput}
              onChange={e => setInitialInput(e.target.value)}
              placeholder="Ví dụ: Khách hàng muốn xây hệ thống đặt phòng họp online. Cần đăng nhập Google, xem lịch trống, đặt phòng và gửi mail thông báo..."
              rows={5}
              className="w-full bg-white border-2 border-slate-300 rounded-xl p-4 text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
            />
          </div>



          {/* Action Button */}
          <div className="pt-2 flex justify-end">
            <button
              onClick={generateQuestions}
              disabled={loading}
              className="bg-purple-600 text-white px-7 py-3 rounded-xl text-sm md:text-base font-extrabold hover:bg-purple-500 disabled:opacity-50 transition-all shadow-md"
            >
              {loading ? (
                <>Đang sinh bộ câu hỏi đặc tả yêu cầu...</>
              ) : (
                <>AI sinh bộ câu hỏi cho {DOC_BUILDER_TYPES[docType]?.label} ➔</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* BƯỚC 2: AI Sinh Bộ Câu Hỏi & QA/BA Trả Lời */}
      {step === 2 && questionnaire && (
        <div className="bg-purple-50/70 border-2 border-purple-300 rounded-2xl p-6 space-y-6 shadow-md text-slate-900">
          <div className="flex items-center justify-between border-b-2 border-purple-200 pb-4">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">{questionnaire.title}</h2>
              <p className="text-xs md:text-sm text-slate-700 mt-1 font-semibold leading-relaxed">{questionnaire.overview}</p>
            </div>
            <button
              onClick={() => setStep(1)}
              className="bg-white border-2 border-slate-300 text-slate-800 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-extrabold hover:bg-slate-100 transition-all shadow-xs"
            >
              ← Chọn lại loại doc
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-sm md:text-base font-extrabold text-purple-900">
              Danh sách câu hỏi thu thập đặc tả ({questionnaire.questions.length} mục) — Xác nhận hoặc bổ sung câu trả lời:
            </p>

            {questionnaire.questions.map((q) => (
              <div key={q.id} className="bg-white border-2 border-purple-200 rounded-xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-extrabold text-purple-900 bg-purple-100 border border-purple-300 px-2.5 py-0.5 rounded-md">{q.id}</span>
                  <span className="text-xs bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-0.5 rounded-md font-bold">{q.section}</span>
                  <span className="font-extrabold text-slate-900 text-sm md:text-base">{q.question}</span>
                </div>
                {q.why && <p className="text-xs text-slate-600 font-medium">Lý do đặc tả: {q.why}</p>}
                <div>
                  <textarea
                    value={answers[q.id] ?? ''}
                    onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Nhập câu trả lời hoặc chỉnh sửa gợi ý..."
                    rows={2}
                    className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-3 text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold resize-y"
                  />
                </div>
              </div>
            ))}

            <div className="space-y-1">
              <label className="block text-xs md:text-sm font-extrabold text-slate-900">Ghi chú bổ sung khác (Tuỳ chọn)</label>
              <textarea
                value={extraNotes}
                onChange={e => setExtraNotes(e.target.value)}
                placeholder="Yêu cầu thêm về thuật ngữ, quy định nghiệp vụ riêng..."
                rows={2}
                className="w-full bg-white border-2 border-slate-300 rounded-xl p-3 text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
              />
            </div>
          </div>

          {/* Multi-Turn Elicitation Action Bar */}
          <div className="flex gap-3 justify-between items-center pt-4 border-t-2 border-purple-200 flex-wrap">
            <div className="flex items-center gap-2 text-xs md:text-sm font-extrabold text-purple-900 bg-purple-100 border border-purple-300 px-3.5 py-1.5 rounded-xl font-mono">
              <span>💬 Phỏng vấn Vòng {round}</span>
              <span>•</span>
              <span>{questionnaire.questions.length} câu hỏi đặc tả</span>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button
                type="button"
                onClick={generateNextRoundQuestions}
                disabled={loading}
                className="bg-white text-purple-900 border-2 border-purple-400 hover:bg-purple-100 px-4 py-3 rounded-xl text-xs md:text-sm font-extrabold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                title="Yêu cầu AI phân tích tiếp các lỗ hổng nâng cao để hỏi Vòng tiếp theo"
              >
                <span>💬 {loading ? 'AI đang phân tích...' : `Hỏi thêm Vòng ${round + 1} (Tuỳ chọn)`}</span>
              </button>

              <button
                type="button"
                onClick={() => generateDocumentDraft()}
                disabled={loading}
                className="bg-purple-600 text-white px-6 py-3 rounded-xl text-xs md:text-sm font-extrabold hover:bg-purple-500 transition-all shadow-md flex items-center gap-1.5"
                title="AI dùng câu trả lời hiện có + Tự động lấp lỗ hổng bằng Giả định thiết kế để ra ngay tài liệu hoàn chỉnh"
              >
                <span>🚀 AI Tự động Biên soạn Đặc tả Hoàn chỉnh ➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BƯỚC 3: Đang Sinh Tài Liệu */}
      {step === 3 && (
        <div className="bg-purple-50/70 border-2 border-purple-300 rounded-2xl p-12 text-center space-y-4 shadow-md text-slate-900">
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">AI đang biên soạn tài liệu Yêu cầu Phase 1...</h2>
          <p className="text-xs md:text-sm font-semibold text-slate-700 max-w-md mx-auto">
            AI đang áp dụng các chuẩn của {DOC_BUILDER_STANDARDS[standard]?.label} để tạo file {docType.toUpperCase()} gốc cho project.
          </p>
        </div>
      )}

      {/* BƯỚC 4: Review & Lưu Baseline */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-purple-50/80 border-2 border-purple-300 rounded-2xl p-6 flex-wrap gap-3 shadow-md text-slate-900">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-900">{docType.toUpperCase()} Requirement Baseline</h2>
                <span className="text-xs md:text-sm bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-md font-extrabold">Đã lưu Phase 1 Baseline</span>
              </div>
              <p className="text-xs md:text-sm text-slate-700 mt-1 font-bold">Tiêu chuẩn: {DOC_BUILDER_STANDARDS[standard]?.label}</p>
            </div>

            <Link
              href={`/projects/${projectId}/generate?agent=review-requirement`}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs md:text-sm font-extrabold hover:bg-indigo-500 transition-all shadow-md"
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
              className="bg-white border-2 border-slate-300 text-slate-800 px-5 py-2.5 rounded-xl text-xs md:text-sm font-extrabold hover:bg-slate-100 transition-all shadow-xs"
            >
              Soạn tài liệu yêu cầu khác
            </button>

            <Link
              href={`/projects/${projectId}`}
              className="bg-slate-100 text-slate-900 border-2 border-slate-300 px-6 py-2.5 rounded-xl text-xs md:text-sm font-extrabold hover:bg-slate-200 transition-all shadow-xs"
            >
              ← Trở về
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
