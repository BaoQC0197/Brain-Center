'use client'

import { useEffect, useState } from 'react'
import { UserAccount } from '@/lib/types'

interface AuthModalProps {
  onClose: () => void
  onSuccess: (user: UserAccount) => void
}

export default function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [usersList, setUsersList] = useState<UserAccount[]>([])

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => {
        if (data.users && Array.isArray(data.users)) {
          setUsersList(data.users)
        }
      })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Vui lòng nhập hoặc chọn tài khoản Email đăng nhập!')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Đăng nhập không thành công')

      if (data.user) {
        localStorage.setItem('qa_brain_current_user', JSON.stringify(data.user))
        window.dispatchEvent(new Event('qa_brain_user_changed'))
        onSuccess(data.user)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra')
    }
    setLoading(false)
  }

  function handleQuickAccountSelect(selectedEmail: string) {
    setEmail(selectedEmail)
    const found = usersList.find(u => u.email === selectedEmail)
    if (found) {
      setError('')
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/75 flex items-center justify-center z-50 p-4 sm:p-6 backdrop-blur-sm">
      <div className="bg-white border-2 border-indigo-500 rounded-3xl shadow-2xl p-6 md:p-8 w-full max-w-md space-y-5 text-slate-900">
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3">
          <div>
            <h2 className="font-extrabold text-lg md:text-xl text-slate-900 leading-snug">
              Đăng nhập Hệ thống
            </h2>
            <p className="text-xs font-semibold text-slate-500">Yêu cầu đăng nhập tài khoản nhân sự để sử dụng QA Brain</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-lg font-extrabold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-300 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-rose-500 font-black cursor-pointer">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Account Dropdown Selection from Supabase User Profiles */}
          {usersList.length > 0 && (
            <div className="space-y-1.5 bg-indigo-50/70 border border-indigo-200 p-3.5 rounded-2xl">
              <label className="block text-xs font-black text-indigo-950 uppercase tracking-wide">
                Chọn nhanh Tài khoản Nhân sự (Từ Supabase DB):
              </label>
              <select
                value={email}
                onChange={e => handleQuickAccountSelect(e.target.value)}
                className="w-full bg-white border-2 border-indigo-300 rounded-xl px-3 py-2.5 text-xs md:text-sm font-extrabold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-2xs"
              >
                <option value="">-- Chọn tài khoản nhân sự --</option>
                {usersList.map(u => (
                  <option key={u.id} value={u.email}>
                    {u.fullName} ({u.role} - {u.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold text-slate-900 mb-1">
              Tên đăng nhập / Email <span className="text-rose-600 font-bold">*</span>
            </label>
            <input
              required
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Ví dụ: admin1 hoặc admin1@med.vn..."
              className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-900 mb-1">
              Mật khẩu (Tuỳ chọn)
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-50 border-2 border-slate-300 rounded-xl px-3.5 py-2.5 text-xs md:text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 text-xs md:text-sm font-extrabold transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang xác thực tài khoản...</span>
                </>
              ) : (
                <span>Xác nhận Đăng nhập ➔</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
