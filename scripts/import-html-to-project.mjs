import fs from 'fs'
import path from 'path'
import { storage } from '../lib/storage.js'
import { v4 as uuidv4 } from 'uuid'

async function importHtml() {
  const args = process.argv.slice(2)
  if (args.length < 2) {
    console.log('Usage: node scripts/import-html-to-project.mjs <projectId> <filePath> [docType] [inputSummary]')
    process.exit(1)
  }

  const projectId = args[0]
  const filePath = args[1]
  const docType = args[2] || 'test-cases'
  const summary = args[3] || path.basename(filePath)

  if (!fs.existsSync(filePath)) {
    console.error('File not found:', filePath)
    process.exit(1)
  }

  const htmlContent = fs.readFileSync(filePath, 'utf-8')
  console.log(`Reading HTML file (${htmlContent.length} bytes)...`)

  const doc = {
    id: uuidv4(),
    projectId,
    type: docType,
    inputType: 'text',
    inputSummary: summary,
    version: 1,
    createdAt: new Date().toISOString(),
    content: htmlContent,
  }

  await storage.saveDocument(doc)
  console.log(`Successfully imported HTML document into project [${projectId}]!`)
  console.log(`Document ID: ${doc.id}`)
}

importHtml().catch(console.error)
