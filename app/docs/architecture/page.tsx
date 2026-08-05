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
      <div className="space-y-6 w-full pb-16 animate-pulse">
        <div className="h-16 bg-slate-200 rounded-2xl w-full" />
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 space-y-4 shadow-sm">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-4 bg-slate-200 rounded w-full" />
          <div className="h-4 bg-slate-200 rounded w-4/5" />
          <div className="h-64 bg-slate-200 rounded-xl w-full" />
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
    <div className="space-y-6 w-full">
      {/* Top Breadcrumb & Action Navigation Bar */}
      <div className="bg-white border-2 border-slate-300 px-5 py-3.5 rounded-2xl shadow-xs flex items-center justify-between flex-wrap gap-3">
        {/* Left: Back Button & Breadcrumbs */}
        <div className="flex items-center gap-3">
          <Link
            href="/configs"
            className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-extrabold border border-slate-300 transition-all flex items-center gap-1 shrink-0"
          >
            ← Trở về
          </Link>
          <div className="hidden sm:flex items-center gap-2 text-xs md:text-sm text-slate-700 font-mono font-bold">
            <Link href="/" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
            <span>/</span>
            <Link href="/configs" className="hover:text-indigo-600 transition-colors">System Configs</Link>
            <span>/</span>
            <span className="text-slate-900 font-extrabold">Architecture Spec</span>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2.5">
          <a
            href="/api/docs/architecture"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs md:text-sm font-extrabold transition-all shadow-sm flex items-center gap-1.5"
          >
            Xuất HTML Đầy đủ ➔
          </a>
        </div>
      </div>

      {/* Interactive Document Viewer with Live Editability */}
      <div className="h-[80vh] min-h-[650px]">
        <DocumentViewer
          content={content}
          docType="ARCHITECTURE SPEC"
          title="QA-Brain Center Architecture Specification"
          version={1}
          createdAt={new Date().toISOString()}
          isEditable={true}
          onSaveContent={handleSaveContent}
        />
      </div>
    </div>
  )
}
