import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'Vui lòng nhập Email đăng nhập' }, { status: 400 })
    }

    if (!password || !password.trim()) {
      return NextResponse.json({ error: 'Vui lòng nhập Mật khẩu đăng nhập' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = await storage.getUserByEmail(normalizedEmail)

    if (!user) {
      return NextResponse.json({ error: 'Tài khoản chưa tồn tại trên hệ thống Supabase DB!' }, { status: 404 })
    }

    if (user.passwordHash && user.passwordHash.trim() !== password.trim()) {
      return NextResponse.json({ error: 'Mật khẩu đăng nhập không chính xác!' }, { status: 401 })
    }

    const { passwordHash, ...cleanUser } = user
    return NextResponse.json({ success: true, user: cleanUser })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Có lỗi khi đăng nhập' },
      { status: 500 }
    )
  }
}
