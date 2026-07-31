'use client'

import { useEffect, useState } from 'react'
import { Project } from '@/lib/types'
import { ProjectSkeletonGrid } from '@/app/components/Skeletons'
import Link from 'next/link'

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
  const [stagingAdminUrl, setStagingAdminUrl] = useState(project.stagingAdminUrl || '')
  const [prodUrl, setProdUrl] = useState(project.prodUrl || '')
  const [prodAdminUrl, setProdAdminUrl] = useState(project.prodAdminUrl || '')
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
          stagingAdminUrl: stagingAdminUrl.trim(),
          prodUrl: prodUrl.trim(),
          prodAdminUrl: prodAdminUrl.trim(),
          bugListUrl: bugListUrl.trim(),
          figmaUrl: figmaUrl.trim(),
          createdAt: project.createdAt,
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
      <div className="bg-white border-2 border-indigo-400 rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-3xl space-y-6 text-slate-900">
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
          <h2 className="font-extrabold text-xl md:text-2xl text-slate-900">
            Chỉnh sửa Dự án
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg font-extrabold p-1">✕</button>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm md:text-base font-extrabold text-slate-900 mb-1.5">Tên dự án *</label>
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
          <div className="space-y-3 bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl">
            <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider font-mono">🌐 DOMAINS, FIGMA & BUG TRACKING LINKS</h4>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-extrabold text-slate-900 mb-1 truncate">🟡 STG Web</label>
                <input
                  value={stagingUrl}
                  onChange={e => setStagingUrl(e.target.value)}
                  placeholder="https://staging.app.com"
                  className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-900 mb-1 truncate">🟧 STG Admin</label>
                <input
                  value={stagingAdminUrl}
                  onChange={e => setStagingAdminUrl(e.target.value)}
                  placeholder="https://staging-admin.app.com"
                  className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-900 mb-1 truncate">🟢 PROD Web</label>
                <input
                  value={prodUrl}
                  onChange={e => setProdUrl(e.target.value)}
                  placeholder="https://app.com"
                  className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-900 mb-1 truncate">🔷 PROD Admin</label>
                <input
                  value={prodAdminUrl}
                  onChange={e => setProdAdminUrl(e.target.value)}
                  placeholder="https://admin.app.com"
                  className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-900 mb-1 truncate">🎨 Figma Link</label>
                <input
                  value={figmaUrl}
                  onChange={e => setFigmaUrl(e.target.value)}
                  placeholder="https://www.figma.com/file/..."
                  className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-900 mb-1 truncate">🔴 Bug List</label>
                <input
                  value={bugListUrl}
                  onChange={e => setBugListUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/..."
                  className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
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

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [form, setForm] = useState({ name: '', description: '', techStack: '', stagingUrl: '', stagingAdminUrl: '', prodUrl: '', prodAdminUrl: '', bugListUrl: '', figmaUrl: '' })
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name-asc' | 'name-desc'>('newest')

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then(data => { setProjects(data); setLoading(false) })
  }, [])

  async function createProject(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const project = await res.json()
    setProjects(prev => [project, ...prev])
    setForm({ name: '', description: '', techStack: '', stagingUrl: '', stagingAdminUrl: '', prodUrl: '', prodAdminUrl: '', bugListUrl: '', figmaUrl: '' })
    setShowForm(false)
    setSaving(false)
  }

  const filteredProjects = projects
    .filter(p => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name, 'vi')
      if (sortBy === 'name-desc') return b.name.localeCompare(a.name, 'vi')
      return 0
    })

  return (
    <div className="space-y-8 w-full pb-12">
      {/* Hero Header Banner */}
      <div className="bg-gradient-to-r from-indigo-100 via-sky-50 to-purple-100 border-2 border-indigo-400 rounded-2xl p-6 md:p-8 shadow-xl text-slate-900">
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm bg-indigo-600 text-white border border-indigo-700 px-3.5 py-1 rounded-md font-mono font-extrabold tracking-wide shadow-xs">
                QA-BRAIN AGENT PLATFORM v2.0
              </span>
              <span className="text-xs md:text-sm bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-md font-extrabold">
                ISTQB Certified Pipeline
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
              Quản lý Dự án & Hệ thống AI Agent Kiểm thử
            </h1>
            <p className="text-slate-700 text-xs md:text-sm font-semibold leading-relaxed">
              Trợ lý AI Kiểm thử Toàn diện: Tiếp nhận & Chuẩn hoá Yêu cầu (Phase 1) ➔ Vận hành 4 Step Chuyên biệt tinh gọn theo tiêu chuẩn ISTQB & IEEE 829 Sinh Chiến lược, Kế hoạch, Kịch bản & Test Cases (Phase 2) ➔ Quản lý lưu trữ Version & Xuất Báo cáo Release (.doc/.csv/.html).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setShowForm(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3.5 rounded-xl text-xs md:text-sm font-extrabold transition-all flex items-center gap-2 shadow-lg"
            >
              <span>+</span> Thêm dự án
            </button>
          </div>
        </div>
      </div>

      {/* Search & Stats Control Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white border-2 border-slate-300 p-4 rounded-2xl shadow-md">
        <div className="flex items-center gap-3 flex-1 min-w-[280px] max-w-2xl flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm dự án theo tên, mô tả..."
              className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-2 text-xs md:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
            />
          </div>

          {/* Sort Control Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-500 hidden sm:inline">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-50 border-2 border-slate-300 text-slate-900 text-xs md:text-sm font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="newest">🕒 Mới nhất trước</option>
              <option value="oldest">⌛ Cũ nhất trước</option>
              <option value="name-asc">🔤 Tên A ➔ Z</option>
              <option value="name-desc">🔠 Tên Z ➔ A</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs md:text-sm text-slate-700 font-mono font-bold">
          <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border-2 border-slate-300 shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Tổng dự án:</span>
            <strong className="text-slate-900 font-extrabold text-sm md:text-base">{projects.length}</strong>
          </div>
        </div>
      </div>

      {/* Project Grid Cards */}
      {loading ? (
        <ProjectSkeletonGrid />
      ) : filteredProjects.length === 0 ? (
        <div className="bg-white border-2 border-slate-300 rounded-2xl p-12 text-center space-y-4 shadow-md">
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg md:text-xl">Chưa có dự án kiểm thử nào</h3>
            <p className="text-xs md:text-sm text-slate-600 mt-1 max-w-md mx-auto font-semibold">
              Hãy tạo dự án đầu tiên để bắt đầu lưu trữ tài liệu Phase 1 và sử dụng 8 AI QA Agents tự động hoá công việc kiểm thử.
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs md:text-sm font-extrabold transition-all shadow-md"
          >
            + Tạo dự án đầu tiên
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

          {filteredProjects.map(p => (
            <div
              key={p.id}
              className="bg-white border-2 border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20 p-4.5 sm:p-5 rounded-2xl flex flex-col shadow-sm hover:shadow-lg transition-all group cursor-pointer"
            >
              <div className="space-y-2 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 border-2 border-indigo-300 flex items-center justify-center font-extrabold text-indigo-700 shrink-0 text-xs">
                      PRJ
                    </div>
                    <div className="min-w-0">
                      <Link href={`/projects/${p.id}`}>
                        <h3 className="font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors text-base truncate" title={p.name}>
                          {p.name}
                        </h3>
                      </Link>
                      <p className="text-[11px] text-slate-500 font-mono font-semibold">
                        {new Date(p.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setEditingProject(p)
                      }}
                      className="text-slate-500 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-xs font-bold border border-slate-200"
                      title="Chỉnh sửa dự án"
                    >
                      ✏️ Sửa
                    </button>
                  </div>
                </div>

                {/* 1-Line Truncated Description with Hover Tooltip */}
                <div className="h-5 flex items-center min-w-0">
                  {p.description ? (
                    <p className="text-xs text-slate-600 font-semibold truncate leading-tight w-full" title={p.description}>
                      {p.description}
                    </p>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-semibold italic">Chưa có mô tả</span>
                  )}
                </div>

                {/* Tech Stack & Domain Quick Links Container */}
                <div className="space-y-2 pt-0.5">
                  {p.techStack && (
                    <div className="flex flex-wrap gap-1">
                      {p.techStack.split(',').map(t => (
                        <span
                          key={t}
                          className="bg-slate-100 text-slate-800 border border-slate-300 font-mono text-[11px] px-2 py-0.2 rounded-full font-bold"
                        >
                          {t.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Domain Environments, Figma & Bug List Quick Launcher Pills */}
                  {(p.stagingUrl || p.stagingAdminUrl || p.prodUrl || p.prodAdminUrl || p.bugListUrl || p.figmaUrl) ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {p.stagingUrl && (
                        <a
                          href={p.stagingUrl.startsWith('http') ? p.stagingUrl : `https://${p.stagingUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[11px] font-mono font-extrabold flex items-center gap-1 transition-all shadow-2xs"
                          title={`Mở Staging WebApp: ${p.stagingUrl}`}
                        >
                          <span>🟡 STG Web</span>
                        </a>
                      )}
                      {p.stagingAdminUrl && (
                        <a
                          href={p.stagingAdminUrl.startsWith('http') ? p.stagingAdminUrl : `https://${p.stagingAdminUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-300 px-2 py-0.5 rounded text-[11px] font-mono font-extrabold flex items-center gap-1 transition-all shadow-2xs"
                          title={`Mở Staging Admin Portal: ${p.stagingAdminUrl}`}
                        >
                          <span>🟧 STG Admin</span>
                        </a>
                      )}
                      {p.prodUrl && (
                        <a
                          href={p.prodUrl.startsWith('http') ? p.prodUrl : `https://${p.prodUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded text-[11px] font-mono font-extrabold flex items-center gap-1 transition-all shadow-2xs"
                          title={`Mở Production WebApp: ${p.prodUrl}`}
                        >
                          <span>🟢 PROD Web</span>
                        </a>
                      )}
                      {p.prodAdminUrl && (
                        <a
                          href={p.prodAdminUrl.startsWith('http') ? p.prodAdminUrl : `https://${p.prodAdminUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 px-2 py-0.5 rounded text-[11px] font-mono font-extrabold flex items-center gap-1 transition-all shadow-2xs"
                          title={`Mở Production Admin Portal: ${p.prodAdminUrl}`}
                        >
                          <span>🔷 PROD Admin</span>
                        </a>
                      )}
                      {p.figmaUrl && (
                        <a
                          href={p.figmaUrl.startsWith('http') ? p.figmaUrl : `https://${p.figmaUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="bg-pink-50 hover:bg-pink-100 text-pink-900 border border-pink-300 px-2 py-0.5 rounded text-[11px] font-mono font-extrabold flex items-center gap-1 transition-all shadow-2xs"
                          title={`Mở Design Figma File: ${p.figmaUrl}`}
                        >
                          <span>🎨 Figma Link</span>
                        </a>
                      )}
                      {p.bugListUrl && (
                        <a
                          href={p.bugListUrl.startsWith('http') ? p.bugListUrl : `https://${p.bugListUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-300 px-2 py-0.5 rounded text-[11px] font-mono font-extrabold flex items-center gap-1 transition-all shadow-2xs"
                          title={`Mở File Bug List: ${p.bugListUrl}`}
                        >
                          <span>🔴 Bug List</span>
                        </a>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        setEditingProject(p)
                      }}
                      className="text-[11px] text-slate-400 hover:text-indigo-600 font-mono font-bold flex items-center gap-1 transition-colors"
                    >
                      <span>+ Cấu hình Domain WebApp/Admin, Figma & Bug List</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2.5 border-t-2 border-slate-100 flex items-center justify-center text-xs md:text-sm text-indigo-600 group-hover:text-indigo-700 font-extrabold text-center mt-3.5">
                <Link href={`/projects/${p.id}`} className="flex items-center justify-center w-full text-center">
                  <span>Mở Dashboard</span>
                </Link>
              </div>
            </div>

          ))}
        </div>
      )}



      {/* Create Project Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/65 flex items-center justify-center z-50 p-4 sm:p-6 backdrop-blur-xs">
          <div className="bg-white border-2 border-indigo-400 rounded-3xl shadow-2xl p-8 md:p-10 w-full max-w-3xl space-y-6 text-slate-900">
            <div className="flex items-center justify-between border-b-2 border-slate-100 pb-4">
              <h2 className="font-extrabold text-xl md:text-2xl text-slate-900">
                Tạo Dự án QA mới
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 text-lg font-extrabold p-1">✕</button>
            </div>

            <form onSubmit={createProject} className="space-y-5">
              <div>
                <label className="block text-sm md:text-base font-extrabold text-slate-900 mb-1.5">Tên dự án *</label>
                <input
                  autoFocus
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ví dụ: E-Commerce Mobile App"
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-sm md:text-base text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm md:text-base font-extrabold text-slate-900 mb-1.5">Mô tả ngắn nghiệp vụ</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={4}
                  placeholder="Ví dụ: Hệ thống bán lẻ đa kênh với các luồng Thanh toán, Đơn hàng, Kho..."
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-sm md:text-base text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y leading-relaxed"
                />
              </div>
              <div>
                <label className="block text-sm md:text-base font-extrabold text-slate-900 mb-1.5">Tech Stack</label>
                <input
                  value={form.techStack}
                  onChange={e => setForm(f => ({ ...f, techStack: e.target.value }))}
                  placeholder="Ví dụ: React Native, Node.js, PostgreSQL, Kafka"
                  className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-4 py-3 text-sm md:text-base text-slate-900 font-semibold placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Quick Domain & Tool Links Config Section */}
              <div className="space-y-3 bg-slate-50 border-2 border-slate-200 p-4 rounded-2xl">
                <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider font-mono">🌐 DOMAINS & BUG TRACKING LINKS</h4>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 mb-1 truncate">🟡 STG Web</label>
                    <input
                      value={form.stagingUrl}
                      onChange={e => setForm(f => ({ ...f, stagingUrl: e.target.value }))}
                      placeholder="https://staging.app.com"
                      className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 mb-1 truncate">🟧 STG Admin</label>
                    <input
                      value={form.stagingAdminUrl}
                      onChange={e => setForm(f => ({ ...f, stagingAdminUrl: e.target.value }))}
                      placeholder="https://staging-admin.app.com"
                      className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 mb-1 truncate">🟢 PROD Web</label>
                    <input
                      value={form.prodUrl}
                      onChange={e => setForm(f => ({ ...f, prodUrl: e.target.value }))}
                      placeholder="https://app.com"
                      className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 mb-1 truncate">🔷 PROD Admin</label>
                    <input
                      value={form.prodAdminUrl}
                      onChange={e => setForm(f => ({ ...f, prodAdminUrl: e.target.value }))}
                      placeholder="https://admin.app.com"
                      className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 mb-1 truncate">🎨 Figma Link</label>
                    <input
                      value={form.figmaUrl}
                      onChange={e => setForm(f => ({ ...f, figmaUrl: e.target.value }))}
                      placeholder="https://www.figma.com/file/..."
                      className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-900 mb-1 truncate">🔴 Bug List</label>
                    <input
                      value={form.bugListUrl}
                      onChange={e => setForm(f => ({ ...f, bugListUrl: e.target.value }))}
                      placeholder="https://docs.google.com/spreadsheets/..."
                      className="w-full bg-white border-2 border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>


              <div className="flex gap-4 pt-4 border-t-2 border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border-2 border-slate-300 rounded-xl py-3 text-sm md:text-base font-extrabold text-slate-700 hover:bg-slate-100 transition-all"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={saving || !form.name.trim()}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-sm md:text-base font-extrabold transition-all disabled:opacity-50 shadow-md"
                >
                  {saving ? 'Đang khởi tạo...' : 'Thêm Dự án'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSaved={updated => {
            setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
            setEditingProject(null)
          }}
        />
      )}
    </div>
  )
}
