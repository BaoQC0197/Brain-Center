import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables from .env.local
const envLocalPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envLocalPath)) {
  const envText = fs.readFileSync(envLocalPath, 'utf-8')
  envText.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*["']?(.*?)["']?\s*$/)
    if (match) {
      const key = match[1]
      const value = match[2]
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  })
}

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim()
const supabaseKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  ''
).trim()

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  console.error('❌ Error: Missing or invalid NEXT_PUBLIC_SUPABASE_URL in .env.local')
  process.exit(1)
}

if (!supabaseKey) {
  console.error('❌ Error: Missing Supabase Key in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function syncArchitecture() {
  console.log('🚀 Syncing newest System Architecture Spec to Supabase global_configs...')
  console.log(`📡 Connecting to Supabase: ${supabaseUrl}`)

  const specPath = path.join(process.cwd(), 'storage', 'qa_brain_architecture_and_clarify_subagent_spec.md')
  if (!fs.existsSync(specPath)) {
    console.error('❌ Spec file not found at:', specPath)
    process.exit(1)
  }

  const specContent = fs.readFileSync(specPath, 'utf-8')

  const { error } = await supabase
    .from('global_configs')
    .upsert({
      key: 'architecture_spec',
      value: specContent,
      updatedAt: new Date().toISOString(),
    })

  if (error) {
    console.error('❌ Failed to update Supabase global_configs:', error.message)
    process.exit(1)
  }

  console.log('✅ Successfully updated Supabase global_configs key "architecture_spec"!')
}

syncArchitecture().catch(err => {
  console.error('Fatal sync error:', err)
  process.exit(1)
})
