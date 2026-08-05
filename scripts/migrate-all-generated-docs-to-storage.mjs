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

async function migrateGeneratedDocsToStorage() {
  console.log('🚀 Starting migration of ALL Generated HTML Documents to Supabase Storage Bucket...')
  console.log(`📡 Connecting to Supabase: ${supabaseUrl}\n`)

  const { data: genDocs, error: fetchErr } = await supabase
    .from('generated_documents')
    .select('*')

  if (fetchErr) {
    console.error('❌ Failed to fetch generated_documents from DB:', fetchErr.message)
    process.exit(1)
  }

  console.log(`📄 Found ${genDocs?.length || 0} generated documents in DB...`)

  let successCount = 0
  let skippedCount = 0

  for (const doc of genDocs || []) {
    if (doc.fileUrl) {
      console.log(`⏭️ Doc "${doc.inputSummary || doc.id}" already has fileUrl: ${doc.fileUrl}`)
      skippedCount++
      continue
    }

    let rawContent = doc.content
    if (rawContent && typeof rawContent === 'object' && 'rawText' in rawContent && typeof rawContent.rawText === 'string') {
      rawContent = rawContent.rawText
    }

    const markdownText = typeof rawContent === 'string'
      ? rawContent
      : typeof rawContent === 'object'
      ? JSON.stringify(rawContent, null, 2)
      : String(rawContent ?? '')

    const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${doc.inputSummary || doc.type} — Brain Center</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 40px; line-height: 1.6; }
    .container { max-width: 960px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 40px; border: 1px solid #e2e8f0; }
    h1, h2, h3 { color: #0f172a; }
    pre { background: #f1f5f9; padding: 16px; border-radius: 8px; overflow-x: auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${doc.inputSummary || doc.type}</h1>
    <pre>${markdownText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
  </div>
</body>
</html>`

    const bufferToUpload = Buffer.from(htmlContent, 'utf-8')
    const storagePath = `${doc.projectId}/generated-${doc.id}.html`

    console.log(`⬆️ Uploading HTML for "${doc.inputSummary || doc.id}" to Storage: ${storagePath}...`)
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('raw-documents')
      .upload(storagePath, bufferToUpload, {
        contentType: 'text/html; charset=utf-8',
        upsert: true,
      })

    if (uploadErr) {
      console.error(`❌ Upload failed for "${doc.id}":`, uploadErr.message)
      continue
    }

    const { data: pubUrlData } = supabase.storage
      .from('raw-documents')
      .getPublicUrl(storagePath)

    const publicUrl = pubUrlData?.publicUrl
    if (publicUrl) {
      console.log(`✅ Uploaded HTML! File URL: ${publicUrl}`)
      const { error: updateErr } = await supabase
        .from('generated_documents')
        .update({ fileUrl: publicUrl })
        .eq('id', doc.id)

      if (updateErr) {
        console.log(`⚠️ DB update notice for "${doc.id}":`, updateErr.message)
      } else {
        console.log(`🎉 Updated DB record for "${doc.id}"`)
      }
      successCount++
    }
  }

  console.log('\n==================================================')
  console.log(`✨ Migration Complete! Processed ${successCount} generated HTML documents to Supabase Storage. (Skipped: ${skippedCount})`)
  console.log('==================================================\n')
}

migrateGeneratedDocsToStorage().catch(err => {
  console.error('Fatal Migration Error:', err)
  process.exit(1)
})
