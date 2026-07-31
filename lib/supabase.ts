import { createClient, SupabaseClient } from '@supabase/supabase-js'

const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim()
const rawKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  ''
).trim()

const isValidUrl = Boolean(rawUrl && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')))

let client: SupabaseClient | null = null

if (isValidUrl && rawKey) {
  try {
    client = createClient(rawUrl, rawKey)
  } catch (err) {
    console.warn('[supabase] Client init warning:', err)
    client = null
  }
}

export const isSupabaseConfigured = Boolean(client !== null)
export const supabase = client
