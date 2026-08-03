'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SystemConfigsSkeleton } from '@/app/components/Skeletons'

interface ConfigItem {
  label: string
  desc: string
  content: string
  phase?: string
  step?: string
  standard?: string
}

export default function SystemConfigsPage() {
  const [configs, setConfigs] = useState<Record<string, ConfigItem>>({})
  const [activeTab, setActiveTab] = useState<string>('system_instruction')
  const [openGroup, setOpenGroup] = useState<'core' | 'phase1' | 'phase2'>('core')
  const [editingContent, setEditingContent] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    fetch('/api/configs')
      .then(r => r.json())
      .then(data => {
        if (data.configs) {
          setConfigs(data.configs)
          setEditingContent(data.configs['system_instruction']?.content || '')
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function handleTabChange(key: string, group: 'core' | 'phase1' | 'phase2') {
    setActiveTab(key)
    setOpenGroup(group)
    setEditingContent(configs[key]?.content || '')
    setMessage(null)
  }

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskKey: activeTab,
          content: editingContent,
          action: 'save',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra khi lưu')

      setConfigs(prev => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          content: editingContent,
        },
      }))
      setMessage({ text: '✓ Đã lưu cấu hình thành công!', type: 'success' })
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Có lỗi khi lưu', type: 'error' })
    }
    setSaving(false)
  }

  async function handleReset() {
    if (!confirm('Bạn có chắc muốn khôi phục cấu hình này về mặc định ban đầu?')) return
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskKey: activeTab,
          action: 'reset',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra khi reset')

      setEditingContent(data.content)
      setConfigs(prev => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          content: data.content,
        },
      }))
      setMessage({ text: '✓ Đã khôi phục cấu hình về mặc định!', type: 'success' })
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : 'Có lỗi khi reset', type: 'error' })
    }
    setSaving(false)
  }

  if (loading) return <SystemConfigsSkeleton />

  const currentConfig = configs[activeTab] || { label: activeTab, desc: '', content: '' }

  const phase1Keys = [
    'doc_builder_brd',
    'doc_builder_srs',
    'doc_builder_user_story',
    'doc_builder_api_spec',
    'doc_builder_change_request',
  ]
  const phase2Keys = [
    'review-requirement',
    'acceptance-criteria',
    'test-strategy',
    'test-plan',
    'test-scenario',
    'test-case',
    'regression-checklist',
    'test-report',
  ]
  const directiveKeys = [
    'directives_step1',
    'directives_step2',
    'directives_step3',
    'directives_step4',
  ]
  const specializedKeys = ['clarify']

  // Clean label string: remove parentheses like "(6 Bước...)"
  function cleanLabelName(label: string): string {
    return label.replace(/\s*\([^)]*\)/g, '').trim()
  }

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Compact High-Density Header Bar */}
      <div className="bg-white border-2 border-slate-300 px-5 py-3.5 rounded-2xl shadow-xs flex items-center justify-between flex-wrap gap-3 relative">
        {/* Left: Back Button */}
        <Link
          href="/"
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-extrabold border border-slate-300 transition-all flex items-center gap-1 shrink-0"
        >
          ← Trở về
        </Link>

        {/* Center: Blue Title Label */}
        <h1 className="text-xl md:text-2xl font-black text-indigo-600 tracking-tight text-center flex-1">
          System Instructions & Prompts Engine
        </h1>

        {/* Right: Iconless Architecture Link Button */}
        <Link
          href="/docs/architecture"
          className="text-xs font-extrabold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-300 px-3.5 py-1.5 rounded-xl transition-all shadow-xs shrink-0"
          title="Xem sơ đồ chi tiết luồng xử lý và kiến trúc hệ thống"
        >
          Xem Tài liệu Kiến trúc System ➔
        </Link>
      </div>

      <div className="grid md:grid-cols-12 gap-6 items-start">
        <div className="md:col-span-5 lg:col-span-4 space-y-3">
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="font-black text-slate-900 text-sm md:text-base px-1 uppercase tracking-wider">DANH MỤC CẤU HÌNH</h3>
              
              {/* CATEGORY 1: GLOBAL CORE ENGINE (2 CONFIGS) */}
              <div className="border-2 border-slate-300 rounded-xl overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setOpenGroup('core')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 hover:bg-slate-200 transition-colors text-left cursor-pointer"
                >
                  <span className="text-sm md:text-base font-black text-slate-900 tracking-tight">1. CORE SYSTEM ENGINE</span>
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-950 border border-indigo-200 px-2.5 py-0.5 rounded-full text-xs font-black">2 Configs</span>
                    <span className="text-slate-600 text-sm font-black">{openGroup === 'core' ? '▼' : '▶'}</span>
                  </div>
                </button>

                {openGroup === 'core' && (
                  <div className="p-2.5 bg-white space-y-2 border-t-2 border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleTabChange('system_instruction', 'core')}
                      className={`w-full text-left p-3 rounded-xl text-sm md:text-base font-bold transition-all border-2 cursor-pointer ${
                        activeTab === 'system_instruction'
                          ? 'bg-indigo-600 border-indigo-700 text-white font-black shadow-sm'
                          : 'bg-white border-slate-300 text-slate-800 hover:bg-indigo-50/50'
                      }`}
                    >
                      <span>System Instruction (Global)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTabChange('prompt_assembly', 'core')}
                      className={`w-full text-left p-3 rounded-xl text-sm md:text-base font-bold transition-all border-2 cursor-pointer ${
                        activeTab === 'prompt_assembly'
                          ? 'bg-indigo-600 border-indigo-700 text-white font-black shadow-sm'
                          : 'bg-white border-slate-300 text-slate-800 hover:bg-indigo-50/50'
                      }`}
                    >
                      <span>Prompt Builder Engine</span>
                    </button>
                  </div>
                )}
              </div>

              {/* CATEGORY 2: PHASE 1 DOC BUILDER (5 CONFIGS) */}
              <div className="border-2 border-slate-300 rounded-xl overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setOpenGroup('phase1')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 hover:bg-slate-200 transition-colors text-left cursor-pointer"
                >
                  <span className="text-sm md:text-base font-black text-slate-900 tracking-tight">2. PHASE 1: DOC BUILDER</span>
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-950 border border-indigo-200 px-2.5 py-0.5 rounded-full text-xs font-black">5 Configs</span>
                    <span className="text-slate-600 text-sm font-black">{openGroup === 'phase1' ? '▼' : '▶'}</span>
                  </div>
                </button>

                {openGroup === 'phase1' && (
                  <div className="p-2.5 bg-white space-y-2 border-t-2 border-slate-200">
                    {phase1Keys.map(k => {
                      const meta = configs[k]
                      if (!meta) return null
                      const isActive = activeTab === k
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => handleTabChange(k, 'phase1')}
                          className={`w-full text-left p-3 rounded-xl text-sm md:text-base font-bold transition-all border-2 cursor-pointer ${
                            isActive
                              ? 'bg-indigo-600 border-indigo-700 text-white font-black shadow-sm'
                              : 'bg-white border-slate-300 text-slate-800 hover:bg-indigo-50/50'
                          }`}
                        >
                          <span>{cleanLabelName(meta.label)}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* CATEGORY 3: PHASE 2 QA PIPELINE (13 CONFIGS) */}
              <div className="border-2 border-slate-300 rounded-xl overflow-hidden shadow-xs">
                <button
                  type="button"
                  onClick={() => setOpenGroup('phase2')}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 hover:bg-slate-200 transition-colors text-left"
                >
                  <span className="text-sm md:text-base font-black text-slate-900 tracking-tight">3. PHASE 2: QA PIPELINE</span>
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-100 text-indigo-950 border border-indigo-200 px-2.5 py-0.5 rounded-full text-xs font-black">13 Configs</span>
                    <span className="text-slate-600 text-sm font-black">{openGroup === 'phase2' ? '▼' : '▶'}</span>
                  </div>
                </button>

                {openGroup === 'phase2' && (
                  <div className="p-2.5 bg-white space-y-3.5 border-t-2 border-slate-200">
                    {/* Sub-group A */}
                    <div className="space-y-1.5">
                      <div className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">A. TASK PROMPTS (8)</div>
                      {phase2Keys.map(k => {
                        const meta = configs[k]
                        if (!meta) return null
                        const isActive = activeTab === k
                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => handleTabChange(k, 'phase2')}
                            className={`w-full text-left p-3 rounded-xl text-sm md:text-base font-bold transition-all border-2 cursor-pointer ${
                              isActive
                                ? 'bg-indigo-600 border-indigo-700 text-white font-black shadow-sm'
                                : 'bg-white border-slate-300 text-slate-800 hover:bg-indigo-50/50'
                            }`}
                          >
                            <span>{cleanLabelName(meta.label)}</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Sub-group B */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">B. FOCUS DIRECTIVES (4)</div>
                      {directiveKeys.map(k => {
                        const meta = configs[k]
                        if (!meta) return null
                        const isActive = activeTab === k
                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => handleTabChange(k, 'phase2')}
                            className={`w-full text-left p-3 rounded-xl text-sm md:text-base font-bold transition-all border-2 cursor-pointer ${
                              isActive
                                ? 'bg-indigo-600 border-indigo-700 text-white font-black shadow-sm'
                                : 'bg-white border-slate-300 text-slate-800 hover:bg-indigo-50/50'
                            }`}
                          >
                            <span>{cleanLabelName(meta.label)}</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Sub-group C */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-xs font-black text-slate-500 uppercase tracking-wider px-1">C. SPECIALIZED AGENT (1)</div>
                      {specializedKeys.map(k => {
                        const meta = configs[k]
                        if (!meta) return null
                        const isActive = activeTab === k
                        return (
                          <button
                            key={k}
                            type="button"
                            onClick={() => handleTabChange(k, 'phase2')}
                            className={`w-full text-left p-3 rounded-xl text-sm md:text-base font-bold transition-all border-2 cursor-pointer ${
                              isActive
                                ? 'bg-indigo-600 border-indigo-700 text-white font-black shadow-sm'
                                : 'bg-white border-slate-300 text-slate-800 hover:bg-indigo-50/50'
                            }`}
                          >
                            <span>{cleanLabelName(meta.label)}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
          </div>
        </div>

        {/* Prompt Editor Panel */}
        <div className="md:col-span-8 bg-white border-2 border-slate-300 rounded-2xl p-6 space-y-5 shadow-sm text-slate-900">
          {/* Header Panel */}
          <div className="border-b border-slate-200 pb-4 space-y-3">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="space-y-1 max-w-xl">
                <h2 className="font-black text-slate-900 text-xl md:text-2xl tracking-tight">
                  {currentConfig.label}
                </h2>
                {currentConfig.desc && (
                  <p className="text-xs md:text-sm font-medium text-slate-600 leading-relaxed">
                    {currentConfig.desc}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  Khôi phục
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-indigo-600 text-white hover:bg-indigo-500 px-4 py-1.5 rounded-xl text-xs md:text-sm font-bold transition-all shadow-sm disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu Cấu hình'}
                </button>
              </div>
            </div>

            {/* Highlighted Industry Standards & Scope */}
            <div className="flex items-center gap-2 flex-wrap text-xs pt-1 font-semibold">
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-lg">
                📌 <strong>Phạm vi áp dụng:</strong> {currentConfig.phase || 'Global Core Engine'}
              </span>
              <span className="bg-amber-50 text-amber-900 border border-amber-300 px-3 py-1 rounded-lg shadow-2xs">
                📜 <strong>Tiêu chuẩn Quốc tế:</strong> {currentConfig.standard || 'ISTQB & ISO/IEC/IEEE 29119 Standard'}
              </span>
            </div>
          </div>

          {message && (
            <div
              className={`p-3.5 rounded-xl text-xs md:text-sm font-bold border shadow-xs ${
                message.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-red-50 text-red-800 border-red-300'
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs md:text-sm font-bold text-slate-800">
              Nội dung Prompt Template (Markdown / Text Quy tắc):
            </label>
            <textarea
              value={editingContent}
              onChange={e => setEditingContent(e.target.value)}
              rows={20}
              className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl p-4 font-mono text-xs md:text-sm font-semibold text-slate-900 leading-relaxed focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-y"
              placeholder="Nhập nội dung cấu hình prompt..."
            />
          </div>
        </div>
      </div>
    </div>
  )
}
