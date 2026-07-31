import { NextResponse } from 'next/server'
import { configStorage } from '@/lib/config-storage'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const configs = await configStorage.getAllConfigs()
    return NextResponse.json({ configs }, { status: 200 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi lấy cấu hình hệ thống'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { taskKey, content, action } = body as {
      taskKey: string
      content?: string
      action?: 'save' | 'reset'
    }

    if (!taskKey) {
      return NextResponse.json({ error: 'Thiếu taskKey' }, { status: 400 })
    }

    if (action === 'reset') {
      const resetContent = await configStorage.resetConfigToDefault(taskKey)
      return NextResponse.json({ success: true, taskKey, content: resetContent }, { status: 200 })
    }

    if (content === undefined || content === null) {
      return NextResponse.json({ error: 'Nội dung không được để trống' }, { status: 400 })
    }

    if (taskKey === 'system_instruction') {
      await configStorage.saveGlobalSystemInstruction(content)
    } else {
      await configStorage.saveTaskPrompt(taskKey, content)
    }

    return NextResponse.json({ success: true, taskKey, content }, { status: 200 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi lưu cấu hình'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
