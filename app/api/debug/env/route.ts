import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: url
      ? `✅ Set (${url.slice(0, 30)}...)`
      : '❌ NOT SET',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey
      ? `✅ Set (${anonKey.slice(0, 20)}...)`
      : '❌ NOT SET',
    SUPABASE_SERVICE_ROLE_KEY: serviceKey
      ? `✅ Set (${serviceKey.slice(0, 20)}...)`
      : '❌ NOT SET',
    isSupabaseReady: !!(url && (anonKey || serviceKey)),
  })
}
