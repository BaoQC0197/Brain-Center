import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage'
import { UserAccount } from '@/lib/types'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
  try {
    const { email, fullName, role, password } = await req.json()

    if (!email || !email.trim() || !fullName || !fullName.trim()) {
      return NextResponse.json({ error: 'Email và Họ tên không được để trống' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const existing = await storage.getUserByEmail(normalizedEmail)
    if (existing) {
      return NextResponse.json({ error: 'Email này đã được đăng ký tài khoản trên hệ thống' }, { status: 400 })
    }

    const newUser: UserAccount & { passwordHash?: string } = {
      id: `usr-${uuidv4().slice(0, 8)}`,
      email: normalizedEmail,
      fullName: fullName.trim(),
      role: role || 'QA Engineer',
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fullName.trim())}`,
      passwordHash: password || 'default_pass',
      createdAt: new Date().toISOString(),
    }

    const user = await storage.createUser(newUser)
    return NextResponse.json({ success: true, user })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Có lỗi khi tạo tài khoản' },
      { status: 500 }
    )
  }
}
