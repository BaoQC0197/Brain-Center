'use client'

import { useEffect, useState } from 'react'

interface ModelStatusResponse {
  source?: string
  keyPresent: boolean
  activeModel: string
  activeModelHealthy: boolean
  geminiPercent?: number
  geminiResetTime?: string
  tokenCost?: number
}

const CACHE_KEY = 'qa_brain_model_status'
const CACHE_TTL = 60_000 // 60 seconds

export default function ModelStatusBadge() {
  const [data, setData] = useState<ModelStatusResponse | null>(null)

  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached) {
        const { ts, payload } = JSON.parse(cached)
        if (Date.now() - ts < CACHE_TTL) {
          setData(payload)
          return
        }
      }
    } catch {}

    fetch('/api/model-status')
      .then(r => r.json())
      .then(d => {
        setData(d)
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), payload: d })) } catch {}
      })
      .catch(() => {})
  }, [])

  const percent = data?.geminiPercent ?? 100
  const isMissingKey = !data?.keyPresent

  return (
    <div
      className={`flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono border-2 shadow-xs transition-all ${
        isMissingKey
          ? 'bg-red-100 border-red-300 text-red-900 font-extrabold'
          : percent > 50
          ? 'bg-amber-100 border-amber-300 text-amber-950 font-extrabold'
          : 'bg-orange-100 border-orange-300 text-orange-950 font-extrabold'
      }`}
      title="Trạng thái kết nối Model AI (0 token tiêu tốn)"
    >
      <span className="relative flex h-2 w-2">
        <span className={`relative inline-flex rounded-full h-2 w-2 ${isMissingKey ? 'bg-red-600' : 'bg-emerald-600 animate-pulse'}`}></span>
      </span>
      <span className="font-extrabold">{data?.activeModel || 'gemini-flash-latest'}</span>
      <span className="font-bold border-l-2 border-amber-300 pl-2">
        {isMissingKey ? 'Chưa nhập Key' : `${percent}% Quota`}
      </span>
    </div>
  )
}
