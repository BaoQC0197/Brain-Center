'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DocumentViewer from '@/app/components/DocumentViewer'

export default function ArchitectureDocPage() {
  const [content, setContent] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string>('')
  const [saving, setSaving] = useState<boolean>(false)

  useEffect(() => {
    fetch('/api/docs/architecture?raw=true')
      .then(res => {
        if (!res.ok) throw new Error('Không thể tải tài liệu kiến trúc')
        return res.json()
      })
      .then(data => {
        setContent(data.content || '')
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || 'Lỗi tải trang')
        setLoading(false)
      })
  }, [])

  async function handleSaveContent(newContent: string) {
    setSaving(true)
    try {
      const res = await fetch('/api/docs/architecture', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      })
      if (!res.ok) throw new Error('Lưu tài liệu thất bại')
      const data = await res.json()
      setContent(data.content)
    } catch (err: any) {
      alert(err.message || 'Có lỗi xảy ra khi lưu tài liệu kiến trúc')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-700 font-mono text-sm">
        <div className="bg-white border-2 border-indigo-300 rounded-2xl p-8 text-center space-y-3 shadow-md">
          <div className="animate-spin text-2xl">⚡</div>
          <p className="font-extrabold text-slate-900">Đang tải Tài liệu Kiến trúc Hệ thống QA-Brain...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-8 text-center space-y-4 max-w-md shadow-md text-red-900">
          <h2 className="text-xl font-extrabold">Không thể mở tài liệu kiến trúc</h2>
          <p className="text-xs font-bold">{error}</p>
          <Link href="/configs" className="inline-block bg-red-600 text-white px-5 py-2 rounded-xl text-xs font-extrabold shadow-sm hover:bg-red-500">
            ← Quay lại System Configs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white border-2 border-slate-200 p-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 text-xs md:text-sm text-slate-700 font-mono font-bold">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
          <span>/</span>
          <Link href="/configs" className="hover:text-indigo-600 transition-colors">System Configs</Link>
          <span>/</span>
          <span className="text-slate-900 font-extrabold">Architecture & Pitching Specification</span>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/docs/architecture"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-indigo-50 border-2 border-indigo-300 text-indigo-900 px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-indigo-100 transition-all shadow-xs"
          >
            Xuất HTML Đầy đủ

          </a>
          <Link
            href="/configs"
            className="bg-white border-2 border-slate-300 text-slate-800 px-4 py-2 rounded-xl text-xs font-extrabold hover:bg-slate-100 transition-all shadow-xs"
          >
            ← Quay lại Configs
          </Link>
        </div>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-xs bg-indigo-500 text-white px-3 py-1 rounded-md font-mono font-extrabold shadow-xs">
            SYSTEM ARCHITECTURE SPEC
          </span>
          <span className="text-xs bg-purple-500/40 text-purple-200 border border-purple-400/40 px-2.5 py-0.5 rounded font-mono font-extrabold">
            ISTQB / IEEE / ISO Compliant
          </span>
        </div>
        <h1 className="text-xl md:text-3xl font-extrabold tracking-tight">
          QA-Brain Center: Tổng quan Kiến trúc System & Hướng dẫn Pitching
        </h1>
        <p className="text-xs md:text-sm text-indigo-200 font-medium max-w-4xl leading-relaxed">
          Tài liệu chuẩn hoá mô tả Tầm nhìn Dự án, ROI Doanh nghiệp, Ma trận Tiêu chuẩn Quốc tế, Sơ đồ Mermaid Sequence Diagrams và Bộ Launchers Môi trường. Bạn có thể bấm nút <b>"✏️ Edit"</b> trên trình xem bên dưới để chỉnh sửa trực tiếp nội dung!
        </p>
      </div>

      {/* Interactive Document Viewer with Live Editability */}
      <div className="h-[80vh] min-h-[650px]">
        <DocumentViewer
          content={content}
          docType="ARCHITECTURE SPEC"
          title="QA-Brain Center Architecture & Pitching Specification"
          version={1}
          createdAt={new Date().toISOString()}
          isEditable={true}
          onSaveContent={handleSaveContent}
        />
      </div>
    </div>
  )
}
