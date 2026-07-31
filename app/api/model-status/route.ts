import { NextResponse } from 'next/server'

interface QuotaBucket {
  bucketId: string
  displayName: string
  description?: string
  window: string
  remainingFraction: number
  resetTime?: string
}

interface QuotaGroup {
  displayName: string
  description?: string
  buckets: QuotaBucket[]
}

export async function GET() {
  const lsAddress = process.env.ANTIGRAVITY_LS_ADDRESS
  const csrfToken = process.env.ANTIGRAVITY_CSRF_TOKEN
  const activeModel = process.env.GEMINI_MODEL || 'gemini-flash-latest'
  const keyPresent = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim()

  // Read local Antigravity Language Server Quota (0 LLM token consumption)
  if (lsAddress && csrfToken) {
    try {
      const res = await fetch(`http://${lsAddress}/exa.language_server_pb.LanguageServerService/RetrieveUserQuotaSummary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-codeium-csrf-token': csrfToken,
        },
        body: JSON.stringify({}),
        cache: 'no-store',
      })

      if (res.ok) {
        const data = await res.json()
        const groups: QuotaGroup[] = data?.response?.groups || []

        let gemini5hFraction = 1
        let geminiWeeklyFraction = 1
        let geminiResetTime = ''

        for (const g of groups) {
          for (const b of g.buckets || []) {
            if (b.bucketId === 'gemini-5h') {
              gemini5hFraction = b.remainingFraction ?? 1
              geminiResetTime = b.resetTime || ''
            } else if (b.bucketId === 'gemini-weekly') {
              geminiWeeklyFraction = b.remainingFraction ?? 1
            }
          }
        }

        const geminiPercent = Math.round(gemini5hFraction * 100)

        return NextResponse.json({
          source: 'antigravity_ls',
          keyPresent: true,
          activeModel,
          activeModelHealthy: geminiPercent > 5,
          geminiPercent,
          geminiResetTime,
          groups,
          tokenCost: 0, // 0 tokens consumed
        })
      }
    } catch {
      // Ignore if LS is not reachable
    }
  }

  // Pure static fallback — NO LLM call, 0 tokens consumed
  return NextResponse.json({
    source: 'static',
    keyPresent,
    activeModel,
    activeModelHealthy: true,
    geminiPercent: 100,
    tokenCost: 0,
  })
}
