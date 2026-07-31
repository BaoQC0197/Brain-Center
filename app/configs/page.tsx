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

  function handleTabChange(key: string) {
    setActiveTab(key)
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
    'doc_builder_epic',
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

  return (
    <div className="space-y-6 w-full pb-16">
      {/* Breadcrumb & Navigation Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white border-2 border-slate-200 p-4 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 text-xs md:text-sm text-slate-700 font-mono font-bold">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Projects</Link>
          <span>/</span>
          <span className="text-slate-900 font-extrabold">System Instructions & Task Prompts Engine</span>
        </div>

        <div>
          <Link
            href="/"
            className="bg-white border-2 border-slate-300 text-slate-800 px-4 py-2 rounded-xl text-xs md:text-sm font-extrabold hover:bg-slate-100 transition-all shadow-xs"
          >
            ← Trở về
          </Link>
        </div>
      </div>

      {/* Hero Header Banner */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-2 border-indigo-300 rounded-2xl p-6 md:p-8 space-y-4 shadow-md text-slate-900">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs md:text-sm bg-indigo-600 text-white px-3 py-1 rounded-md font-mono font-extrabold shadow-xs">
                SYSTEM ENGINE
              </span>
              <h1 className="text-xl md:text-3xl font-extrabold text-slate-900 tracking-tight">System Instructions & Prompts Engine</h1>
            </div>
            <p className="text-xs md:text-sm text-slate-700 mt-2 font-bold leading-relaxed max-w-3xl">
              Quản lý tập trung <strong>System Instruction ("AI là ai?")</strong> và <strong>Task Prompts từng Loại tài liệu & Step</strong> áp dụng cho toàn hệ thống QA-Brain.
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="bg-white border-2 border-indigo-300 rounded-xl p-3 text-xs md:text-sm space-y-1 font-mono text-indigo-900 font-extrabold shadow-xs">
              <div>Storage: <code className="text-slate-700">storage/configs/</code></div>
              <div>Standard: BABOK, IEEE 830, ISTQB & ISO 29119</div>
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Workflow Flowchart Card */}
      <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-extrabold text-slate-900 text-xs md:text-sm font-mono flex items-center gap-2">
            <span>Sơ đồ Kiến trúc Prompt Builder Engine:</span>
          </h3>
          <Link
            href="/docs/architecture"
            className="text-xs font-extrabold text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1"
          >
            <span>Xem Sơ đồ Kiến trúc & Luồng Xử lý Chi tiết (Cho phép Edit)</span>

          </Link>
        </div>
        <div className="grid sm:grid-cols-4 gap-3 text-center text-xs md:text-sm font-extrabold">
          <button
            type="button"
            onClick={() => handleTabChange('system_instruction')}
            className={`p-3.5 rounded-xl border-2 transition-all text-left space-y-1 ${
              activeTab === 'system_instruction'
                ? 'bg-indigo-600 border-indigo-700 text-white shadow-md ring-2 ring-indigo-400'
                : 'bg-indigo-50 border-indigo-300 text-indigo-900 hover:bg-indigo-100 hover:border-indigo-400 shadow-xs'
            }`}
          >
            <div className="font-extrabold">1. System Instruction</div>
            <div className={`text-[10px] md:text-xs font-mono font-bold ${activeTab === 'system_instruction' ? 'text-indigo-100' : 'text-slate-600'}`}>Global Role & ISTQB Rules</div>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('review-requirement')}
            className={`p-3.5 rounded-xl border-2 transition-all text-left space-y-1 ${
              activeTab === 'review-requirement'
                ? 'bg-purple-600 border-purple-700 text-white shadow-md ring-2 ring-purple-400'
                : 'bg-purple-50 border-purple-300 text-purple-900 hover:bg-purple-100 hover:border-purple-400 shadow-xs'
            }`}
          >
            <div className="font-extrabold">2. Task Prompt per Step</div>
            <div className={`text-[10px] md:text-xs font-mono font-bold ${activeTab === 'review-requirement' ? 'text-purple-100' : 'text-slate-600'}`}>BRD / SRS / ISTQB Steps 1-8</div>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('doc_builder_brd')}
            className={`p-3.5 rounded-xl border-2 transition-all text-left space-y-1 ${
              activeTab === 'doc_builder_brd'
                ? 'bg-emerald-600 border-emerald-700 text-white shadow-md ring-2 ring-emerald-400'
                : 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-400 shadow-xs'
            }`}
          >
            <div className="font-extrabold">3. Project Context</div>
            <div className={`text-[10px] md:text-xs font-mono font-bold ${activeTab === 'doc_builder_brd' ? 'text-emerald-100' : 'text-slate-600'}`}>Baseline & Preceding Output</div>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('prompt_assembly')}
            className={`p-3.5 rounded-xl border-2 transition-all text-left space-y-1 ${
              activeTab === 'prompt_assembly'
                ? 'bg-amber-500 border-amber-600 text-white shadow-md ring-2 ring-amber-400'
                : 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100 hover:border-amber-400 shadow-xs'
            }`}
          >
            <div className="font-extrabold">4. Prompt Builder Engine</div>
            <div className={`text-[10px] md:text-xs font-mono font-bold ${activeTab === 'prompt_assembly' ? 'text-amber-100' : 'text-slate-600'}`}>Ghép Context ➔ Claude / LLM</div>
          </button>
        </div>

      </div>

      {/* Main Grid Section: Config Sidebar & Prompt Editor */}
      <div className="grid md:grid-cols-12 gap-6 items-start">
        {/* Config Menu Selector (Grouped by Phase & Step) */}
        <div className="md:col-span-4 space-y-3">
          <div className="bg-white border-2 border-slate-300 rounded-2xl p-5 space-y-5 shadow-sm">
            <h3 className="font-extrabold text-slate-700 text-xs px-1 uppercase tracking-wider font-mono">DANH MỤC CẤU HÌNH THEO PHASE & STEP</h3>

            <div className="space-y-4">
              {/* SECTION 1: GLOBAL CORE */}
              <div className="space-y-1.5">
                <div className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider px-1 font-mono">GLOBAL CORE INSTRUCTION</div>
                <button
                  type="button"
                  onClick={() => handleTabChange('system_instruction')}
                  className={`w-full text-left p-3 rounded-xl text-xs md:text-sm font-extrabold transition-all border-2 flex items-center justify-between ${
                    activeTab === 'system_instruction'
                      ? 'bg-indigo-600 border-indigo-700 text-white shadow-sm'
                      : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">System Instruction (Global)</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${activeTab === 'system_instruction' ? 'bg-white/30 text-white' : 'bg-indigo-100 text-indigo-900 border border-indigo-300'}`}>
                    Core
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabChange('prompt_assembly')}
                  className={`w-full text-left p-3 rounded-xl text-xs md:text-sm font-extrabold transition-all border-2 flex items-center justify-between ${
                    activeTab === 'prompt_assembly'
                      ? 'bg-amber-600 border-amber-700 text-white shadow-sm'
                      : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">Prompt Builder Engine (6 Tầng)</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${activeTab === 'prompt_assembly' ? 'bg-white/30 text-white' : 'bg-amber-100 text-amber-900 border border-amber-300'}`}>
                    Engine
                  </span>
                </button>
              </div>


              {/* SECTION 2: PHASE 1 REQUIREMENTS BASELINE (BY DOC TYPE) */}
              <div className="space-y-1.5">
                <div className="text-xs font-extrabold text-purple-900 uppercase tracking-wider px-1 font-mono">PHASE 1: DOC BUILDER (BY DOC TYPE)</div>
                {phase1Keys.map(k => {
                  const meta = configs[k]
                  if (!meta) return null
                  const isActive = activeTab === k
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleTabChange(k)}
                      className={`w-full text-left p-3 rounded-xl text-xs md:text-sm transition-all border-2 flex items-center justify-between gap-2 ${
                        isActive
                          ? 'bg-purple-600 border-purple-700 text-white font-extrabold shadow-sm'
                          : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 font-extrabold'
                      }`}
                    >
                      <div className="min-w-0 truncate">
                        <div className="truncate font-extrabold">{meta.label}</div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold shrink-0 ${isActive ? 'bg-white/30 text-white' : 'bg-purple-100 text-purple-900 border border-purple-300'}`}>
                        {meta.step || 'Phase 1'}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* SECTION 3: PHASE 2 QA TESTING PIPELINE (4 STEPS) */}
              <div className="space-y-1.5">
                <div className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider px-1 font-mono">PHASE 2: QA TESTING PIPELINE (4 STEPS)</div>
                {phase2Keys.map(k => {
                  const meta = configs[k]
                  if (!meta) return null
                  const isActive = activeTab === k
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleTabChange(k)}
                      className={`w-full text-left p-3 rounded-xl text-xs md:text-sm transition-all border-2 flex items-center justify-between gap-2 ${
                        isActive
                          ? 'bg-emerald-600 border-emerald-700 text-white font-extrabold shadow-sm'
                          : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 font-extrabold'
                      }`}
                    >
                      <div className="min-w-0 truncate">
                        <div className="truncate font-extrabold">{meta.label}</div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold shrink-0 ${isActive ? 'bg-white/30 text-white' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'}`}>
                        {meta.step || 'Step'}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* SECTION 4: PHASE 2 FOCUS DIRECTIVES (4 STEPS) */}
              <div className="space-y-1.5">
                <div className="text-xs font-extrabold text-sky-900 uppercase tracking-wider px-1 font-mono">PHASE 2 FOCUS DIRECTIVES (CHECKBOXES)</div>
                {directiveKeys.map(k => {
                  const meta = configs[k]
                  if (!meta) return null
                  const isActive = activeTab === k
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleTabChange(k)}
                      className={`w-full text-left p-3 rounded-xl text-xs md:text-sm transition-all border-2 flex items-center justify-between gap-2 ${
                        isActive
                          ? 'bg-sky-600 border-sky-700 text-white font-extrabold shadow-sm'
                          : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 font-extrabold'
                      }`}
                    >
                      <div className="min-w-0 truncate">
                        <div className="truncate font-extrabold">{meta.label}</div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold shrink-0 ${isActive ? 'bg-white/30 text-white' : 'bg-sky-100 text-sky-900 border border-sky-300'}`}>
                        {meta.step || 'Directives'}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* SECTION 5: SPECIALIZED SUBAGENTS */}
              <div className="space-y-1.5">
                <div className="text-xs font-extrabold text-amber-900 uppercase tracking-wider px-1 font-mono">SPECIALIZED SUBAGENTS</div>
                {specializedKeys.map(k => {
                  const meta = configs[k]
                  if (!meta) return null
                  const isActive = activeTab === k
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleTabChange(k)}
                      className={`w-full text-left p-3 rounded-xl text-xs md:text-sm transition-all border-2 flex items-center justify-between gap-2 ${
                        isActive
                          ? 'bg-amber-600 border-amber-700 text-white font-extrabold shadow-sm'
                          : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100 font-extrabold'
                      }`}
                    >
                      <span className="truncate font-extrabold">{meta.label}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold shrink-0 ${isActive ? 'bg-white/30 text-white' : 'bg-amber-100 text-amber-900 border border-amber-300'}`}>Subagent</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Prompt Editor Panel */}
        <div className="md:col-span-8 bg-sky-50/80 border-2 border-sky-400 border-l-8 border-l-sky-600 rounded-2xl p-6 space-y-5 shadow-md text-slate-900">
          {/* Header Panel with Phase, Step & Standard Metadata Badges */}
          <div className="border-b-2 border-sky-200 pb-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-extrabold text-slate-900 text-lg md:text-2xl">
                  {currentConfig.label}
                </h2>
                {currentConfig.desc && <p className="text-xs md:text-sm font-bold text-slate-700 mt-1 leading-relaxed">{currentConfig.desc}</p>}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={saving}
                  className="bg-white text-slate-800 hover:bg-slate-100 border-2 border-slate-300 px-4 py-2 rounded-xl text-xs md:text-sm font-extrabold transition-all shadow-xs disabled:opacity-50"
                >
                  Khôi phục Mặc định
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-indigo-600 text-white hover:bg-indigo-500 px-5 py-2 rounded-xl text-xs md:text-sm font-extrabold transition-all shadow-md disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu Cấu hình'}
                </button>
              </div>
            </div>

            {/* Badges Bar: Phase, Step Number, Testing Standard */}
            <div className="flex items-center gap-2 flex-wrap text-xs md:text-sm pt-1 font-mono font-extrabold">
              <span className="bg-indigo-100 text-indigo-900 border-2 border-indigo-300 px-3 py-1 rounded-full">
                {currentConfig.phase || 'Global Core'}
              </span>
              <span className="bg-emerald-100 text-emerald-900 border-2 border-emerald-300 px-3 py-1 rounded-full">
                {currentConfig.step || 'Core'}
              </span>
              <span className="bg-white text-slate-800 border-2 border-slate-300 px-3 py-1 rounded-full">
                Standard: {currentConfig.standard || 'ISTQB Certified Standard'}
              </span>
            </div>
          </div>

          {message && (
            <div
              className={`p-4 rounded-xl text-xs md:text-sm font-extrabold border-2 shadow-xs ${
                message.type === 'success'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-red-100 text-red-900 border-red-300'
              }`}
            >
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-xs md:text-sm font-extrabold text-slate-900 mb-2">
              Nội dung Prompt Template Markdown (Quy tắc Các bước Xây dựng & Tiêu chuẩn):
            </label>
            <textarea
              value={editingContent}
              onChange={e => setEditingContent(e.target.value)}
              rows={22}
              className="w-full bg-white border-2 border-slate-300 rounded-xl p-4 font-mono text-xs md:text-sm font-semibold text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
              placeholder="Nhập nội dung cấu hình prompt..."
            />
          </div>

          <div className="flex items-center justify-between text-xs md:text-sm text-slate-700 font-mono font-extrabold pt-3 border-t-2 border-sky-200">
            <span>Độ dài: {editingContent.length.toLocaleString('vi-VN')} ký tự</span>
            <span>Tự động áp dụng cho Prompt Builder Engine khi gọi Agent</span>
          </div>
        </div>
      </div>
    </div>
  )
}
