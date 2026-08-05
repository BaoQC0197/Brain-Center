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

async function migrateDocsToStorage() {
  console.log('🚀 Starting migration of existing Raw Documents to Supabase Storage Bucket...')
  console.log(`📡 Connecting to Supabase: ${supabaseUrl}\n`)

  // 1. Ensure storage bucket exists
  const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
  let targetBucket = buckets?.find(b => b.name === 'raw-documents')

  if (!targetBucket) {
    console.log('📦 Bucket "raw-documents" does not exist yet. Attempting auto-creation...')
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('raw-documents', {
      public: true,
    })
    if (createError) {
      console.error('⚠️ Could not auto-create bucket via API:', createError.message)
      console.log('👉 Please create "raw-documents" bucket as Public on Supabase Dashboard: https://supabase.com/dashboard/project/_/storage/buckets')
    } else {
      console.log('✅ Bucket "raw-documents" created successfully.')
    }
  } else {
    console.log('✅ Bucket "raw-documents" found.')
  }

  // 2. Fetch all raw documents from database
  const { data: rawDocs, error: fetchErr } = await supabase
    .from('raw_documents')
    .select('*')

  if (fetchErr) {
    console.error('❌ Failed to fetch raw_documents from DB:', fetchErr.message)
    process.exit(1)
  }

  console.log(`\n📄 Found ${rawDocs?.length || 0} raw documents in Supabase DB...`)

  let successCount = 0
  let skippedCount = 0

  for (const doc of rawDocs || []) {
    if (doc.fileUrl) {
      console.log(`⏭️ Doc "${doc.name}" (${doc.id}) already has fileUrl: ${doc.fileUrl}`)
      skippedCount++
      continue
    }

    let bufferToUpload = null
    let fileNameToUse = doc.name || 'document'
    let mimeType = 'text/plain'
    let extension = 'txt'

    if (doc.imageBase64) {
      const cleanBase64 = doc.imageBase64.replace(/^data:image\/\w+;base64,/, '')
      bufferToUpload = Buffer.from(cleanBase64, 'base64')
      mimeType = doc.imageMime || 'image/png'
      extension = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : 'png'
      fileNameToUse += `.${extension}`
    } else if (doc.audioBase64) {
      const cleanBase64 = doc.audioBase64.replace(/^data:audio\/\w+;base64,/, '')
      bufferToUpload = Buffer.from(cleanBase64, 'base64')
      mimeType = doc.audioMime || 'audio/webm'
      extension = mimeType.includes('mp3') ? 'mp3' : 'webm'
      fileNameToUse += `.${extension}`
    } else if (doc.textContent && doc.textContent.trim()) {
      bufferToUpload = Buffer.from(doc.textContent, 'utf-8')
      mimeType = 'text/markdown; charset=utf-8'
      extension = 'md'
      fileNameToUse += '.md'
    }

    if (!bufferToUpload) {
      console.log(`ℹ️ Doc "${doc.name}" (${doc.id}) has no file content to migrate.`)
      skippedCount++
      continue
    }

    const storagePath = `${doc.projectId}/${doc.id}-${fileNameToUse.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    console.log(`⬆️ Uploading file for "${doc.name}" to Storage path: ${storagePath}...`)
    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('raw-documents')
      .upload(storagePath, bufferToUpload, {
        contentType: mimeType,
        upsert: true,
      })

    if (uploadErr) {
      console.error(`❌ Upload failed for "${doc.name}":`, uploadErr.message)
      continue
    }

    const { data: pubUrlData } = supabase.storage
      .from('raw-documents')
      .getPublicUrl(storagePath)

    const publicUrl = pubUrlData?.publicUrl
    if (publicUrl) {
      console.log(`✅ Uploaded! File URL: ${publicUrl}`)
      const { error: updateErr } = await supabase
        .from('raw_documents')
        .update({ fileUrl: publicUrl })
        .eq('id', doc.id)

      if (updateErr) {
        console.error(`⚠️ Failed to update DB record for "${doc.name}":`, updateErr.message)
      } else {
        console.log(`🎉 Updated DB record for "${doc.name}"`)
        successCount++
      }
    }
  }

  console.log('\n==================================================')
  console.log(`✨ Migration Complete! Successfully migrated ${successCount} documents to Supabase Storage. (Skipped: ${skippedCount})`)
  console.log('==================================================\n')
}

migrateDocsToStorage().catch(err => {
  console.error('Fatal Migration Error:', err)
  process.exit(1)
})
