'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { marked } from 'marked'
import { formatTestPlanToMarkdown, formatTestCasesToMarkdown, preprocessMarkdown, processMermaidCodeBlocks } from '@/lib/html-export'

interface DocumentViewerProps {
  content: string
  docType?: string
  title?: string
  version?: number
  createdAt?: string
  projectId?: string
  docId?: string
  audioBase64?: string
  figmaUrl?: string
  isEditable?: boolean
  onClose?: () => void
  onSaveContent?: (newContent: string) => void
}

export default function DocumentViewer({
  content,
  docType = 'DOCUMENT',
  title,
  version = 1,
  createdAt,
  projectId,
  docId,
  audioBase64,
  figmaUrl,
  isEditable = false,
  onClose,
  onSaveContent,
}: DocumentViewerProps) {

  const [activeTab, setActiveTab] = useState<'formatted' | 'raw'>('formatted')

  const normalizedContent = useMemo(() => {
    if (!content) return ''

    function unwrap(val: any): any {
      if (val === null || val === undefined) return ''
      let curr = val

      if (typeof curr === 'string') {
        const trimmed = curr.trim()
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          try {
            const parsed = JSON.parse(trimmed)
            if (parsed !== null && typeof parsed === 'object') {
              curr = parsed
            }
          } catch {}
        }
      }

      if (curr && typeof curr === 'object' && !Array.isArray(curr)) {
        if ('rawText' in curr && curr.rawText !== undefined && curr.rawText !== curr) {
          return unwrap(curr.rawText)
        }
        if ('contentMarkdown' in curr && curr.contentMarkdown !== undefined && curr.contentMarkdown !== curr) {
          return unwrap(curr.contentMarkdown)
        }
        if ('textContent' in curr && curr.textContent !== undefined && curr.textContent !== curr) {
          return unwrap(curr.textContent)
        }
      }

      return curr
    }

    const raw = unwrap(content)
    if (!raw) return ''

    const typeStr = (docType || '').toLowerCase()

    if (typeof raw === 'object') {
      if (typeStr === 'test-plan' || 'testStrategy' in raw || 'featuresToTest' in raw || 'entryExitCriteria' in raw || 'risks' in raw) {
        return formatTestPlanToMarkdown(raw)
      }
      if (
        typeStr === 'test-case' ||
        typeStr === 'test-cases' ||
        typeStr === 'test-scenario' ||
        'scenarios' in raw ||
        'testCases' in raw ||
        'cases' in raw ||
        Array.isArray(raw)
      ) {
        return formatTestCasesToMarkdown(raw)
      }
      return JSON.stringify(raw, null, 2)
    }

    if (typeof raw === 'string') {
      if (typeStr === 'test-plan') {
        return formatTestPlanToMarkdown(raw)
      }
      if (typeStr === 'test-case' || typeStr === 'test-cases' || typeStr === 'test-scenario') {
        return formatTestCasesToMarkdown(raw)
      }
      return raw
    }

    return String(raw)
  }, [content, docType])

  const [editingContent, setEditingContent] = useState(normalizedContent)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // ─── SEARCH & REPLACE STATES FOR MARKDOWN EDITOR ───────────────────────────
  const [searchTerm, setSearchTerm] = useState('')
  const [replaceTerm, setReplaceTerm] = useState('')
  const [showReplace, setShowReplace] = useState(false)
  const [matchIndices, setMatchIndices] = useState<{ start: number; end: number }[]>([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(-1)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditingContent(normalizedContent)
  }, [normalizedContent])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setMatchIndices([])
      setCurrentMatchIndex(-1)
      return
    }
    const lowerContent = editingContent.toLowerCase()
    const lowerSearch = searchTerm.toLowerCase()
    const matches: { start: number; end: number }[] = []
    let pos = 0
    while ((pos = lowerContent.indexOf(lowerSearch, pos)) !== -1) {
      matches.push({ start: pos, end: pos + lowerSearch.length })
      pos += lowerSearch.length
    }
    setMatchIndices(matches)
    if (matches.length > 0) {
      setCurrentMatchIndex(0)
      jumpToMatch(0, matches)
    } else {
      setCurrentMatchIndex(-1)
    }
  }, [searchTerm, editingContent])

  function jumpToMatch(index: number, matches = matchIndices) {
    if (!matches[index] || !textareaRef.current) return
    const { start, end } = matches[index]
    const textarea = textareaRef.current
    textarea.focus()
    textarea.setSelectionRange(start, end)
    
    // Auto scroll into view
    const lineHeight = 20
    const linesBefore = textarea.value.substring(0, start).split('\n').length
    textarea.scrollTop = Math.max(0, (linesBefore - 4) * lineHeight)
  }

  function handleNextMatch() {
    if (matchIndices.length === 0) return
    const nextIdx = (currentMatchIndex + 1) % matchIndices.length
    setCurrentMatchIndex(nextIdx)
    jumpToMatch(nextIdx)
  }

  function handlePrevMatch() {
    if (matchIndices.length === 0) return
    const prevIdx = (currentMatchIndex - 1 + matchIndices.length) % matchIndices.length
    setCurrentMatchIndex(prevIdx)
    jumpToMatch(prevIdx)
  }

  function handleReplaceSingle() {
    if (currentMatchIndex < 0 || !matchIndices[currentMatchIndex]) return
    const { start, end } = matchIndices[currentMatchIndex]
    const updated = editingContent.substring(0, start) + replaceTerm + editingContent.substring(end)
    setEditingContent(updated)
  }

  function handleReplaceAll() {
    if (!searchTerm.trim() || matchIndices.length === 0) return
    const regex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    const updated = editingContent.replace(regex, replaceTerm)
    setEditingContent(updated)
  }

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && onClose) {
        onClose()
      }
      // Ctrl+F or Cmd+F in Raw mode to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f' && activeTab === 'raw') {
        e.preventDefault()
        const searchInput = document.getElementById('md-search-input')
        if (searchInput) searchInput.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, activeTab])

  const canEdit = isEditable || Boolean(onSaveContent) || Boolean(projectId && docId)

  async function handleSave() {
    setSaving(true)
    try {
      if (onSaveContent) {
        await onSaveContent(editingContent)
      } else if (projectId && docId) {
        const res = await fetch(`/api/projects/${projectId}/documents/${docId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: editingContent }),
        })
        if (!res.ok) throw new Error('Lỗi cập nhật tài liệu')
      }
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 2500)
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!(window as any).mermaid) {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js'
      script.onload = () => {
        ;(window as any).mermaid?.initialize({ startOnLoad: true, theme: 'default' })
        ;(window as any).mermaid?.run()
      }
      document.head.appendChild(script)
    } else {
      setTimeout(() => {
        try {
          ;(window as any).mermaid?.run()
        } catch {}
      }, 100)
    }
  }, [content, editingContent, activeTab, normalizedContent])

  const parsedHtml = useMemo(() => {
    const source = activeTab === 'raw' ? editingContent : normalizedContent
    if (!source || typeof source !== 'string') return '<p class="text-slate-500 italic">Không có nội dung đặc tả</p>'
    try {
      const processed = preprocessMarkdown(source)
      const rawHtml = marked.parse(processed, { gfm: true, breaks: true }) as string
      return processMermaidCodeBlocks(rawHtml)
    } catch (err) {
      console.error('[DocumentViewer] marked parse error:', err)
      try {
        return marked.parse(source, { gfm: true, breaks: true }) as string
      } catch {
        return `<pre class="text-xs text-red-600 font-mono">${source}</pre>`
      }
    }
  }, [content, editingContent, activeTab, normalizedContent])

  function handleCopy() {
    navigator.clipboard.writeText(editingContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleDownloadHtml() {
    const isHtml = typeof editingContent === 'string' && (editingContent.trim().toLowerCase().startsWith('<!doctype html') || editingContent.trim().toLowerCase().startsWith('<html'))
    const htmlStr = isHtml ? editingContent : `<!DOCTYPE html>\n<html><head><meta charset="utf-8"><title>${title || docType}</title></head><body>${parsedHtml}</body></html>`
    const blob = new Blob([htmlStr], { type: 'text/html;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(title || docType).toLowerCase().replace(/[^a-z0-9]/g, '_')}_v${version}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleDownload() {
    const blob = new Blob([editingContent], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${docType.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleDownloadWord() {
    const wordHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>${title || docType}</title>
        <style>
          body { font-family: Calibri, Arial, sans-serif; line-height: 1.5; font-size: 11pt; color: #1e293b; }
          h1 { font-size: 18pt; color: #1f4e78; border-bottom: 2pt solid #1f4e78; padding-bottom: 4pt; }
          h2 { font-size: 14pt; color: #2e75b6; border-bottom: 1pt solid #d9d9d9; margin-top: 14pt; }
          h3 { font-size: 12pt; color: #1f4e78; }
          table { border-collapse: collapse; width: 100%; margin-top: 10pt; margin-bottom: 10pt; }
          th, td { border: 1pt solid #d9d9d9; padding: 6pt; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          pre, code { font-family: Consolas, monospace; background-color: #f4f4f4; }
        </style>
      </head>
      <body>
        <h1>${title || docType.toUpperCase()}</h1>
        <p style="color:#595959; font-size:9pt;">Version v${version} • ${createdAt ? new Date(createdAt).toLocaleString('vi-VN') : ''}</p>
        <hr/>
        ${parsedHtml}
      </body>
      </html>
    `
    const blob = new Blob(['\ufeff' + wordHtml], { type: 'application/msword;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${docType.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.doc`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleDownloadExcel() {
    const parser = new DOMParser()
    const doc = parser.parseFromString(parsedHtml, 'text/html')
    const tables = doc.querySelectorAll('table')

    let csvContent = '\ufeff'
    if (tables.length > 0) {
      tables.forEach((table, tableIdx) => {
        csvContent += `--- BẢNG ${tableIdx + 1} ---\n`
        const rows = table.querySelectorAll('tr')
        rows.forEach(row => {
          const cols = row.querySelectorAll('th, td')
          const rowData = Array.from(cols).map(c => `"${c.textContent?.trim().replace(/"/g, '""') || ''}"`).join(',')
          csvContent += rowData + '\n'
        })
        csvContent += '\n'
      })
    } else {
      const lines = editingContent.split('\n')
      lines.forEach((l: string) => {
        csvContent += `"${l.replace(/"/g, '""')}"\n`
      })
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${docType.toUpperCase()}_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handlePrint() {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title || docType}</title>
        <style>
          body { font-family: -apple-system, sans-serif; padding: 24px; color: #1e293b; line-height: 1.6; }
          h1, h2, h3 { color: #0f172a; }
          h1 { border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
          h2 { border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-top: 24px; }
          table { width: 100%; border-collapse: collapse; margin: 16px 0; }
          th, td { border: 1px solid #e2e8f0; padding: 8px 12px; text-align: left; }
          th { background: #f8fafc; }
          pre { background: #f1f5f9; padding: 12px; border-radius: 6px; overflow-x: auto; }
          code { font-family: monospace; background: #f1f5f9; padding: 2px 4px; border-radius: 4px; }
          .alert-box { padding: 12px; border-radius: 6px; margin: 12px 0; border-left: 4px solid #4f46e5; background: #f8fafc; }
        </style>
      </head>
      <body>
        <h1>${title || docType.toUpperCase()}</h1>
        <div style="margin-bottom: 24px; color: #64748b; font-size: 14px;">
          Version v${version} • ${createdAt ? new Date(createdAt).toLocaleString('vi-VN') : ''}
        </div>
        ${parsedHtml}
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  const [showExportMenu, setShowExportMenu] = useState(false)

  return (
    <div className="bg-white w-full h-full flex flex-col overflow-hidden text-slate-900">
      {/* Action Bar Header */}
      <div className="bg-slate-100 border-b-2 border-slate-300 px-4 py-3 flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div className="flex items-center gap-3">
          {/* Tab Switcher */}
          <div className="bg-white p-1 rounded-xl border-2 border-slate-300 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('formatted')}
              className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-extrabold transition-all flex items-center gap-1.5 ${
                activeTab === 'formatted'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Xem HTML Formatted
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('raw')}
              className={`px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-extrabold transition-all flex items-center gap-1.5 ${
                activeTab === 'raw'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {canEdit ? 'Chỉnh sửa Markdown' : 'Xem Raw Markdown'}
            </button>
          </div>

          <span className="text-xs bg-indigo-100 text-indigo-900 border border-indigo-300 px-3 py-1 rounded-full font-mono font-extrabold">
            {docType.toUpperCase()}
          </span>
          {version && (
            <span className="text-xs bg-white text-slate-800 border border-slate-300 px-2.5 py-0.5 rounded font-mono font-extrabold">
              v{version}
            </span>
          )}
        </div>

        {/* Streamlined Action Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs md:text-sm">
          {/* Clean Export Dropdown Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-xl font-extrabold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>Export</span>
              <span className="text-[10px]">▾</span>
            </button>

            {showExportMenu && (
              <div
                className="absolute right-0 mt-2 w-48 bg-white border-2 border-slate-300 rounded-xl shadow-xl z-50 p-1 space-y-0.5 text-xs font-bold"
                onClick={() => setShowExportMenu(false)}
              >
                <button
                  type="button"
                  onClick={handleDownloadHtml}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-lg text-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  HTML File (.html)
                </button>
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-lg text-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  CSV / Excel (.csv)
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-lg text-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  Markdown (.md)
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full text-left px-3 py-2 hover:bg-slate-100 rounded-lg text-slate-800 flex items-center gap-2 border-t border-slate-100 mt-1 pt-1 cursor-pointer"
                >
                  In / Xuất PDF
                </button>
              </div>
            )}
          </div>

          {projectId && docId && (
            <a
              href={`/api/projects/${projectId}/documents/${docId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-indigo-600 text-white hover:bg-indigo-500 px-3.5 py-1.5 rounded-xl font-extrabold transition-all shadow-xs"
            >
              <span>Mở HTML đầy đủ</span>
            </a>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="bg-slate-200 hover:bg-slate-300 text-slate-800 border border-slate-300 px-4 py-1.5 rounded-xl font-bold transition-all ml-1"
              title="Đóng popup (Esc)"
            >
              Đóng
            </button>
          )}
        </div>
      </div>

      {/* Main Display Area (Edge to Edge Full Viewport) */}
      <div className="flex-1 w-full h-full flex flex-col overflow-hidden bg-slate-900">
        {audioBase64 && (
          <div className="bg-teal-50 border-b border-teal-200 p-3 flex items-center justify-between flex-wrap gap-3 shadow-xs shrink-0">
            <div className="flex items-center gap-2 text-teal-900 font-mono font-semibold text-xs md:text-sm">
              <span>Ghi âm cuộc họp gốc (Audio Record):</span>
            </div>
            <audio controls src={audioBase64} className="h-9 rounded-lg max-w-full" />
          </div>
        )}

        {(figmaUrl || docType === 'figma' || docType === 'wireframe') && (
          <div className="bg-pink-50 border-b border-pink-200 p-3 flex items-center justify-between flex-wrap gap-3 shadow-xs shrink-0">
            <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-pink-950">
              <span>Thiết kế Figma (UI/UX Design File):</span>
            </div>
            {figmaUrl ? (
              <a
                href={figmaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-pink-600 hover:bg-pink-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span>Mở File Thiết kế Figma</span>
              </a>
            ) : (
              <span className="text-xs text-pink-700 font-medium italic">Chưa gắn URL Figma</span>
            )}
          </div>
        )}

        {activeTab === 'formatted' ? (
          typeof normalizedContent === 'string' && (normalizedContent.trim().toLowerCase().startsWith('<!doctype html') || normalizedContent.trim().toLowerCase().startsWith('<html')) ? (
            <iframe
              srcDoc={normalizedContent}
              className="w-full h-full flex-1 border-0"
              title={title || 'HTML Document'}
            />
          ) : (
            <div className="bg-slate-50 flex-1 h-full overflow-y-auto p-6 sm:p-10">
              <article
                className="doc-rendered-html max-w-5xl mx-auto text-slate-900 text-sm leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: parsedHtml }}
              />
            </div>
          )
        ) : (
          <div className="flex-1 flex flex-col space-y-3 h-full p-4 bg-slate-50 overflow-hidden">
            {/* Header info & Save Button */}
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs font-medium text-amber-900 flex-wrap gap-2 shrink-0">
              <span className="flex items-center gap-1.5 font-semibold">
                <span>Chế độ <b>Chỉnh sửa Markdown</b>. Có thể tìm từ khóa (Ctrl+F), chỉnh sửa và bấm <b>"Lưu thay đổi"</b>.</span>
              </span>
              {canEdit && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg font-bold transition-all shadow-xs disabled:opacity-50 text-xs cursor-pointer"
                >
                  {saving ? 'Đang lưu...' : savedSuccess ? 'Đã lưu thành công!' : 'Lưu thay đổi'}
                </button>
              )}
            </div>

            {/* Keyword Search & Replace Toolbar */}
            <div className="bg-slate-100 border-2 border-slate-300 rounded-xl p-2.5 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                <div className="relative min-w-[240px] flex-1 max-w-md">
                  <input
                    id="md-search-input"
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (e.shiftKey) handlePrevMatch()
                        else handleNextMatch()
                      }
                    }}
                    placeholder="Tìm từ khóa trong Markdown (Enter: Xuống, Shift+Enter: Lên)..."
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMatch}
                    disabled={matchIndices.length === 0}
                    className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 px-2.5 py-1.5 rounded-lg font-bold transition-all disabled:opacity-40"
                    title="Kết quả trước (Shift+Enter)"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMatch}
                    disabled={matchIndices.length === 0}
                    className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 px-2.5 py-1.5 rounded-lg font-bold transition-all disabled:opacity-40"
                    title="Kết quả tiếp theo (Enter)"
                  >
                    ▼
                  </button>
                </div>

                <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold ${
                  searchTerm.trim()
                    ? matchIndices.length > 0
                      ? 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                      : 'bg-rose-100 text-rose-900 border border-rose-200'
                    : 'text-slate-500'
                }`}>
                  {searchTerm.trim()
                    ? matchIndices.length > 0
                      ? `${currentMatchIndex + 1} / ${matchIndices.length} kết quả`
                      : 'Không tìm thấy'
                    : 'Nhập từ khóa để tìm'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowReplace(!showReplace)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all border ${
                    showReplace ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  Thay thế
                </button>
              </div>
            </div>

            {/* Expandable Replace Bar */}
            {showReplace && (
              <div className="bg-slate-50 border-2 border-indigo-200 rounded-xl p-2.5 flex items-center gap-2 flex-wrap text-xs animate-in fade-in duration-150">
                <input
                  type="text"
                  value={replaceTerm}
                  onChange={e => setReplaceTerm(e.target.value)}
                  placeholder="Nội dung thay thế..."
                  className="bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold min-w-[220px] flex-1 max-w-sm"
                />
                <button
                  type="button"
                  onClick={handleReplaceSingle}
                  disabled={matchIndices.length === 0 || currentMatchIndex < 0}
                  className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 px-3 py-1.5 rounded-lg font-bold transition-all disabled:opacity-40 cursor-pointer"
                >
                  Thay thế ô này
                </button>
                <button
                  type="button"
                  onClick={handleReplaceAll}
                  disabled={matchIndices.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg font-bold transition-all disabled:opacity-40 cursor-pointer"
                >
                  Thay thế tất cả ({matchIndices.length})
                </button>
              </div>
            )}

            {/* Markdown Textarea */}
            <textarea
              ref={textareaRef}
              value={editingContent}
              onChange={e => {
                setEditingContent(e.target.value)
              }}
              readOnly={!canEdit}
              className="flex-1 w-full min-h-[66vh] bg-slate-50 border-2 border-slate-300 rounded-xl p-4 font-mono text-xs text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-amber-500 resize-y"
              placeholder="Nội dung Markdown..."
            />
          </div>
        )}
      </div>

      {/* Custom Styles for Formatted Markdown HTML rendering inside Light Theme */}
      <style jsx global>{`
        .doc-rendered-html h1 {
          font-size: 1.5rem;
          font-weight: 800;
          color: #0f172a;
          margin-top: 1.75rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e2e8f0;
        }
        .doc-rendered-html h1:first-child {
          margin-top: 0;
        }
        .doc-rendered-html h2 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          margin-top: 1.5rem;
          margin-bottom: 0.75rem;
          padding-bottom: 0.35rem;
          border-bottom: 1px solid #e2e8f0;
        }
        .doc-rendered-html h3 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #4f46e5;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
        }
        .doc-rendered-html h4 {
          font-size: 0.95rem;
          font-weight: 600;
          color: #475569;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
        }
        .doc-rendered-html p {
          margin-bottom: 0.85rem;
          color: #334155;
          line-height: 1.7;
        }
        .doc-rendered-html ul,
        .doc-rendered-html ol {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
          color: #334155;
        }
        .doc-rendered-html ul {
          list-style-type: disc;
        }
        .doc-rendered-html ol {
          list-style-type: decimal;
        }
        .doc-rendered-html li {
          margin-bottom: 0.35rem;
          line-height: 1.6;
        }
        .doc-rendered-html hr {
          border: 0;
          height: 1px;
          background: #e2e8f0;
          margin: 1.5rem 0;
        }
        .doc-rendered-html blockquote {
          border-left: 4px solid #4f46e5;
          background: #f1f5f9;
          padding: 0.75rem 1rem;
          margin: 1rem 0;
          border-radius: 0 0.5rem 0.5rem 0;
          color: #475569;
          font-style: italic;
        }
        .doc-rendered-html code {
          background: #f1f5f9;
          color: #4338ca;
          padding: 0.2rem 0.4rem;
          border-radius: 0.375rem;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-size: 0.85em;
          border: 1px solid #e2e8f0;
        }
        .doc-rendered-html pre {
          background: #f8fafc;
          color: #0f172a;
          padding: 1rem;
          border-radius: 0.75rem;
          overflow-x: auto;
          margin: 1rem 0;
          border: 1px solid #e2e8f0;
        }
        .doc-rendered-html pre code {
          background: transparent;
          color: inherit;
          padding: 0;
          border: none;
          font-size: 0.85rem;
        }
        .doc-rendered-html table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.25rem 0;
          border-radius: 0.5rem;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          font-size: 0.875rem;
        }
        .doc-rendered-html th {
          background: #f1f5f9;
          color: #0f172a;
          font-weight: 700;
          padding: 0.65rem 0.85rem;
          text-align: left;
          border-bottom: 2px solid #e2e8f0;
          border-right: 1px solid #e2e8f0;
        }
        .doc-rendered-html th:last-child {
          border-right: none;
        }
        .doc-rendered-html td {
          padding: 0.65rem 0.85rem;
          border-bottom: 1px solid #e2e8f0;
          border-right: 1px solid #e2e8f0;
          color: #334155;
          vertical-align: top;
        }
        .doc-rendered-html td:last-child {
          border-right: none;
        }
        .doc-rendered-html tr:last-child td {
          border-bottom: none;
        }
        .doc-rendered-html tr:nth-child(even) td {
          background: #f8fafc;
        }
        .doc-rendered-html tr:hover td {
          background: #f1f5f9;
        }
        .doc-rendered-html .alert-box {
          padding: 0.75rem 1rem;
          border-radius: 0.5rem;
          margin: 1rem 0;
          font-size: 0.875rem;
          border-left: 4px solid;
        }
        .doc-rendered-html .alert-note {
          background: #eff6ff;
          border-color: #3b82f6;
          color: #1e40af;
        }
        .doc-rendered-html .alert-warning {
          background: #fffbeb;
          border-color: #f59e0b;
          color: #92400e;
        }
        .doc-rendered-html .alert-important {
          background: #faf5ff;
          border-color: #a855f7;
          color: #6b21a8;
        }
        .doc-rendered-html .alert-tip {
          background: #f0fdf4;
          border-color: #22c55e;
          color: #166534;
        }
        .doc-rendered-html .alert-caution {
          background: #fef2f2;
          border-color: #ef4444;
          color: #991b1b;
        }
        .doc-rendered-html .gherkin-tag {
          display: inline-block;
          background-color: #e0e7ff;
          color: #3730a3;
          border: 1px solid #c7d2fe;
          font-family: ui-monospace, monospace;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
          margin-right: 4px;
          margin-bottom: 4px;
        }
        .doc-rendered-html .gherkin-scenario-header {
          font-size: 1.05rem;
          font-weight: 800;
          color: #0f172a;
          background: #f8fafc;
          border-left: 4px solid #4f46e5;
          padding: 10px 14px;
          border-radius: 6px;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
        }
        .doc-rendered-html .gherkin-step {
          padding: 4px 0 4px 16px;
          color: #334155;
          font-size: 0.9rem;
          line-height: 1.6;
        }
        .doc-rendered-html .gherkin-kw {
          font-weight: 800;
          font-family: ui-monospace, monospace;
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 0.82rem;
          margin-right: 6px;
          display: inline-block;
        }
        .doc-rendered-html .gherkin-scenario { background: #e0e7ff; color: #3730a3; }
        .doc-rendered-html .gherkin-given { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
        .doc-rendered-html .gherkin-when { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .doc-rendered-html .gherkin-then { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .doc-rendered-html .gherkin-and { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }
      `}</style>
    </div>
  )
}
