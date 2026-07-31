'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Project } from '@/lib/types'

export default function SettingsPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [instruction, setInstruction] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}`).then(r => r.json()),
      fetch(`/api/projects/${projectId}/instruction`).then(r => r.json()),
    ]).then(([proj, inst]) => {
      setProject(proj)
      setInstruction(inst.content || '')
      setLoading(false)
    })
  }, [projectId])

  async function handleSave() {
    setSaving(true)
    await fetch(`/api/projects/${projectId}/instruction`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: instruction }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="text-zinc-500 text-sm py-12 text-center">Đang tải...</div>
  if (!project) return <div className="text-red-400 py-12 text-center">Project không tồn tại</div>

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-600">
        <Link href="/" className="hover:text-zinc-400 transition-colors">Projects</Link>
        <span>/</span>
        <Link href={`/projects/${projectId}`} className="hover:text-zinc-400 transition-colors">{project.name}</Link>
        <span>/</span>
        <span className="text-zinc-300 font-medium">Cài đặt Dự án</span>
      </div>

      {/* Global Config Alert Banner */}
      <div className="bg-gradient-to-r from-indigo-950/70 via-purple-950/40 to-zinc-900 border border-indigo-500/30 rounded-2xl p-6 space-y-3 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚙️</span>
            <div>
              <h1 className="text-lg font-bold text-zinc-100">Cấu hình Hệ thống đã được Quản lý Tập trung</h1>
              <p className="text-xs text-zinc-400 mt-1">
                Toàn bộ **System Instructions ("AI là ai?")** và **Task Prompts ("Làm nhiệm vụ gì?")** hiện đã được quản lý tập trung ở mục <strong>System Configs (Global Configs)</strong> áp dụng cho tất cả các dự án.
              </p>
            </div>
          </div>

          <Link
            href="/configs"
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/20"
          >
            ⚙️ Mở Cấu hình Hệ thống (System Configs) ➔
          </Link>
        </div>
      </div>

      {/* Optional Project Override Section */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-zinc-200">Ghi đè Quy tắc riêng cho dự án này (Tuỳ chọn)</h2>
          <p className="text-xs text-zinc-500 mt-1">
            Nếu dự án "{project.name}" có các quy tắc kiểm thử hoặc từ vựng nghiệp vụ đặc thù riêng, bạn có thể nhập ở đây. Nội dung này sẽ được nối thêm vào Global System Instruction khi thực thi AI.
          </p>
        </div>

        <textarea
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          rows={10}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
          placeholder="Ví dụ: Quy tắc riêng về format ID, thuật ngữ domain riêng của dự án..."
        />

        <div className="flex items-center justify-between">
          {saved ? <span className="text-xs text-emerald-400 font-medium">✅ Đã lưu thành công!</span> : <span />}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : 'Lưu Quy tắc riêng dự án'}
          </button>
        </div>
      </div>
    </div>
  )
}
