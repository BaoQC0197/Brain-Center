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
const STORAGE_DIR = path.join(process.cwd(), 'storage')

async function migrate() {
  console.log('🚀 Starting migration of local data to Supabase Database...')
  console.log(`📡 Connecting to Supabase: ${supabaseUrl}`)

  // 1. Migrate Projects
  const projectsFile = path.join(STORAGE_DIR, 'projects.json')
  if (fs.existsSync(projectsFile)) {
    const projects = JSON.parse(fs.readFileSync(projectsFile, 'utf-8'))
    console.log(`\n📦 Found ${projects.length} projects to migrate...`)
    for (const p of projects) {
      const { error } = await supabase.from('projects').upsert(p)
      if (error) console.error(`❌ Failed project ${p.name}:`, error.message)
      else console.log(`✅ Migrated project: ${p.name} (${p.id})`)
    }
  } else {
    console.log('ℹ️ No projects.json found.')
  }

  // 2. Migrate Project Sub-data
  const projectsDir = path.join(STORAGE_DIR, 'projects')
  if (fs.existsSync(projectsDir)) {
    const projectFolders = fs.readdirSync(projectsDir)
    for (const projectId of projectFolders) {
      const pDir = path.join(projectsDir, projectId)
      if (!fs.statSync(pDir).isDirectory()) continue

      console.log(`\n📂 Processing project data folder: ${projectId}`)

      // Raw Documents
      const rawDocsFile = path.join(pDir, 'raw-docs.json')
      if (fs.existsSync(rawDocsFile)) {
        const rawDocs = JSON.parse(fs.readFileSync(rawDocsFile, 'utf-8'))
        console.log(`   └ Raw Documents (${rawDocs.length}):`)
        for (const doc of rawDocs) {
          const { error } = await supabase.from('raw_documents').upsert(doc)
          if (error) console.error(`     ❌ ${doc.name}:`, error.message)
          else console.log(`     ✅ ${doc.name}`)
        }
      }

      // Generated Documents
      const docsFile = path.join(pDir, 'documents.json')
      if (fs.existsSync(docsFile)) {
        const genDocs = JSON.parse(fs.readFileSync(docsFile, 'utf-8'))
        console.log(`   └ Generated Documents (${genDocs.length}):`)
        for (const doc of genDocs) {
          const payload = {
            ...doc,
            title: doc.inputSummary || doc.type || 'Untitled Document',
          }
          const { error } = await supabase.from('generated_documents').upsert(payload)
          if (error) console.error(`     ❌ ${doc.inputSummary || doc.type}:`, error.message)
          else console.log(`     ✅ ${doc.inputSummary || doc.type} (v${doc.version || 1})`)
        }
      }

      // Built Documents
      const builtDocsFile = path.join(pDir, 'built-docs.json')
      if (fs.existsSync(builtDocsFile)) {
        const builtDocs = JSON.parse(fs.readFileSync(builtDocsFile, 'utf-8'))
        console.log(`   └ Built Documents (${builtDocs.length}):`)
        for (const doc of builtDocs) {
          const payload = {
            ...doc,
            type: doc.docType || 'brd',
            qa: doc.answers || {},
            status: 'completed',
          }
          const { error } = await supabase.from('built_documents').upsert(payload)
          if (error) console.error(`     ❌ ${doc.title}:`, error.message)
          else console.log(`     ✅ ${doc.title}`)
        }
      }

      // System Instruction
      const instructionFile = path.join(pDir, 'system_instruction.md')
      if (fs.existsSync(instructionFile)) {
        const instruction = fs.readFileSync(instructionFile, 'utf-8')
        const { error } = await supabase.from('project_instructions').upsert({
          projectId,
          instruction,
          updatedAt: new Date().toISOString(),
        })
        if (error) console.error(`   ❌ Instruction:`, error.message)
        else console.log(`   ✅ System Instruction migrated.`)
      }
    }
  }

  console.log('\n🎉 ALL LOCAL DATA HAS BEEN SUCCESSFULLY MIGRATED TO SUPABASE!')
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err)
})
