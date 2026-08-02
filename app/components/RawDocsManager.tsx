'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { RawDocument, RawDocType, RAW_DOC_META } from '@/lib/types'
import { exportMarkdownToHtml } from '@/lib/html-export'

interface RawDocsManagerProps {
  rawDocs: RawDocument[]
  projectId: string
  projectName: string
  onDeleteRawDoc: (id: string, name: string) => void
  onViewRawDoc: (doc: RawDocument) => void
  onAddRawDoc: () => void
}

const CATEGORY_MAP: Record<RawDocType, 'specs' | 'stories' | 'ui' | 'upload'> = {
  'brd': 'specs',
  'srs': 'specs',
  'epic': 'specs',
  'feature-request': 'specs',
  'change-request': 'specs',
  'api-spec': 'specs',
  'user-story': 'stories',
  'meeting-minutes': 'stories',
  'email-notes': 'stories',
  'wireframe': 'ui',
  'figma': 'ui',
  'upload-doc': 'upload',
}

export default function RawDocsManager({
  rawDocs,
  projectId,
  projectName,
  onDeleteRawDoc,
  onViewRawDoc,
  onAddRawDoc,
}: RawDocsManagerProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'specs' | 'stories' | 'ui' | 'upload'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  const counts = useMemo(() => {
    const res = { all: rawDocs.length, specs: 0, stories: 0, ui: 0, upload: 0 }
    rawDocs.forEach(d => {
      const cat = CATEGORY_MAP[d.type] || 'specs'
      res[cat] = (res[cat] || 0) + 1
    })
    return res
  }, [rawDocs])

  const filteredDocs = useMemo(() => {
    return rawDocs.filter(d => {
      if (activeTab !== 'all') {
        const cat = CATEGORY_MAP[d.type] || 'specs'
        if (cat !== activeTab) return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const titleMatch = d.name.toLowerCase().includes(q)
        const typeMatch = (RAW_DOC_META[d.type]?.label || d.type).toLowerCase().includes(q)
        return titleMatch || typeMatch
      }
      return true
    })
  }, [rawDocs, activeTab, searchQuery])

  function downloadWord(doc: RawDocument) {
    if (!doc.textContent) return
    const bodyHtml = exportMarkdownToHtml(doc.name, doc.textContent, projectName, doc.type, 1, doc.createdAt)
    const blob = new Blob([bodyHtml], { type: 'application/msword;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.name.replace(/\s+/g, '_')}_v1.doc`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (rawDocs.length === 0) {
    return (
      <div className="bg-white border-2 border-indigo-200 rounded-2xl p-10 text-center space-y-5 shadow-sm text-slate-900">
        <div>
          <span className="text-xs bg-indigo-100 text-indigo-900 border border-indigo-300 px-3 py-1 rounded-md font-mono font-bold uppercase tracking-wider">
            Phase 1 Baseline Ingestion
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-4">Chưa có Tài liệu Yêu cầu / Đầu vào nào</h2>
          <p className="text-sm font-medium text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
            Vui lòng upload tài liệu có sẵn (BRD, SRS, User Story, Figma) hoặc dùng Doc Builder Agent để khởi tạo đặc tả yêu cầu chuẩn cho QA.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
          <button
            onClick={onAddRawDoc}
            className="bg-white border-2 border-slate-300 hover:bg-slate-50 text-slate-800 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-xs"
          >
            + Upload / Thêm doc có sẵn
          </button>
          <Link
            href={`/projects/${projectId}/doc-builder`}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm"
          >
            Soạn doc mới với Doc Builder Agent ➔
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-indigo-50/70 border-2 border-indigo-300 border-l-8 border-l-indigo-600 rounded-2xl overflow-hidden shadow-md text-slate-900">
      {/* Top Header Banner with Soft Indigo Background Tint */}
      <div className="bg-indigo-100/90 px-6 py-5 border-b-2 border-indigo-200 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs md:text-sm bg-indigo-600 text-white px-3 py-1 rounded-md font-extrabold font-mono shadow-xs">
              PHASE 1 ➔ REQUIREMENT BASELINE
            </span>
            <h2 className="font-extrabold text-slate-900 text-xl md:text-2xl tracking-tight">Quản lý Tài liệu Yêu cầu Đầu vào</h2>
            <span className="text-xs md:text-sm bg-white text-indigo-950 border-2 border-indigo-300 px-3 py-1 rounded-full font-mono font-extrabold shadow-xs">
              {rawDocs.length} Docs
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-700 mt-1.5 font-bold leading-relaxed">
            BRD · SRS · User Story · Epic · API Spec · Wireframe · Figma · Meeting Notes — Nền tảng đặc tả nghiệp vụ cho QA
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={`/projects/${projectId}/doc-builder`}
            className="bg-indigo-600 text-white hover:bg-indigo-500 px-4 py-2 rounded-xl text-xs md:text-sm font-extrabold transition-all shadow-md"
          >
            Doc Builder Agent
          </Link>
          <button
            onClick={onAddRawDoc}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs md:text-sm font-extrabold transition-all shadow-md cursor-pointer"
          >
            + Upload / Thêm doc
          </button>
        </div>
      </div>

      {/* Category Tabs & Search Filter Bar */}
      <div className="p-4 bg-white border-b-2 border-slate-200 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs md:text-sm">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-2 border-slate-200'
              }`}
            >
              <span>Tất cả</span>
              <span className="bg-white/30 text-white text-xs px-2 py-0.5 rounded-full font-mono font-bold">{counts.all}</span>
            </button>

            <button
              onClick={() => setActiveTab('specs')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'specs'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-2 border-slate-200'
              }`}
            >
              <span>Đặc tả (BRD, SRS, API)</span>
              <span className="bg-slate-200 text-slate-800 text-xs px-2 py-0.5 rounded-full font-mono font-bold">{counts.specs}</span>
            </button>

            <button
              onClick={() => setActiveTab('stories')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'stories'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-2 border-slate-200'
              }`}
            >
              <span>Stories & Notes</span>
              <span className="bg-slate-200 text-slate-800 text-xs px-2 py-0.5 rounded-full font-mono font-bold">{counts.stories}</span>
            </button>

            <button
              onClick={() => setActiveTab('ui')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'ui'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-2 border-slate-200'
              }`}
            >
              <span>UI / UX & Figma</span>
              <span className="bg-slate-200 text-slate-800 text-xs px-2 py-0.5 rounded-full font-mono font-bold">{counts.ui}</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
                activeTab === 'upload'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-2 border-slate-200'
              }`}
            >
              <span>File Upload</span>
              <span className="bg-slate-200 text-slate-800 text-xs px-2 py-0.5 rounded-full font-mono font-bold">{counts.upload}</span>
            </button>
          </div>

          {/* Search & Layout Toggle */}
          <div className="flex items-center gap-2 text-xs md:text-sm">
            <div className="relative min-w-[220px]">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm tài liệu..."
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>

            <div className="flex items-center border-2 border-slate-300 rounded-xl overflow-hidden bg-slate-100 p-0.5 font-bold">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white font-extrabold' : 'text-slate-700 hover:text-slate-900'}`}
              >
                Card
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white font-extrabold' : 'text-slate-700 hover:text-slate-900'}`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5">
        {filteredDocs.length === 0 ? (
          <div className="py-10 text-center text-slate-600 space-y-1 font-mono text-sm">
            <p className="font-bold text-slate-800">Không tìm thấy tài liệu nào trong danh mục này</p>
            <p className="text-slate-500">Thử thay đổi từ khoá tìm kiếm hoặc chuyển sang danh mục khác.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map(doc => {
              const meta = RAW_DOC_META[doc.type] || { label: doc.type, icon: '', color: 'bg-slate-100 text-slate-800' }
              return (
                <div
                  key={doc.id}
                  className="bg-white border-2 border-indigo-200 hover:border-indigo-500 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all shadow-sm group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-900 text-sm md:text-base truncate group-hover:text-indigo-700 transition-colors" title={doc.name}>
                          {doc.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-xs bg-indigo-100 text-indigo-900 border border-indigo-200 px-2.5 py-0.5 rounded-full font-mono font-extrabold">
                            {meta.label}
                          </span>
                          {doc.figmaUrl && (
                            <span className="text-xs bg-pink-100 text-pink-800 border border-pink-300 px-2 py-0.5 rounded-full font-mono font-extrabold">
                              Figma
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteRawDoc(doc.id, doc.name)}
                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-all p-1 text-sm font-extrabold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 font-mono font-medium">
                      Cập nhật: {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t-2 border-indigo-100 flex items-center justify-between gap-2 text-xs md:text-sm">
                    <button
                      onClick={() => onViewRawDoc(doc)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg font-extrabold transition-all shadow-xs cursor-pointer"
                    >
                      Đọc / Chi tiết
                    </button>

                    <div className="flex items-center gap-2">
                      {doc.figmaUrl && (
                        <a
                          href={doc.figmaUrl}
                          target="_blank"
                          className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-2 border-slate-300 px-2.5 py-1 rounded-lg text-xs font-bold"
                        >
                          Figma
                        </a>
                      )}
                      {doc.textContent && (
                        <button
                          onClick={() => downloadWord(doc)}
                          className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-2 border-slate-300 px-2.5 py-1 rounded-lg text-xs font-bold"
                        >
                          Word
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="border-2 border-indigo-200 rounded-xl overflow-hidden divide-y-2 divide-indigo-100 bg-white shadow-xs">
            {filteredDocs.map(doc => {
              const meta = RAW_DOC_META[doc.type] || { label: doc.type, icon: '', color: 'bg-slate-100 text-slate-800' }
              return (
                <div key={doc.id} className="p-4 bg-white hover:bg-indigo-50/50 transition-colors flex items-center justify-between gap-4 group flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="font-extrabold text-slate-900 text-sm md:text-base truncate group-hover:text-indigo-700 transition-colors" title={doc.name}>
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs bg-indigo-100 text-indigo-900 border border-indigo-200 px-2.5 py-0.5 rounded-full font-mono font-extrabold">
                          {meta.label}
                        </span>
                        <span className="text-xs text-slate-600 font-mono font-medium">
                          Cập nhật: {new Date(doc.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onViewRawDoc(doc)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-extrabold transition-all shadow-xs cursor-pointer"
                    >
                      Đọc / Chi tiết
                    </button>
                    {doc.figmaUrl && (
                      <a
                        href={doc.figmaUrl}
                        target="_blank"
                        className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-2 border-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold"
                      >
                        Figma
                      </a>
                    )}

                    {doc.textContent && (
                      <button
                        onClick={() => downloadWord(doc)}
                        className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-2 border-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Word
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteRawDoc(doc.id, doc.name)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-all p-1 text-sm font-extrabold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
