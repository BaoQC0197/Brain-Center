import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()

  const envInfo = {
    NEXT_PUBLIC_SUPABASE_URL: url ? `✅ ${url}` : '❌ NOT SET',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey ? `✅ (${anonKey.slice(0, 30)}...)` : '❌ NOT SET',
    SUPABASE_SERVICE_ROLE_KEY: serviceKey ? `✅ (${serviceKey.slice(0, 30)}...)` : '❌ NOT SET',
    isSupabaseReady: !!(url && (anonKey || serviceKey)),
  }

  // Try live DB query
  let dbTest: Record<string, unknown> = { status: 'skipped - Supabase not configured' }

  if (url && url.startsWith('http') && (serviceKey || anonKey)) {
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const client = createClient(url, serviceKey || anonKey)
      const { data, error, count } = await client
        .from('projects')
        .select('id, name, "createdAt"', { count: 'exact' })
        .limit(10)

      if (error) {
        dbTest = { status: '❌ Query failed', error: error.message, code: error.code }
      } else {
        dbTest = {
          status: '✅ Connected successfully',
          projectCount: count,
          projects: data?.map(p => ({ id: p.id, name: p.name })) ?? [],
        }
      }
    } catch (err: unknown) {
      dbTest = { status: '❌ Exception', error: err instanceof Error ? err.message : String(err) }
    }
  }

  return NextResponse.json({ env: envInfo, dbTest })
}
