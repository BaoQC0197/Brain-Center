'use client'

import { useEffect, useState } from 'react'
import { UserAccount } from '@/lib/types'

export default function HeaderUserBadge() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null)

  function loadUser() {
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
  }

  useEffect(() => {
    loadUser()

    const handleStorageChange = () => loadUser()
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('qa_brain_user_changed', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('qa_brain_user_changed', handleStorageChange)
    }
  }, [])

  function handleLogout() {
    localStorage.removeItem('qa_brain_current_user')
    setCurrentUser(null)
    window.dispatchEvent(new Event('qa_brain_user_changed'))
  }

  if (!currentUser) {
    return (
      <button
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent('open_login_modal'))}
        className="text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-400 px-3.5 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
      >
        <span>🔑</span>
        <span>Đăng nhập</span>
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2.5 bg-slate-800/90 border border-indigo-400/40 px-3 py-1 rounded-xl text-white font-mono text-xs shadow-xs shrink-0">
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
        className="ml-1 text-[11px] bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-700/50 hover:border-rose-500 px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer"
        title="Đăng xuất tài khoản"
      >
        Đăng xuất
      </button>
    </div>
  )
}
