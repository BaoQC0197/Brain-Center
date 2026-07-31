'use client'

import { useState, useMemo } from 'react'
import { GeneratedDocument } from '@/lib/types'
import { exportMarkdownToHtml, exportTestCasesToCsv } from '@/lib/html-export'

const DOC_TYPE_META: Record<string, { label: string; icon: string; badgeColor: string; category: 'req_ac' | 'strategy_plan' | 'test_cases' | 'reports' }> = {
  'review-requirement': { label: 'Review Requirement', icon: '', badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300', category: 'req_ac' },
  'acceptance-criteria': { label: 'Acceptance Criteria', icon: '', badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-300', category: 'req_ac' },
  'test-strategy': { label: 'Test Strategy', icon: '', badgeColor: 'bg-purple-100 text-purple-900 border border-purple-300', category: 'strategy_plan' },
  'test-plan': { label: 'Master Test Plan', icon: '', badgeColor: 'bg-blue-100 text-blue-900 border border-blue-300', category: 'strategy_plan' },
  'test-scenario': { label: 'Test Scenarios', icon: '', badgeColor: 'bg-indigo-100 text-indigo-900 border border-indigo-300', category: 'test_cases' },
  'test-cases': { label: 'Test Cases', icon: '', badgeColor: 'bg-cyan-100 text-cyan-900 border border-cyan-300', category: 'test_cases' },
  'regression-checklist': { label: 'Regression Checklist', icon: '', badgeColor: 'bg-rose-100 text-rose-900 border border-rose-300', category: 'test_cases' },
  'test-report': { label: 'Test Summary Report', icon: '', badgeColor: 'bg-teal-100 text-teal-900 border border-teal-300', category: 'reports' },
  'srs': { label: 'SRS Specification', icon: '', badgeColor: 'bg-blue-100 text-blue-900 border border-blue-300', category: 'reports' },
  'brd': { label: 'BRD Document', icon: '', badgeColor: 'bg-purple-100 text-purple-900 border border-purple-300', category: 'reports' },
  'user-story': { label: 'User Stories', icon: '', badgeColor: 'bg-emerald-100 text-emerald-900 border border-emerald-300', category: 'reports' },
}

interface GeneratedDocsManagerProps {
  docs: GeneratedDocument[]
  projectId: string
  projectName: string
  onDeleteDoc: (id: string) => void
  onViewDoc: (doc: GeneratedDocument) => void
}

interface GroupedDocStream {
  groupKey: string
  type: string
  title: string
  latestDoc: GeneratedDocument
  versions: GeneratedDocument[]
}

export default function GeneratedDocsManager({
  docs,
  projectId,
  projectName,
  onDeleteDoc,
  onViewDoc,
}: GeneratedDocsManagerProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'req_ac' | 'strategy_plan' | 'test_cases' | 'reports'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest')

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [selectedVersionMap, setSelectedVersionMap] = useState<Record<string, string>>({})

  const groupedStreams = useMemo(() => {
    const groups: Record<string, GeneratedDocument[]> = {}

    docs.forEach(d => {
      const key = d.type
      if (!groups[key]) groups[key] = []
      groups[key].push(d)
    })

    const streams: GroupedDocStream[] = Object.entries(groups).map(([typeKey, versionList]) => {
      const sorted = [...versionList].sort((a, b) => {
        const vDiff = (b.version || 1) - (a.version || 1)
        if (vDiff !== 0) return vDiff
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
      const latest = sorted[0]
      const meta = DOC_TYPE_META[typeKey]
      return {
        groupKey: typeKey,
        type: typeKey,
        title: latest.inputSummary || meta?.label || typeKey,
        latestDoc: latest,
        versions: sorted,
      }
    })

    return streams
  }, [docs])

  const counts = useMemo(() => {
    const res = { all: docs.length, req_ac: 0, strategy_plan: 0, test_cases: 0, reports: 0, totalTestCasesCount: 0 }
    docs.forEach(d => {
      const cat = DOC_TYPE_META[d.type]?.category || 'reports'
      res[cat] = (res[cat] || 0) + 1
      if (d.type === 'test-cases' && Array.isArray(d.content)) {
        res.totalTestCasesCount += d.content.length
      }
    })
    return res
  }, [docs])

  const filteredStreams = useMemo(() => {
    let result = groupedStreams.filter(stream => {
      if (activeTab !== 'all') {
        const cat = DOC_TYPE_META[stream.type]?.category || 'reports'
        if (cat !== activeTab) return false
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const titleMatch = stream.title.toLowerCase().includes(query)
        const typeMatch = (DOC_TYPE_META[stream.type]?.label || stream.type).toLowerCase().includes(query)
        return titleMatch || typeMatch
      }
      return true
    })

    result.sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.latestDoc.createdAt).getTime() - new Date(b.latestDoc.createdAt).getTime()
      }
      if (sortBy === 'name') {
        return a.title.localeCompare(b.title)
      }
      return new Date(b.latestDoc.createdAt).getTime() - new Date(a.latestDoc.createdAt).getTime()
    })

    return result
  }, [groupedStreams, activeTab, searchQuery, sortBy])

  function downloadWord(doc: GeneratedDocument) {
    let bodyHtml = ''
    if (typeof doc.content === 'string') {
      bodyHtml = exportMarkdownToHtml(doc.inputSummary, doc.content, projectName, doc.type, doc.version, doc.createdAt)
    } else {
      bodyHtml = `<pre>${JSON.stringify(doc.content, null, 2)}</pre>`
    }
    const blob = new Blob([bodyHtml], { type: 'application/msword;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.type.toUpperCase()}_v${doc.version}_${new Date().toISOString().slice(0, 10)}.doc`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadCsv(doc: GeneratedDocument) {
    if (doc.type === 'test-cases' && Array.isArray(doc.content)) {
      const csv = exportTestCasesToCsv(doc.content)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `TestCases_v${doc.version}_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  if (docs.length === 0) {
    return (
      <div className="bg-indigo-50/80 border-2 border-indigo-400 border-l-8 border-l-indigo-600 rounded-2xl p-8 text-center space-y-2 shadow-md">
        <h3 className="font-extrabold text-slate-900 text-lg md:text-xl">Chưa có Tài liệu / Artifact QA nào được sinh ở Phase 2</h3>
        <p className="text-sm font-semibold text-slate-700 max-w-md mx-auto">
          Hãy chọn 1 trong 8 QA Agents ở bảng trên để sinh Review Requirement, Acceptance Criteria, Test Strategy, hoặc Test Cases chuyên nghiệp.
        </p>
      </div>
    )
  }

  return (

    <div className="bg-white border-2 border-indigo-300 rounded-2xl overflow-hidden shadow-md text-slate-900 space-y-0">
      {/* Header Summary Banner */}
      <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-white p-5 border-b-2 border-indigo-200 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-indigo-600 text-white px-2.5 py-0.5 rounded font-mono font-extrabold shadow-xs uppercase">
              Phase 2 ➔ QA Artifacts
            </span>
            <h3 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">
              Quản lý Tài liệu QA & Lịch sử Phiên bản
            </h3>
            <span className="text-xs bg-purple-100 text-purple-900 border border-purple-300 px-2.5 py-0.5 rounded-full font-mono font-extrabold">
              {groupedStreams.length} Luồng ({docs.length} Versions)
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1 font-bold">
            Đã tự động gom nhóm theo Loại tài liệu & Quản lý lịch sử phiên bản
          </p>
        </div>

        {counts.totalTestCasesCount > 0 && (
          <div className="bg-emerald-50 border border-emerald-300 px-3.5 py-1.5 rounded-xl text-xs text-emerald-900 font-mono font-bold flex items-center gap-2 shadow-2xs">
            <span>Total Generated:</span>
            <strong className="text-emerald-800 font-extrabold text-base">{counts.totalTestCasesCount} Test Cases</strong>
          </div>
        )}
      </div>

      {/* Category Tabs & Search Filter Bar */}
      <div className="p-4 bg-white border-b-2 border-indigo-200 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs md:text-sm">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-2 rounded-xl font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-2 border-slate-200'
                }`}
            >
              <span>Tất cả</span>
              <span className="bg-white/30 text-white text-xs px-2 py-0.5 rounded-full font-mono font-bold">{groupedStreams.length}</span>
            </button>

            <button
              onClick={() => setActiveTab('req_ac')}
              className={`px-3.5 py-2 rounded-xl font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'req_ac'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-2 border-slate-200'
                }`}
            >
              <span>Yêu cầu & AC</span>
              <span className="bg-slate-200 text-slate-800 text-xs px-2 py-0.5 rounded-full font-mono font-bold">{counts.req_ac}</span>
            </button>

            <button
              onClick={() => setActiveTab('strategy_plan')}
              className={`px-3.5 py-2 rounded-xl font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'strategy_plan'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-2 border-slate-200'
                }`}
            >
              <span>Chiến lược & Kế hoạch</span>
              <span className="bg-slate-200 text-slate-800 text-xs px-2 py-0.5 rounded-full font-mono font-bold">{counts.strategy_plan}</span>
            </button>

            <button
              onClick={() => setActiveTab('test_cases')}
              className={`px-3.5 py-2 rounded-xl font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'test_cases'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-2 border-slate-200'
                }`}
            >
              <span>Kịch bản & Test Cases</span>
              <span className="bg-slate-200 text-slate-800 text-xs px-2 py-0.5 rounded-full font-mono font-bold">{counts.test_cases}</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3.5 py-2 rounded-xl font-extrabold transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'reports'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:text-slate-900 border-2 border-slate-200'
                }`}
            >
              <span>Báo cáo & Đánh giá</span>
              <span className="bg-slate-200 text-slate-800 text-xs px-2 py-0.5 rounded-full font-mono font-bold">{counts.reports}</span>
            </button>
          </div>

          {/* Search, Sort & View Mode Controls */}
          <div className="flex items-center gap-2 text-xs md:text-sm flex-wrap">
            <div className="relative min-w-[200px]">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm tài liệu..."
                className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              />
            </div>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-100 border-2 border-slate-300 text-slate-800 text-xs md:text-sm rounded-xl px-3 py-2 focus:outline-none cursor-pointer font-bold"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="name">Tên A-Z</option>
            </select>

            {/* View Mode Toggle Switcher */}
            <div className="bg-slate-100 border-2 border-slate-300 p-0.5 rounded-xl flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                  viewMode === 'table' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                📋 Bảng
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                  viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-700 hover:text-slate-900'
                }`}
              >
                🎴 Cards
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area (Table or Grid View) */}
      <div className="p-5">
        {filteredStreams.length === 0 ? (
          <div className="py-8 text-center text-slate-600 space-y-1 font-mono text-sm">
            <p className="font-bold text-slate-800">Không tìm thấy tài liệu nào trong danh mục này</p>
            <p className="text-slate-500">Thử thay đổi từ khoá tìm kiếm hoặc chọn danh mục khác.</p>
          </div>
        ) : viewMode === 'table' ? (
          /* DEFAULT COMPACT TABLE VIEW */
          <div className="bg-white border-2 border-indigo-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead className="bg-slate-100/80 border-b-2 border-slate-200 text-slate-700 uppercase font-mono font-extrabold">
                  <tr>
                    <th className="p-3 pl-4">Tài liệu & Đặc tả QA</th>
                    <th className="p-3">Phiên bản</th>
                    <th className="p-3">Cập nhật</th>
                    <th className="p-3 text-right pr-4">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-bold text-slate-800">
                  {filteredStreams.map(stream => {
                    const meta = DOC_TYPE_META[stream.type] || { label: stream.type, badgeColor: 'bg-slate-100 text-slate-800' }
                    const activeDocId = selectedVersionMap[stream.groupKey] || stream.latestDoc.id
                    const activeDoc = stream.versions.find(v => v.id === activeDocId) || stream.latestDoc
                    const isTestCaseDoc = activeDoc.type === 'test-cases' && Array.isArray(activeDoc.content)
                    const hasMultipleVersions = stream.versions.length > 1

                    return (
                      <tr key={stream.groupKey} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 pl-4">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className={`text-[11px] px-2.5 py-0.5 rounded font-mono font-extrabold border ${meta.badgeColor}`}>
                              {meta.label}
                            </span>
                            <span className="font-extrabold text-slate-900 truncate max-w-xs md:max-w-md">
                              {activeDoc.inputSummary || stream.title}
                            </span>
                            {isTestCaseDoc && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-mono font-bold">
                                {activeDoc.content.length} Cases
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3">
                          {hasMultipleVersions ? (
                            <select
                              value={activeDoc.id}
                              onChange={e => setSelectedVersionMap(prev => ({ ...prev, [stream.groupKey]: e.target.value }))}
                              className="bg-slate-100 border border-slate-300 text-indigo-900 text-xs rounded-lg px-2 py-1 font-mono font-bold focus:outline-none cursor-pointer"
                            >
                              {stream.versions.map((vDoc, idx) => (
                                <option key={vDoc.id} value={vDoc.id}>
                                  v{vDoc.version || (stream.versions.length - idx)} {idx === 0 ? '(Active)' : ''}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                              v{activeDoc.version || 1}
                            </span>
                          )}
                        </td>

                        <td className="p-3 text-slate-500 font-mono text-xs font-semibold">
                          {new Date(activeDoc.createdAt).toLocaleDateString('vi-VN')}
                        </td>

                        <td className="p-3 text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => onViewDoc(activeDoc)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all shadow-2xs"
                            >
                              👁️ Xem (v{activeDoc.version || 1})
                            </button>

                            <button
                              type="button"
                              onClick={() => downloadWord(activeDoc)}
                              className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all"
                              title="Tải Word (.doc)"
                            >
                              📄 Word
                            </button>

                            {isTestCaseDoc && (
                              <button
                                type="button"
                                onClick={() => downloadCsv(activeDoc)}
                                className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all"
                                title="Tải Excel (.csv)"
                              >
                                📊 CSV
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => onDeleteDoc(activeDoc.id)}
                              className="text-slate-400 hover:text-red-600 transition-colors p-1 text-xs font-extrabold ml-1"
                              title="Xoá phiên bản này"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ALTERNATIVE GRID CARDS VIEW */
          <div className="grid md:grid-cols-2 gap-4">
            {filteredStreams.map(stream => {
              const meta = DOC_TYPE_META[stream.type] || {
                label: stream.type,
                icon: '',
                badgeColor: 'bg-slate-100 text-slate-800 border-2 border-slate-300',
                category: 'reports',
              }

              const activeDocId = selectedVersionMap[stream.groupKey] || stream.latestDoc.id
              const activeDoc = stream.versions.find(v => v.id === activeDocId) || stream.latestDoc
              const isTestCaseDoc = activeDoc.type === 'test-cases' && Array.isArray(activeDoc.content)
              const hasMultipleVersions = stream.versions.length > 1

              return (
                <div
                  key={stream.groupKey}
                  className="bg-white border-2 border-indigo-200 hover:border-indigo-500 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-all shadow-2xs group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-slate-900 text-sm md:text-base truncate group-hover:text-indigo-600 transition-colors" title={activeDoc.inputSummary || stream.title}>
                          {activeDoc.inputSummary || stream.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-xs px-2.5 py-0.5 rounded font-mono font-extrabold border ${meta.badgeColor}`}>
                            {meta.label}
                          </span>
                          <span className="text-xs bg-indigo-100 text-indigo-900 border border-indigo-300 px-2.5 py-0.5 rounded font-mono font-extrabold">
                            {stream.versions.length} {stream.versions.length > 1 ? 'Versions' : 'Version'}
                          </span>
                          {isTestCaseDoc && (
                            <span className="text-xs bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded font-mono font-extrabold">
                              {activeDoc.content.length} Test Cases
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => onDeleteDoc(activeDoc.id)}
                        className="text-slate-400 hover:text-red-600 transition-all p-1 text-xs font-extrabold"
                        title={`Xoá phiên bản v${activeDoc.version || 1}`}
                      >
                        🗑️
                      </button>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-700 font-bold">
                        Lịch sử:
                      </span>
                      {hasMultipleVersions ? (
                        <select
                          value={activeDoc.id}
                          onChange={e => setSelectedVersionMap(prev => ({ ...prev, [stream.groupKey]: e.target.value }))}
                          className="bg-white border border-slate-300 text-indigo-900 text-xs rounded px-2 py-0.5 font-bold focus:outline-none cursor-pointer"
                        >
                          {stream.versions.map((vDoc, idx) => (
                            <option key={vDoc.id} value={vDoc.id}>
                              v{vDoc.version || (stream.versions.length - idx)} {idx === 0 ? '(Active)' : ''}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-emerald-800 font-bold">v{activeDoc.version || 1} (Single)</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-indigo-100 flex items-center justify-between gap-2 text-xs">
                    <button
                      onClick={() => onViewDoc(activeDoc)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-lg font-extrabold transition-all shadow-2xs"
                    >
                      👁️ Xem (v{activeDoc.version || 1})
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => downloadWord(activeDoc)}
                        className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 px-2.5 py-1.5 rounded-lg font-bold transition-all"
                      >
                        📄 Word
                      </button>

                      {isTestCaseDoc && (
                        <button
                          onClick={() => downloadCsv(activeDoc)}
                          className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 px-2.5 py-1.5 rounded-lg font-bold transition-all"
                        >
                          📊 CSV
                        </button>
                      )}
                    </div>
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
