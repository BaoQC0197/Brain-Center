import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

import { normalizeModelName } from '@/lib/claude'

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''
const genAI = new GoogleGenerativeAI(apiKey)

export async function POST(request: Request) {
  try {
    const { audioBase64, audioMime = 'audio/webm' } = await request.json()

    if (!audioBase64) {
      return NextResponse.json({ error: 'Thiếu dữ liệu file ghi âm (audioBase64)' }, { status: 400 })
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'Chưa cấu hình GEMINI_API_KEY trong hệ thống' }, { status: 500 })
    }

    // Clean data URL prefix if present
    const base64Data = audioBase64.includes('base64,')
      ? audioBase64.split('base64,')[1]
      : audioBase64

    const rawModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    const modelName = normalizeModelName(rawModel)
    const model = genAI.getGenerativeModel({ model: modelName })

    const prompt = `Bạn là trợ lý BA / QA chuyên nghiệp. Hãy lắng nghe toàn bộ file ghi âm cuộc họp này và thực hiện 2 việc:
1. **TRANSCRIPT CHI TIẾT (VĂN BẢN BÓC TÁCH TỪ GHI ÂM)**: Chuyển đổi toàn bộ nội dung lời nói trong file audio thành văn bản Tiếng Việt chuẩn xác, phân dòng rõ ràng theo diễn biến cuộc họp.
2. **TÓM TẮT THỐNG NHẤT NGHIỆP VỤ & QUY TẮC CỐT LÕI (KEY BUSINESS DECISIONS)**: Liệt kê các quyết định nghiệp vụ chính, luồng tính năng được chốt, và các điểm cần lưu ý.

Định dạng đầu ra Markdown đẹp mắt với thẻ Alert (> [!NOTE], > [!IMPORTANT]) để phục vụ làm tài liệu tham chiếu nghiệp vụ kiểm thử.`

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType: audioMime,
          data: base64Data,
        },
      },
      prompt,
    ])

    const textContent = result.response.text()
    return NextResponse.json({ textContent })
  } catch (err: any) {
    console.error('Audio transcription error:', err)
    return NextResponse.json({ error: err.message || 'Lỗi bóc tách văn bản từ file ghi âm' }, { status: 500 })
  }
}
