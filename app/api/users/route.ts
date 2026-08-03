import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage'

export async function GET() {
  try {
    const users = await storage.getUsers()
    return NextResponse.json({ users })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Có lỗi khi lấy danh sách nhân sự' },
      { status: 500 }
    )
  }
}
