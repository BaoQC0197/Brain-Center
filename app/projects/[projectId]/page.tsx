'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Project,
  RawDocument,
  GeneratedDocument,
  QAAgentType,
  RAW_DOC_META,
  QA_AGENTS,
  RawDocType,
} from '@/lib/types'
import RawDocsManager from '@/app/components/RawDocsManager'
import GeneratedDocsManager from '@/app/components/GeneratedDocsManager'
import DocumentViewer from '@/app/components/DocumentViewer'
import { ProjectDetailSkeleton } from '@/app/components/Skeletons'

const UPLOAD_DOC_TYPES: { type: RawDocType; label: string }[] = [
  { type: 'brd', label: 'BRD - Đặc tả Yêu cầu Kinh doanh' },
  { type: 'srs', label: 'SRS - Đặc tả Yêu cầu Phần mềm' },
  { type: 'user-story', label: 'User Story - Danh sách User Stories & AC' },
  { type: 'feature-request', label: 'Feature Spec - Yêu cầu tính năng' },
  { type: 'api-spec', label: 'API Spec - Swagger / OpenAPI' },
  { type: 'email-notes', label: 'Ghi chú / Email Yêu cầu' },
]

function EditProjectModal({
  project,
  onClose,
  onSaved,
}: {
  project: Project
  onClose: () => void
  onSaved: (updated: Project) => void
}) {
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || '')
  const [techStack, setTechStack] = useState(project.techStack || '')
  const [stagingUrl, setStagingUrl] = useState(project.stagingUrl || '')
  const [prodUrl, setProdUrl] = useState(project.prodUrl || '')
  const [bugListUrl, setBugListUrl] = useState(project.bugListUrl || '')
  const [figmaUrl, setFigmaUrl] = useState(project.figmaUrl || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Vui lòng nhập tên dự án')
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          techStack: techStack.trim(),
          stagingUrl: stagingUrl.trim(),
          prodUrl: prodUrl.trim(),
          bugListUrl: bugListUrl.trim(),
          figmaUrl: figmaUrl.trim(),
        }),
      })
      const updated = await res.json()
      if (!res.ok) throw new Error(updated.error || 'Lỗi cập nhật dự án')
      onSaved(updated)
    } catch (err: any) {
      setError(err.message || 'Không thể lưu dự án')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center z-50 p-4 sm:p-6 backdrop-blur-xs">
      <div className="bg-white border-2 border-indigo-400 rounded-3xl shadow-2xl p-5 md:p-6 w-full max-w-xl space-y-4 text-slate-900 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
          <h2 className="font-extrabold text-lg md:text-xl text-slate-900">
            Chỉnh sửa Dự án
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg font-extrabold p-1 cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm md:text-base font-extrabold text-slate-900 mb-1.5">Tên dự án <span className="text-rose-600 font-bold">*</span></label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Tên dự án..."
              className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-sm md:text-base text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm md:text-base font-extrabold text-slate-900 mb-1.5">Mô tả ngắn nghiệp vụ</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              placeholder="Mô tả dự án..."
              className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-sm md:text-base text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y leading-relaxed"
            />
          </div>
          <div>
            <label className="block text-sm md:text-base font-extrabold text-slate-900 mb-1.5">Tech Stack</label>
            <input
              value={techStack}
              onChange={e => setTechStack(e.target.value)}
              placeholder="Ví dụ: React, Node.js, PostgreSQL"
              className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-sm md:text-base text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quick Domain & Tool Links Config Section */}
          <div className="grid sm:grid-cols-2 gap-3 bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl">
            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1 flex items-center gap-1">
                <span>🟡 Staging URL</span>
              </label>
              <input
                value={stagingUrl}
                onChange={e => setStagingUrl(e.target.value)}
                placeholder="https://staging.app.com"
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1 flex items-center gap-1">
                <span>🟢 Production URL</span>
              </label>
              <input
                value={prodUrl}
                onChange={e => setProdUrl(e.target.value)}
                placeholder="https://app.com"
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1 flex items-center gap-1">
                <span>🎨 Figma Link URL</span>
              </label>
              <input
                value={figmaUrl}
                onChange={e => setFigmaUrl(e.target.value)}
                placeholder="https://www.figma.com/file/..."
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-pink-500"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-900 mb-1 flex items-center gap-1">
                <span>🔴 Bug List Online URL</span>
              </label>
              <input
                value={bugListUrl}
                onChange={e => setBugListUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/..."
                className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>


          {error && <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold">{error}</div>}

          <div className="flex gap-4 pt-4 border-t-2 border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border-2 border-slate-300 rounded-xl py-3 text-sm md:text-base font-extrabold text-slate-700 hover:bg-slate-100 transition-all"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-sm md:text-base font-extrabold transition-all disabled:opacity-50 shadow-md"
            >
              {saving ? 'Đang lưu...' : 'Lưu Thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AddRawDocModal({
  projectId,
  onClose,
  onSaved,
}: {
  projectId: string
  onClose: () => void
  onSaved: (doc: RawDocument) => void
}) {
  const [activeTab, setActiveTab] = useState<'upload' | 'figma' | 'audio'>('upload')
  const [docType, setDocType] = useState<string>('brd')
  const [name, setName] = useState('')
  const [textContent, setTextContent] = useState('')
  const [figmaUrl, setFigmaUrl] = useState('')
  const [figmaMeta, setFigmaMeta] = useState<{ name?: string; lastModified?: string } | null>(null)
  const [figmaLoading, setFigmaLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  // Audio Recording & Transcription States
  const [audioBase64, setAudioBase64] = useState<string>('')
  const [audioMime, setAudioMime] = useState<string>('audio/webm')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [transcribing, setTranscribing] = useState(false)
  const [transcribedText, setTranscribedText] = useState('')

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (isRecording) {
      timer = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isRecording])

  async function fetchFigmaMeta() {
    if (!figmaUrl) return
    setFigmaLoading(true)
    try {
      const res = await fetch('/api/figma/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ figmaUrl }),
      })
      const data = await res.json()
      if (res.ok && data.meta) {
        setFigmaMeta(data.meta)
        if (!name && data.meta.name) setName(`Figma - ${data.meta.name}`)
      } else {
        setFigmaMeta(null)
      }
    } catch {
      setFigmaMeta(null)
    }
    setFigmaLoading(false)
  }

  function handleFileUpload(file: File) {
    if (!name) setName(file.name.replace(/\.[^/.]+$/, ''))

    if (file.type.startsWith('audio/')) {
      handleAudioFileUpload(file)
      return
    }

    const reader = new FileReader()
    reader.onload = e => {
      setTextContent(e.target?.result as string)
    }
    reader.readAsText(file)
  }

  async function startRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = e => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' })
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64Data = reader.result as string
          setAudioBase64(base64Data)
          const mime = recorder.mimeType || 'audio/webm'
          setAudioMime(mime)
          if (!name) setName(`Ghi âm cuộc họp - ${new Date().toLocaleTimeString('vi-VN')} ${new Date().toLocaleDateString('vi-VN')}`)
          setDocType('meeting-minutes')

          setTranscribing(true)
          try {
            const res = await fetch('/api/transcribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audioBase64: base64Data, audioMime: mime }),
            })
            const data = await res.json()
            if (res.ok && data.textContent) {
              setTranscribedText(data.textContent)
              setTextContent(data.textContent)
            } else if (data.error) {
              setError(`Bóc tách âm thanh: ${data.error}`)
            }
          } catch {
            setError('Lỗi kết nối khi bóc tách âm thanh sang văn bản')
          }
          setTranscribing(false)
        }
        reader.readAsDataURL(audioBlob)
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingTime(0)
    } catch {
      setError('Không thể mở Microphone thiết bị. Vui lòng cho phép quyền truy cập Mic.')
    }
  }

  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      mediaRecorder.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
    }
  }

  function handleAudioFileUpload(file: File) {
    if (!name) setName(file.name.replace(/\.[^/.]+$/, ''))
    setDocType('meeting-minutes')
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64Data = reader.result as string
      setAudioBase64(base64Data)
      const mime = file.type || 'audio/mp3'
      setAudioMime(mime)

      setTranscribing(true)
      try {
        const res = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64: base64Data, audioMime: mime }),
        })
        const data = await res.json()
        if (res.ok && data.textContent) {
          setTranscribedText(data.textContent)
          setTextContent(data.textContent)
        } else if (data.error) {
          setError(`Bóc tách âm thanh: ${data.error}`)
        }
      } catch {
        setError('Lỗi khi bóc tách âm thanh sang văn bản')
      }
      setTranscribing(false)
    }
    reader.readAsDataURL(file)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Vui lòng nhập tên tài liệu')

    setSaving(true)
    setError('')
    try {
      const body: any = { type: docType, name: name.trim() }

      if (activeTab === 'figma') {
        if (!figmaUrl.trim()) throw new Error('Vui lòng nhập URL Figma')
        body.type = 'figma'
        body.figmaUrl = figmaUrl.trim()
        if (figmaMeta) body.textContent = `Figma File: ${figmaMeta.name}\nLast Modified: ${figmaMeta.lastModified}`
      } else if (activeTab === 'audio') {
        body.type = 'meeting-minutes'
        body.audioBase64 = audioBase64
        body.audioMime = audioMime
        body.textContent = textContent.trim() || transcribedText.trim()
        if (!body.textContent) throw new Error('Chưa có văn bản bóc tách từ ghi âm. Vui lòng thu âm hoặc chọn file ghi âm.')
      } else {
        if (!textContent.trim()) throw new Error('Vui lòng chọn file văn bản hoặc ghi âm từ máy')
        body.textContent = textContent.trim()
        if (audioBase64) {
          body.audioBase64 = audioBase64
          body.audioMime = audioMime
        }
      }

      const res = await fetch(`/api/projects/${projectId}/raw-docs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const doc = await res.json()
      if (!res.ok) throw new Error(doc.error || 'Có lỗi xảy ra khi lưu tài liệu')
      onSaved(doc)
    } catch (err: any) {
      setError(err.message || 'Không thể lưu tài liệu. Vui lòng thử lại.')
    }
    setSaving(false)
  }

  const canSave = name.trim() && (
    (activeTab === 'figma' && figmaUrl.trim()) ||
    (activeTab === 'audio' && (textContent.trim() || transcribedText.trim() || audioBase64)) ||
    (activeTab === 'upload' && textContent.trim())
  )

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60)
    const secs = sec % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center z-50 p-4 sm:p-6 backdrop-blur-xs">
      <div className="bg-white border-2 border-indigo-300 rounded-3xl shadow-2xl p-5 md:p-6 w-full max-w-xl md:max-w-2xl space-y-4 text-slate-900 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
          <div>
            <h2 className="font-extrabold text-lg md:text-xl text-slate-900">
              Thêm Tài liệu Yêu cầu Đầu vào (Phase 1 Baseline)
            </h2>
            <p className="text-xs font-bold text-slate-500 mt-0.5">
              Tải file, ghi âm cuộc họp hoặc chèn link Figma làm ngữ cảnh cho Trợ lý Kiểm thử
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg font-extrabold p-1 cursor-pointer">✕</button>
        </div>

        {/* Source Tab Switcher (3 Tabs Only: Upload, Audio, Figma) */}
        <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl border-2 border-slate-300 text-xs md:text-sm font-extrabold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload')
              if (docType === 'meeting-minutes' || docType === 'figma') {
                setDocType('brd')
              }
            }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${activeTab === 'upload' ? 'bg-indigo-600 text-white shadow-md font-extrabold' : 'text-slate-700 hover:text-slate-900'}`}
          >
            Upload File
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('audio')
              setDocType('meeting-minutes')
            }}
            className={`py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'audio' ? 'bg-teal-600 text-white shadow-md font-extrabold' : 'text-slate-700 hover:text-teal-900'}`}
          >
            <span>🎙️ Ghi âm Cuộc họp</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('figma')
              setDocType('figma')
            }}
            className={`py-2 rounded-xl transition-all cursor-pointer ${activeTab === 'figma' ? 'bg-indigo-600 text-white shadow-md font-extrabold' : 'text-slate-700 hover:text-slate-900'}`}
          >
            Link Figma
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs md:text-sm font-extrabold text-slate-900 mb-1">Loại tài liệu</label>
              {activeTab === 'audio' ? (
                <input
                  disabled
                  value="Meeting Minutes - Biên bản họp / Transcribe"
                  className="w-full bg-slate-100 border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-600 font-extrabold cursor-not-allowed"
                />
              ) : activeTab === 'figma' ? (
                <input
                  disabled
                  value="Thiết kế Figma (UI/UX)"
                  className="w-full bg-slate-100 border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-600 font-extrabold cursor-not-allowed"
                />
              ) : (
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {UPLOAD_DOC_TYPES.map(t => (
                    <option key={t.type} value={t.type}>{t.label}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-xs md:text-sm font-extrabold text-slate-900 mb-1">Tên tài liệu <span className="text-rose-600 font-bold">*</span></label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ví dụ: Tài liệu đặc tả luồng Thanh toán"
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>
          </div>

          {activeTab === 'upload' && (
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault()
                setDragOver(false)
                if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0])
              }}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${dragOver ? 'border-indigo-500 bg-indigo-100/60' : 'border-indigo-300 bg-indigo-50/50 hover:border-indigo-500 hover:bg-indigo-50'}`}
            >
              <input
                type="file"
                id="file-input"
                className="hidden"
                accept=".txt,.md,.json,.doc,.docx,.pdf,.mp3,.wav,.m4a,.webm,.ogg"
                onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
              <label htmlFor="file-input" className="cursor-pointer space-y-1.5 block">
                <p className="text-sm md:text-base font-extrabold text-slate-900">Kéo thả file vào đây hoặc <span className="text-indigo-600 underline">chọn file từ máy</span></p>
                <p className="text-xs font-bold text-slate-500">Hỗ trợ Văn bản (.txt, .md, .doc, .pdf) và File Ghi âm (.mp3, .m4a, .wav, .webm)</p>
              </label>
              {textContent && (
                <div className="mt-3 p-2.5 bg-emerald-100 rounded-xl text-xs text-emerald-900 font-mono font-bold truncate border-2 border-emerald-300 shadow-xs">
                  Đã nhận văn bản ({textContent.length.toLocaleString('vi-VN')} ký tự)
                </div>
              )}
            </div>
          )}

          {activeTab === 'audio' && (
            <div className="bg-teal-50/80 border-2 border-teal-300 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b-2 border-teal-200 pb-3">
                <div>
                  <h3 className="font-extrabold text-teal-950 text-sm md:text-base">🎙️ Thu âm Trực tiếp hoặc Upload File Ghi âm Cuộc họp</h3>
                  <p className="text-[11px] text-teal-800 font-bold mt-0.5">
                    Trợ lý sẽ tự động lắng nghe và chuyển toàn bộ cuộc họp thành văn bản Tiếng Việt chi tiết (Transcript & Key Decisions) để làm ngữ cảnh kiểm thử.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <span className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                      <span>Bắt đầu Ghi âm Mic</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <span className="w-2.5 h-2.5 bg-rose-500 rounded-xs animate-ping" />
                      <span>⏹️ Dừng Ghi âm ({formatTimer(recordingTime)})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Alternative Audio File Upload in Audio Tab */}
              <div className="flex items-center justify-between bg-white p-2.5 border-2 border-teal-200 rounded-xl flex-wrap gap-2 text-xs font-bold">
                <span className="text-teal-900 font-extrabold">Hoặc chọn file ghi âm từ máy (.mp3, .m4a, .wav, .webm):</span>
                <input
                  type="file"
                  accept="audio/*,.mp3,.m4a,.wav,.webm,.ogg"
                  onChange={e => e.target.files?.[0] && handleAudioFileUpload(e.target.files[0])}
                  className="text-xs text-slate-700 file:bg-teal-600 file:text-white file:border-0 file:px-2.5 file:py-1 file:rounded-lg file:font-extrabold cursor-pointer"
                />
              </div>

              {/* Audio Preview Player */}
              {audioBase64 && (
                <div className="bg-white p-2.5 border-2 border-teal-300 rounded-xl flex items-center justify-between flex-wrap gap-2 shadow-xs">
                  <span className="text-xs font-mono font-extrabold text-teal-900">Audio Preview:</span>
                  <audio controls src={audioBase64} className="h-8 rounded-lg max-w-full" />
                </div>
              )}

              {/* Transcription Loading Indicator */}
              {transcribing && (
                <div className="bg-amber-100 border-2 border-amber-300 text-amber-900 p-3 rounded-xl text-xs font-extrabold flex items-center gap-2 animate-pulse">
                  <span className="text-lg animate-spin">⚡</span>
                  <span>Trợ lý đang tự động lắng nghe và chuyển đổi âm thanh cuộc họp sang văn bản...</span>
                </div>
              )}

              {/* Transcribed Text Preview Editor */}
              {(textContent || transcribedText) && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-teal-950">Văn bản Bóc tách từ Ghi âm (Xem và Chỉnh sửa):</label>
                    <span className="text-[11px] font-mono text-teal-700 font-extrabold">{(textContent || transcribedText).length.toLocaleString('vi-VN')} ký tự</span>
                  </div>
                  <textarea
                    value={textContent || transcribedText}
                    onChange={e => setTextContent(e.target.value)}
                    rows={4}
                    className="w-full bg-white border-2 border-teal-300 rounded-xl p-3 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed font-semibold resize-y"
                    placeholder="Văn bản bóc tách từ cuộc họp..."
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'figma' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs md:text-sm font-extrabold text-slate-900 mb-1">
                  URL Figma Design <span className="text-rose-600 font-bold">*</span>
                </label>
                <div className="flex gap-2.5">
                  <input
                    required
                    type="url"
                    value={figmaUrl}
                    onChange={e => setFigmaUrl(e.target.value)}
                    placeholder="https://www.figma.com/file/..."
                    className="flex-1 bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                  <button
                    type="button"
                    onClick={fetchFigmaMeta}
                    disabled={figmaLoading || !figmaUrl}
                    className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs md:text-sm font-extrabold hover:bg-indigo-500 disabled:opacity-40 transition-all shadow-md cursor-pointer"
                  >
                    {figmaLoading ? 'Fetching...' : 'Lấy thông tin'}
                  </button>
                </div>
              </div>
              {figmaMeta && (
                <div className="bg-slate-50 border-2 border-slate-300 rounded-xl p-3 text-xs space-y-1 font-mono text-slate-800 font-bold">
                  <div>Tên File: <strong className="text-slate-900 font-extrabold">{figmaMeta.name}</strong></div>
                  {figmaMeta.lastModified && <div>Cập nhật: {new Date(figmaMeta.lastModified).toLocaleDateString('vi-VN')}</div>}
                </div>
              )}
            </div>
          )}

          {error && <div className="bg-red-50 border-2 border-red-200 text-red-600 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-bold">{error}</div>}

          <div className="flex gap-3 pt-3 border-t-2 border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 border-2 border-slate-300 rounded-xl py-2.5 text-xs md:text-sm font-extrabold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer">Huỷ</button>
            <button
              type="submit"
              disabled={saving || figmaLoading || transcribing || isRecording || !canSave}
              className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-xs md:text-sm font-extrabold hover:bg-indigo-500 transition-all disabled:opacity-40 shadow-md cursor-pointer"
            >
              {figmaLoading ? 'Đang tải...' : transcribing ? 'Đang bóc tách âm thanh...' : saving ? 'Đang lưu...' : 'Lưu tài liệu Phase 1'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


function ImportStepDocModal({
  agentType,
  projectId,
  onClose,
  onSaved,
}: {
  agentType: QAAgentType
  projectId: string
  onClose: () => void
  onSaved: (doc: GeneratedDocument) => void
}) {
  const meta = QA_AGENTS[agentType]
  const [name, setName] = useState(`File ngoài: ${meta.label}`)
  const [textContent, setTextContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleFileUpload(file: File) {
    if (!name || name === `File ngoài: ${meta.label}`) {
      setName(file.name.replace(/\.[^/.]+$/, ''))
    }
    const reader = new FileReader()
    reader.onload = e => {
      setTextContent(e.target?.result as string)
    }
    reader.readAsText(file)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return setError('Vui lòng nhập tên tài liệu')
    if (!textContent.trim()) return setError('Vui lòng upload file hoặc dán nội dung văn bản')

    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: agentType,
          inputSummary: name,
          content: textContent.trim(),
        }),
      })
      const doc = await res.json()
      if (!res.ok) throw new Error(doc.error || 'Có lỗi xảy ra khi lưu document')
      onSaved(doc)
    } catch (err: any) {
      setError(err.message || 'Không thể lưu tài liệu. Vui lòng thử lại.')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center z-50 p-4 sm:p-6 backdrop-blur-xs">
      <div className="bg-white border-2 border-emerald-400 rounded-3xl shadow-2xl p-5 md:p-6 w-full max-w-xl md:max-w-2xl space-y-4 text-slate-900 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
          <div>
            <h2 className="font-extrabold text-lg md:text-xl text-slate-900">
              Nhập File / Nội dung ngoài cho {meta.label} (Step {meta.stepOrder})
            </h2>
            <p className="text-xs font-bold text-slate-500 mt-0.5">
              Tải file (.txt, .md, .json, .csv, .pdf, .docx) hoặc dán tài liệu đã có để mở khoá quy trình
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg font-extrabold p-1 cursor-pointer">✕</button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm md:text-base font-extrabold text-slate-900 mb-1.5">Tên tài liệu / Tiêu đề <span className="text-rose-600 font-bold">*</span></label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={`Ví dụ: ${meta.label} - File có sẵn từ dự án`}
              className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-sm md:text-base text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm md:text-base font-extrabold text-slate-900">Tải file từ máy tính</label>
            <input
              type="file"
              accept=".txt,.md,.json,.csv,.pdf,.docx"
              onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-800 font-semibold"
            />
          </div>

          <div>
            <label className="block text-sm md:text-base font-extrabold text-slate-900 mb-1.5">Hoặc dán trực tiếp nội dung văn bản <span className="text-rose-600 font-bold">*</span></label>
            <textarea
              value={textContent}
              onChange={e => setTextContent(e.target.value)}
              rows={10}
              placeholder="Dán nội dung tài liệu tại đây..."
              className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-4 text-xs md:text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-y leading-relaxed font-semibold"
            />
          </div>

          {error && <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-bold">{error}</div>}

          <div className="flex gap-4 pt-4 border-t-2 border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 border-2 border-slate-300 rounded-xl py-3 text-sm md:text-base font-extrabold text-slate-700 hover:bg-slate-100 transition-all">Huỷ</button>
            <button
              type="submit"
              disabled={saving || !name.trim() || !textContent.trim()}
              className="flex-1 bg-emerald-600 text-white rounded-xl py-3 text-sm md:text-base font-extrabold hover:bg-emerald-500 transition-all disabled:opacity-40 shadow-md"
            >
              {saving ? 'Đang lưu...' : 'Nhập & Mở khoá Step này'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [rawDocs, setRawDocs] = useState<RawDocument[]>([])
  const [docs, setDocs] = useState<GeneratedDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'phase1' | 'phase2' | 'artifacts'>('phase1')

  const [showAddRaw, setShowAddRaw] = useState(false)
  const [showEditProject, setShowEditProject] = useState(false)
  const [importingAgent, setImportingAgent] = useState<QAAgentType | null>(null)
  const [viewingDoc, setViewingDoc] = useState<{ title: string; docType: string; content: string; version?: number; createdAt?: string; docId?: string; isRawDoc?: boolean; audioBase64?: string; figmaUrl?: string } | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}`).then(r => r.json()),
      fetch(`/api/projects/${projectId}/raw-docs`).then(r => r.json()),
      fetch(`/api/projects/${projectId}/documents`).then(r => r.json()),
    ]).then(([proj, raws, generated]) => {
      setProject(proj)
      setRawDocs(raws)
      setDocs(generated)
      setLoading(false)
      // Auto switch to Phase 2 if Phase 1 has docs and Phase 2 has generated docs
      if (raws.length > 0 && generated.length > 0) {
        setActiveTab('phase2')
      }
    })
  }, [projectId])

  async function deleteRawDoc(id: string, name: string) {
    if (!confirm(`Xoá "${name}"?`)) return
    await fetch(`/api/projects/${projectId}/raw-docs/${id}`, { method: 'DELETE' })
    setRawDocs(prev => prev.filter(d => d.id !== id))
  }

  async function deleteDoc(docId: string) {
    if (!confirm('Xoá tài liệu này?')) return
    await fetch(`/api/projects/${projectId}/documents/${docId}`, { method: 'DELETE' })
    setDocs(prev => prev.filter(d => d.id !== docId))
  }

  if (loading) return <ProjectDetailSkeleton />
  if (!project) return <div className="text-red-600 py-12 text-center">Dự án không tồn tại</div>

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Compact High-Density Header Bar */}
      <div className="bg-white border-2 border-slate-300 px-5 py-3.5 rounded-2xl shadow-xs flex items-center justify-between flex-wrap gap-3">
        {/* Left Side: Back Button */}
        <Link
          href="/"
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-extrabold border border-slate-300 transition-all flex items-center gap-1 shrink-0"
        >
          ← Trở về
        </Link>

        {/* Right Side: Larger Project Name Only */}
        <h1 className="text-xl md:text-2xl font-black text-slate-900 ml-auto tracking-tight">{project.name}</h1>
      </div>

      {/* Amber/Orange High-Contrast 3-Phase Tab Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Tab 1: Phase 1 */}
        <button
          type="button"
          onClick={() => setActiveTab('phase1')}
          className={`p-6 rounded-2xl transition-all text-left border-2 flex flex-col justify-between space-y-4 cursor-pointer ${activeTab === 'phase1'
            ? 'bg-gradient-to-br from-amber-500 to-orange-600 border-amber-600 text-white shadow-lg shadow-amber-500/25 ring-4 ring-amber-200 translate-y-[-2px]'
            : 'bg-white border-slate-200 text-slate-900 hover:border-amber-400 hover:bg-amber-50/40 shadow-xs'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono font-extrabold px-3 py-1 rounded-md tracking-wider ${activeTab === 'phase1' ? 'bg-amber-950/40 text-amber-100 border border-amber-300/40' : 'bg-amber-100 text-amber-950 border border-amber-200'
              }`}>
              PHASE 1
            </span>
            <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${activeTab === 'phase1' ? 'bg-white text-amber-950 font-black shadow-xs' : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
              {rawDocs.length} Docs
            </span>
          </div>
          <div>
            <h2 className={`text-lg md:text-xl font-extrabold tracking-tight ${activeTab === 'phase1' ? 'text-white' : 'text-slate-900'}`}>
              Lưu trữ & Quản lý tài liệu đầu vào (Baseline)
            </h2>
            <p className={`text-xs md:text-sm mt-1.5 font-medium leading-relaxed ${activeTab === 'phase1' ? 'text-amber-50' : 'text-slate-500'}`}>
              BRD, SRS, User Story, Figma & Audio
            </p>
          </div>
        </button>

        {/* Tab 2: Phase 2 */}
        <button
          type="button"
          onClick={() => setActiveTab('phase2')}
          className={`p-6 rounded-2xl transition-all text-left border-2 flex flex-col justify-between space-y-4 cursor-pointer ${activeTab === 'phase2'
            ? 'bg-gradient-to-br from-amber-500 to-orange-600 border-amber-600 text-white shadow-lg shadow-amber-500/25 ring-4 ring-amber-200 translate-y-[-2px]'
            : 'bg-white border-slate-200 text-slate-900 hover:border-amber-400 hover:bg-amber-50/40 shadow-xs'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-mono font-extrabold px-3 py-1 rounded-md tracking-wider ${activeTab === 'phase2' ? 'bg-amber-950/40 text-amber-100 border border-amber-300/40' : 'bg-amber-100 text-amber-950 border border-amber-200'
              }`}>
              PHASE 2
            </span>
            <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full ${activeTab === 'phase2' ? 'bg-white text-amber-950 font-black shadow-xs' : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}>
              {docs.length} Files
            </span>
          </div>
          <div>
            <h2 className={`text-lg md:text-xl font-extrabold tracking-tight ${activeTab === 'phase2' ? 'text-white' : 'text-slate-900'}`}>
              Quy trình QA Testing Lifecycle
            </h2>
            <p className={`text-xs md:text-sm mt-1.5 font-medium leading-relaxed ${activeTab === 'phase2' ? 'text-amber-50' : 'text-slate-500'}`}>
              Review Requirement, Strategy, Cases & Report
            </p>
          </div>
        </button>
      </div>

      {/* TAB 1 CONTENT: PHASE 1 REQUIREMENT BASELINE */}
      {activeTab === 'phase1' && (
        <RawDocsManager
          rawDocs={rawDocs}
          projectId={projectId}
          projectName={project.name}
          onDeleteRawDoc={deleteRawDoc}
          onViewRawDoc={doc => setViewingDoc({
            docId: doc.id,
            title: doc.name,
            docType: doc.type,
            content: doc.figmaUrl
              ? `🔗 **URL Figma Design**: [${doc.figmaUrl}](${doc.figmaUrl})\n\n---\n\n${doc.textContent || ''}`
              : (doc.textContent || 'Tài liệu dạng hình ảnh hoặc file đính kèm.'),
            figmaUrl: doc.figmaUrl,
            audioBase64: doc.audioBase64,
            createdAt: doc.createdAt,
            isRawDoc: true,
          })}
          onAddRawDoc={() => setShowAddRaw(true)}
        />
      )}

      {/* TAB 2 CONTENT: PHASE 2 QA TESTING LIFECYCLE AGENT HUB */}
      {activeTab === 'phase2' && (() => {
        const hasPhase1Docs = rawDocs.length > 0
        const hasDoc = (docType: string) => docs.some(d => d.type === docType)

        function checkLock(type: QAAgentType): { isLocked: boolean; reason: string; reqName: string } {
          switch (type) {
            case 'review-requirement':
            case 'acceptance-criteria':
              if (!hasPhase1Docs) return { isLocked: true, reason: 'Cần upload/tạo ít nhất 1 tài liệu Yêu cầu ở Phase 1 Baseline.', reqName: 'Phase 1 Baseline' }
              return { isLocked: false, reason: '', reqName: '' }

            case 'test-plan':
            case 'test-strategy':
              if (!hasDoc('review-requirement') && !hasDoc('acceptance-criteria') && !hasPhase1Docs) return { isLocked: true, reason: 'Bắt buộc phải có tài liệu từ Step 1 (Requirements Review & AC) trước!', reqName: 'Step 1 Review & AC' }
              return { isLocked: false, reason: '', reqName: '' }

            case 'test-case':
            case 'test-scenario':
              if (!hasDoc('test-plan') && !hasDoc('test-strategy') && !hasDoc('review-requirement')) return { isLocked: true, reason: 'Bắt buộc phải có tài liệu từ Step 2 (Master Test Strategy & Plan) trước!', reqName: 'Step 2 Test Plan' }
              return { isLocked: false, reason: '', reqName: '' }

            case 'test-report':
            case 'regression-checklist':
              if (!hasDoc('test-case') && !hasDoc('test-cases') && !hasDoc('test-scenario')) return { isLocked: true, reason: 'Bắt buộc phải có tài liệu từ Step 3 (Test Scenarios & Detailed Cases) trước!', reqName: 'Step 3 Test Case' }
              return { isLocked: false, reason: '', reqName: '' }
          }
        }

        return (
          <div className="space-y-6">
            {/* PHASE 2 CONTAINER WITH SOFT INDIGO BACKGROUND TINT & BOLD BORDERS */}
            <div className="bg-indigo-50/70 border-2 border-indigo-300 border-l-8 border-l-indigo-600 rounded-2xl p-6 space-y-6 shadow-md text-slate-900">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs md:text-sm bg-indigo-600 text-white px-3 py-1 rounded-md font-extrabold font-mono shadow-sm">
                      PHASE 2 ➔ QA LIFECYCLE PIPELINE
                    </span>
                    <h2 className="font-extrabold text-slate-900 text-xl md:text-2xl tracking-tight">Quy trình Kiểm thử Tiêu chuẩn (ISTQB & IEEE 829)</h2>
                  </div>
                  <p className="text-xs md:text-sm text-slate-700 mt-1.5 font-bold leading-relaxed">
                    Vận hành 4 bước kiểm thử tự động (Step 1 ➔ Step 4) để khởi tạo Chiến lược, Kịch bản & Báo cáo Release
                  </p>
                </div>

                <div className="text-xs md:text-sm text-indigo-950 bg-white border-2 border-indigo-300 px-3.5 py-1.5 rounded-full font-mono font-extrabold shadow-xs">
                  {rawDocs.length} Tài liệu Baseline sẵn sàng
                </div>
              </div>

              {/* 8 QA Agents Grid Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(Object.entries(QA_AGENTS) as [QAAgentType, typeof QA_AGENTS[QAAgentType]][]).map(([type, agent]) => {
                  const lockStatus = checkLock(type)
                  const isLocked = lockStatus.isLocked

                  const existingTypeDocs = docs.filter(d => d.type === (type === 'test-case' ? 'test-cases' : type))
                  const hasRunBefore = existingTypeDocs.length > 0
                  const latestVersion = hasRunBefore ? Math.max(...existingTypeDocs.map(d => d.version || 1)) : 0

                  return (
                    <div
                      key={type}
                      className={`rounded-xl p-4 flex flex-col justify-between space-y-3.5 border-2 transition-all ${isLocked
                        ? 'bg-slate-100/90 border-slate-300 opacity-60'
                        : 'bg-white border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 group shadow-xs hover:shadow-md'
                        }`}
                    >
                      <div className="space-y-3">
                        {/* Top Bar: Step Order Highlight, Completed Pill */}
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-xs font-mono px-2.5 py-0.5 rounded-md font-extrabold ${isLocked
                            ? 'bg-slate-200 text-slate-700 border border-slate-300'
                            : 'bg-indigo-600 text-white shadow-xs'
                            }`}>
                            Step {agent.stepOrder}
                          </span>
                          {hasRunBefore && (
                            <span className="text-xs bg-indigo-100 text-indigo-950 border border-indigo-200 px-2 py-0.5 rounded-md font-mono font-extrabold">
                              Đã có (v{latestVersion})
                            </span>
                          )}
                        </div>

                        {/* Title & Testing Standard Tag */}
                        <div className="space-y-1">
                          <h4 className={`font-extrabold text-sm md:text-base leading-snug ${isLocked ? 'text-slate-500' : 'text-slate-900 group-hover:text-indigo-600 transition-colors'}`}>
                            {agent.label}
                          </h4>
                          <div className="inline-block bg-slate-100 border border-slate-300 text-xs text-slate-700 font-mono px-2 py-0.5 rounded-md font-bold truncate max-w-full" title={agent.testingStandard}>
                            {agent.testingStandard}
                          </div>
                        </div>

                        <p className="text-xs text-slate-700 leading-relaxed line-clamp-2 font-medium">
                          {agent.desc}
                        </p>
                      </div>

                      {/* Action Footer Buttons */}
                      <div className="mt-4 pt-3 border-t-2 border-slate-100 space-y-2">
                        {isLocked ? (
                          <div
                            className="w-full bg-slate-200 border border-slate-300 text-slate-600 py-1.5 px-2.5 rounded-xl text-xs font-mono font-bold flex items-center justify-between gap-1"
                            title={lockStatus.reason}
                          >
                            <span className="truncate">Khoá</span>
                            <span className="text-xs bg-slate-300 text-slate-700 border border-slate-400 px-1.5 py-0.2 rounded shrink-0 truncate max-w-[110px] font-extrabold">
                              {lockStatus.reqName}
                            </span>
                          </div>
                        ) : (
                          <Link
                            href={`/projects/${projectId}/generate?agent=${type}`}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 px-3.5 rounded-xl text-xs md:text-sm font-extrabold flex items-center justify-center text-center transition-all shadow-sm"
                          >
                            <span>{hasRunBefore ? `Chạy bản mới (v${latestVersion + 1})` : 'Chạy Agent'}</span>
                          </Link>
                        )}

                        {/* Import External File Button */}
                        <button
                          type="button"
                          onClick={() => setImportingAgent(type)}
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 border-2 border-slate-300 rounded-xl py-1.5 px-2.5 text-xs font-bold transition-all"
                          title={`Tải file hoặc dán nội dung ${agent.label} ngoài để mở khoá`}
                        >
                          Import
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })()}

      {/* TAB 3 CONTENT: GENERATED QA ARTIFACTS HISTORY & MANAGEMENT */}
      {activeTab === 'artifacts' && (
        <GeneratedDocsManager
          docs={docs}
          projectId={projectId}
          projectName={project.name}
          onDeleteDoc={deleteDoc}
          onViewDoc={doc => setViewingDoc({
            title: doc.inputSummary,
            docType: doc.type,
            content: typeof doc.content === 'string' ? doc.content : JSON.stringify(doc.content, null, 2),
            version: doc.version,
            createdAt: doc.createdAt,
            docId: doc.id,
          })}
        />
      )}

      {/* Modals */}
      {showAddRaw && (
        <AddRawDocModal
          projectId={projectId}
          onClose={() => setShowAddRaw(false)}
          onSaved={newDoc => {
            setRawDocs(prev => [newDoc, ...prev])
            setShowAddRaw(false)
          }}
        />
      )}

      {showEditProject && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEditProject(false)}
          onSaved={updated => {
            setProject(updated)
            setShowEditProject(false)
          }}
        />
      )}

      {importingAgent && (
        <ImportStepDocModal
          agentType={importingAgent}
          projectId={projectId}
          onClose={() => setImportingAgent(null)}
          onSaved={newDoc => {
            setDocs(prev => [newDoc, ...prev])
            setImportingAgent(null)
          }}
        />
      )}

      {viewingDoc && (
        <div
          onClick={() => setViewingDoc(null)}
          className="fixed inset-0 bg-slate-900/65 flex items-center justify-center z-50 p-4 sm:p-6 backdrop-blur-xs cursor-pointer"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white border-2 border-indigo-400 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 cursor-default"
          >
            <DocumentViewer
              content={viewingDoc.content}
              docType={viewingDoc.docType}
              title={viewingDoc.title}
              version={viewingDoc.version}
              createdAt={viewingDoc.createdAt}
              projectId={projectId}
              docId={viewingDoc.docId}
              audioBase64={viewingDoc.audioBase64}
              figmaUrl={viewingDoc.figmaUrl}
              isEditable={true}

              onClose={() => setViewingDoc(null)}
              onSaveContent={async (newContent) => {
                if (!viewingDoc.docId) return
                if ((viewingDoc as any).isRawDoc) {
                  const res = await fetch(`/api/projects/${projectId}/raw-docs/${viewingDoc.docId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: newContent }),
                  })
                  if (res.ok) {
                    setRawDocs(prev => prev.map(d => d.id === viewingDoc.docId ? { ...d, textContent: newContent } : d))
                    setViewingDoc(prev => prev ? { ...prev, content: newContent } : null)
                  }
                } else {
                  const res = await fetch(`/api/projects/${projectId}/documents/${viewingDoc.docId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: newContent }),
                  })
                  if (res.ok) {
                    const updated = await res.json()
                    setDocs(prev => prev.map(d => d.id === updated.id ? updated : d))
                    setViewingDoc(prev => prev ? { ...prev, content: newContent } : null)
                  }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
