import { configStorage } from '../lib/config-storage'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

async function migrateSystemInstruction() {
  console.log('🚀 Starting System Instruction & Global Configs migration to Supabase...')

  if (!isSupabaseConfigured || !supabase) {
    console.error('❌ Supabase is not configured in environment variables.')
    process.exit(1)
  }

  try {
    const sysInstruction = await configStorage.getGlobalSystemInstruction()
    console.log(`📄 Found local System Instruction (${sysInstruction.length} chars). Syncing...`)

    const { error: sysError } = await supabase.from('global_configs').upsert({
      key: 'system_instruction',
      value: sysInstruction,
      updatedAt: new Date().toISOString(),
    })

    if (sysError) {
      console.error('❌ Failed to migrate system_instruction:', sysError)
    } else {
      console.log('✅ System Instruction migrated successfully!')
    }

    const allConfigs = await configStorage.getAllConfigs()
    for (const [key, config] of Object.entries(allConfigs)) {
      if (key === 'system_instruction') continue
      const { error } = await supabase.from('global_configs').upsert({
        key,
        value: config.content,
        updatedAt: new Date().toISOString(),
      })
      if (error) {
        console.error(`❌ Failed to migrate config ${key}:`, error)
      } else {
        console.log(`✅ Config [${key}] synced successfully.`)
      }
    }

    // Sync architecture spec
    try {
      const fs = await import('fs')
      const path = await import('path')
      const specPath = path.join(process.cwd(), 'storage', 'qa_brain_architecture_and_clarify_subagent_spec.md')
      if (fs.existsSync(specPath)) {
        const specContent = fs.readFileSync(specPath, 'utf-8')
        await supabase.from('global_configs').upsert({
          key: 'architecture_spec',
          value: specContent,
          updatedAt: new Date().toISOString(),
        })
        console.log('✅ Architecture Spec synced successfully!')
      }
    } catch (e) {}

    console.log('🎉 ALL SYSTEM INSTRUCTIONS AND CONFIGS MIGRATED SUCCESSFULLY!')
  } catch (err) {
    console.error('❌ Migration failed:', err)
  }
}

migrateSystemInstruction()
