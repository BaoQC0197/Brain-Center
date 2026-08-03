'use client'

import { useEffect, useState } from 'react'
import { UserAccount } from '@/lib/types'
import ModelStatusBadge from './ModelStatusBadge'

export default function AppAuthGuard({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)

  // Login form state
  const [usersList, setUsersList] = useState<UserAccount[]>([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')

  function loadUserSession() {
    try {
      const stored = localStorage.getItem('qa_brain_current_user')
      if (stored) {
        setCurrentUser(JSON.parse(stored))
      } else {
        setCurrentUser(null)
      }
    } catch {
      setCurrentUser(null)
    }
    setLoadingSession(false)
  }

  function fetchUsersList() {
    fetch('/api/users')
      .then(r => r.json())
      .then(d => {
        if (d.users && Array.isArray(d.users)) {
          setUsersList(d.users)
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    loadUserSession()
    fetchUsersList()

    const handleUserChanged = () => loadUserSession()
    window.addEventListener('storage', handleUserChanged)
    window.addEventListener('qa_brain_user_changed', handleUserChanged)

    return () => {
      window.removeEventListener('storage', handleUserChanged)
      window.removeEventListener('qa_brain_user_changed', handleUserChanged)
    }
  }, [])

  async function handleLoginSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setLoginError('Vui lòng chọn hoặc nhập Email đăng nhập!')
      return
    }
    setLoginError('')
    setLoginLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại')

      if (data.user) {
        localStorage.setItem('qa_brain_current_user', JSON.stringify(data.user))
        setCurrentUser(data.user)
        window.dispatchEvent(new Event('qa_brain_user_changed'))
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi đăng nhập')
    }
    setLoginLoading(false)
  }

  function handleLogout() {
    localStorage.removeItem('qa_brain_current_user')
    setCurrentUser(null)
    window.dispatchEvent(new Event('qa_brain_user_changed'))
  }

  // Prevent flash during initial hydration check
  if (loadingSession) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-mono text-sm">
        <div className="flex items-center gap-3">
          <span className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <span>Kiểm tra phiên đăng nhập QA Brain Center...</span>
        </div>
      </div>
    )
  }

  // ── 1. FULL-SCREEN LOGIN SCREEN (Unauthenticated State) ─────────────────
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 sm:p-12 relative selection:bg-indigo-600 selection:text-white">
        {/* Background glow accents */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-xl relative z-10 space-y-8">
          {/* Header Branding */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-3 bg-slate-900 border-2 border-indigo-500/60 px-6 py-3 rounded-2xl shadow-2xl">
              <span className="bg-indigo-600 text-white text-sm font-mono font-extrabold px-3 py-1.5 rounded-xl">QA</span>
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">Brain Center</span>
            </div>
            <p className="text-sm sm:text-base text-indigo-200 font-mono font-extrabold tracking-wide">
              Trung tâm Lưu trữ Tri thức & Trợ lý Kiểm thử (ISTQB Standard)
            </p>
          </div>

          {/* Login Card (Spacious & Clean UI) */}
          <div className="bg-slate-900/95 border-2 border-indigo-500/50 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-8 backdrop-blur-xl">
            <div className="border-b border-slate-800 pb-5 text-center space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Đăng nhập Hệ thống
              </h2>
              <p className="text-sm text-slate-300 font-medium">
                Vui lòng đăng nhập tài khoản nhân sự để truy cập hệ thống
              </p>
            </div>

            {loginError && (
              <div className="bg-rose-950/90 border-2 border-rose-600/80 text-rose-100 px-5 py-3.5 rounded-2xl text-sm font-extrabold flex items-center justify-between shadow-lg">
                <span>{loginError}</span>
                <button type="button" onClick={() => setLoginError('')} className="text-rose-400 font-black hover:text-white">✕</button>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-6 text-left">
              {/* Quick Select dropdown from Supabase User Profiles */}
              {usersList.length > 0 && (
                <div className="space-y-2 bg-indigo-950/60 border-2 border-indigo-500/40 p-4 rounded-2xl">
                  <label className="block text-xs sm:text-sm font-black text-indigo-200 uppercase tracking-wide">
                    Chọn nhanh Tài khoản Nhân sự (Supabase DB):
                  </label>
                  <select
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value)
                      setLoginError('')
                    }}
                    className="w-full bg-slate-950 border-2 border-indigo-500/50 rounded-xl px-4 py-3.5 text-sm sm:text-base font-extrabold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-inner"
                  >
                    <option value="">-- Chọn tài khoản --</option>
                    {usersList.map(u => (
                      <option key={u.id} value={u.email}>
                        {u.fullName} ({u.role} - {u.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm sm:text-base font-extrabold text-slate-200 mb-2">
                  Tên đăng nhập / Email <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Nhập tên đăng nhập hoặc email..."
                  className="w-full bg-slate-950 border-2 border-slate-700/80 rounded-2xl px-5 py-4 text-base sm:text-lg text-white font-semibold placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm sm:text-base font-extrabold text-slate-200 mb-2">
                  Mật khẩu (Tuỳ chọn)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border-2 border-slate-700/80 rounded-2xl px-5 py-4 text-base sm:text-lg text-white font-semibold placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl py-4 text-base sm:text-lg font-extrabold transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
                >
                  {loginLoading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang xác thực...</span>
                    </>
                  ) : (
                    <span>Xác nhận Đăng nhập vào Hệ thống</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="text-center font-mono text-xs text-slate-400 font-bold">
            Internal EZG Standard v1.0 • Protected Enterprise QA Center
          </div>
        </div>
      </div>
    )
  }

  // ── 2. FULL APP LAYOUT (Authenticated State) ─────────────────────────────
  return (
    <>
      <nav className="bg-slate-900 border-b-2 border-indigo-500 px-6 sm:px-10 py-3.5 flex items-center justify-between sticky top-0 z-40 shadow-md text-white">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-2.5 font-extrabold text-white text-lg hover:text-indigo-300 transition-colors">
            <span className="bg-indigo-600 text-white text-xs font-mono font-extrabold px-2.5 py-1 rounded-lg shadow-xs">QA</span>
            <span>Brain Center</span>
          </a>
          <span className="text-slate-700 font-bold">|</span>
          <span className="text-xs text-indigo-200 font-mono font-bold hidden sm:inline-block">Trung tâm Lưu trữ & Trợ lý Kiểm thử (ISTQB Standard)</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/configs"
            className="text-xs font-extrabold text-indigo-100 hover:text-white bg-slate-800 hover:bg-slate-700 border-2 border-indigo-500/40 px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
          >
            System Instructions
          </a>
          <ModelStatusBadge />

          {/* User Profile Badge & Logout Button ONLY (NO Login button) */}
          <div className="flex items-center gap-2 bg-slate-800/90 border border-indigo-400/50 px-3 py-1.5 rounded-xl text-white font-mono text-xs shadow-xs">
            <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-black text-[11px] shrink-0">
              {currentUser.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col text-left leading-tight">
              <span className="font-extrabold text-xs text-white truncate max-w-[140px]">{currentUser.fullName}</span>
              <span className="text-[10px] text-indigo-300 font-semibold">{currentUser.role}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="ml-1 text-[11px] bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-700/60 hover:border-rose-500 px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer"
              title="Đăng xuất khỏi hệ thống"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1700px] mx-auto px-6 sm:px-10 py-8">{children}</main>
    </>
  )
}
