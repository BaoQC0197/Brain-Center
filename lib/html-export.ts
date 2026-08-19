import { marked } from 'marked'
import { TestCase, GeneratedDocument, TestPlan } from './types'

// Helper maps for clean badges & labels
const DOC_TYPE_LABEL: Record<string, string> = {
  'review-requirement': 'Review Requirement Report',
  'acceptance-criteria': 'Acceptance Criteria Specification',
  'test-strategy': 'Test Strategy Document',
  'test-plan': 'Master Test Plan',
  'test-scenario': 'Test Scenarios Suite',
  'test-cases': 'Test Cases Suite',
  'regression-checklist': 'Regression Test Checklist',
  'test-report': 'Test Execution Summary Report',
  'brd': 'Business Requirements Document (BRD)',
  'srs': 'Software Requirements Specification (SRS)',
  'user-story': 'User Stories và Acceptance Criteria',
}

// ─── SAFE DATA NORMALIZERS (Prevents JSON dumps, [object Object] & undefined) ─

function safeStr(val: any, fallback: string = ''): string {
  if (val === null || val === undefined) return fallback
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      return val.map(i => safeStr(i)).filter(Boolean).join(', ')
    }
    const preferredKeys = ['description', 'text', 'summary', 'name', 'title', 'feature', 'goal', 'risk', 'item', 'overview', 'details', 'value']
    for (const key of preferredKeys) {
      if (val[key] && typeof val[key] === 'string') return val[key]
    }
    const extracted: string[] = []
    for (const [k, v] of Object.entries(val)) {
      if (typeof v === 'string') extracted.push(`**${k}:** ${v}`)
      else if (Array.isArray(v)) extracted.push(`**${k}:**\n` + v.map(item => `- ${safeStr(item)}`).join('\n'))
    }
    if (extracted.length > 0) return extracted.join('\n\n')
  }
  return fallback
}

function safeList(val: any): string[] {
  if (!val) return []
  if (Array.isArray(val)) {
    return val.map(item => safeStr(item)).filter(Boolean)
  }
  if (typeof val === 'string') {
    return val.split('\n').map(s => s.replace(/^[-*•]\s*/, '').trim()).filter(Boolean)
  }
  if (typeof val === 'object') {
    return Object.values(val).map(item => safeStr(item)).filter(Boolean)
  }
  return []
}

function safeScope(val: any, plan: any): { description: string; inScope: string[]; outOfScope: string[] } {
  let description = ''
  let inScope: string[] = []
  let outOfScope: string[] = []

  if (typeof val === 'string') {
    description = val
  } else if (typeof val === 'object' && val !== null) {
    if (val.description || val.text || val.summary || val.overview) {
      description = safeStr(val.description || val.text || val.summary || val.overview)
    }
    if (val.in_scope || val.inScope || val.featuresToTest) {
      inScope = safeList(val.in_scope || val.inScope || val.featuresToTest)
    }
    if (val.out_of_scope || val.outOfScope || val.featuresToSkip) {
      outOfScope = safeList(val.out_of_scope || val.outOfScope || val.featuresToSkip)
    }
  }

  if (inScope.length === 0) {
    inScope = safeList(plan.featuresToTest || plan.features_to_test || plan.inScope || plan.in_scope)
  }
  if (outOfScope.length === 0) {
    outOfScope = safeList(plan.featuresToSkip || plan.features_to_skip || plan.outOfScope || plan.out_of_scope)
  }

  return { description, inScope, outOfScope }
}

function safeRisks(val: any): { risk: string; impact: string; mitigation: string }[] {
  if (!val) return []
  if (Array.isArray(val)) {
    return val.map(r => {
      if (typeof r === 'string') return { risk: r, impact: 'Trung bình', mitigation: 'Theo dõi & quản lý' }
      if (typeof r === 'object' && r !== null) {
        return {
          risk: safeStr(r.risk || r.name || r.title || r.description || r.item, 'Rủi ro chưa xác định'),
          impact: safeStr(r.impact || r.level || r.severity, 'Trung bình'),
          mitigation: safeStr(r.mitigation || r.solution || r.prevention || r.action, 'Cần có kế hoạch dự phòng'),
        }
      }
      return { risk: String(r), impact: 'Trung bình', mitigation: 'Theo dõi' }
    })
  }
  return []
}

function safeEntryExit(val: any): { entry: string[]; exit: string[] } {
  if (!val) return { entry: [], exit: [] }
  if (typeof val === 'object' && !Array.isArray(val)) {
    return {
      entry: safeList(val.entry || val.entryCriteria || val.entry_criteria || val.input),
      exit: safeList(val.exit || val.exitCriteria || val.exit_criteria || val.output),
    }
  }
  if (Array.isArray(val)) {
    const entry: string[] = []
    const exit: string[] = []
    val.forEach(item => {
      const str = safeStr(item)
      if (str.toLowerCase().includes('entry') || str.toLowerCase().includes('bắt đầu')) entry.push(str)
      else exit.push(str)
    })
    return { entry, exit }
  }
  return { entry: [], exit: [] }
}

// ─── TEST PLAN JSON TO MARKDOWN CONVERTER ────────────────────────────────────

export function formatTestPlanToMarkdown(content: any): string {
  if (!content) return '# Master Test Plan\n\nKhông có nội dung đặc tả.'
  
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content)
      if (typeof parsed === 'object' && parsed !== null) {
        return formatTestPlanToMarkdown(parsed)
      }
    } catch {}
    return content // Already markdown text
  }

  const plan = content as any
  const title = safeStr(plan.title || plan.name, 'Master Test Plan')
  const scopeData = safeScope(plan.scope || plan.test_scope || plan.testing_scope, plan)
  const testStrategy = safeStr(plan.testStrategy || plan.test_strategy || plan.strategy, 'Theo quy trình kiểm thử chuẩn')
  const testEnv = safeStr(plan.testEnvironment || plan.test_environment || plan.environment, 'Môi trường Staging / Testing')
  const schedule = safeStr(plan.schedule || plan.timeline || plan.schedules, 'Theo tiến độ Sprint / Release')
  const objectives = safeList(plan.objectives || plan.goals || plan.targets)
  const testTypes = safeList(plan.testTypes || plan.test_types || plan.types)
  const criteria = safeEntryExit(plan.entryExitCriteria || plan.entry_exit_criteria || plan.criteria)
  const risks = safeRisks(plan.risks || plan.risk_management || plan.riskManagement)
  const resources = safeList(plan.resources || plan.team || plan.human_resources)

  let md = `# ${title}\n\n`

  md += `## 1. Phạm vi kiểm thử (Scope)\n`
  if (scopeData.description) {
    md += `${scopeData.description}\n\n`
  }

  md += `## 2. Mục tiêu kiểm thử (Objectives)\n`
  if (objectives.length > 0) {
    objectives.forEach(o => { md += `- ${o}\n` })
  } else {
    md += `- Đảm bảo chất lượng hệ thống và độ tin cậy của các luồng nghiệp vụ chính.\n`
  }
  md += `\n`

  md += `## 3. Chiến lược Kiểm thử (Test Strategy)\n${testStrategy}\n\n`
  if (testTypes.length > 0) {
    md += `**Các loại hình kiểm thử áp dụng:** ${testTypes.map(t => `\`${t}\``).join(', ')}\n\n`
  }

  md += `## 4. Chi tiết phạm vi tính năng\n`
  if (scopeData.inScope.length > 0) {
    md += `### ✅ Tính năng Sẽ test (In-Scope)\n`
    scopeData.inScope.forEach(f => { md += `- ${f}\n` })
    md += `\n`
  }

  if (scopeData.outOfScope.length > 0) {
    md += `### ✕ Tính năng Không test (Out-of-Scope)\n`
    scopeData.outOfScope.forEach(f => { md += `- ${f}\n` })
    md += `\n`
  }

  md += `## 5. Entry & Exit Criteria\n`
  if (criteria.entry.length > 0) {
    md += `### Entry Criteria (Điều kiện bắt đầu)\n`
    criteria.entry.forEach(e => { md += `- ${e}\n` })
    md += `\n`
  }

  if (criteria.exit.length > 0) {
    md += `### Exit Criteria (Điều kiện hoàn thành)\n`
    criteria.exit.forEach(e => { md += `- ${e}\n` })
    md += `\n`
  }

  if (risks.length > 0) {
    md += `## 6. Quản lý Rủi ro & Giải pháp (Risks & Mitigation)\n\n`
    md += `| Rủi ro tiềm ẩn | Mức độ (Impact) | Giải pháp giảm thiểu (Mitigation) |\n`
    md += `| :--- | :--- | :--- |\n`
    risks.forEach(r => {
      md += `| ${r.risk.replace(/\|/g, '-')} | **${r.impact.replace(/\|/g, '-')}** | ${r.mitigation.replace(/\|/g, '-')} |\n`
    })
    md += `\n`
  }

  md += `## 7. Môi trường & Lịch trình (Environment & Schedule)\n`
  md += `- **Môi trường Test:** ${testEnv}\n`
  md += `- **Lịch trình (Schedule):** ${schedule}\n\n`

  if (resources.length > 0) {
    md += `## 8. Tài nguyên & Nhân sự (Resources)\n`
    resources.forEach(r => { md += `- ${r}\n` })
    md += `\n`
  }

  return md
}

// ─── HELPER MARKDOWN & MERMAID PREPROCESSORS ─────────────────────────────────

export function preprocessMarkdown(md: string): string {
  if (!md) return ''
  let text = md

  // 0. Ensure literal "\n" strings (escaped newlines) are converted to real newlines if string was stringified
  if (text.includes('\\n') && !text.includes('\n')) {
    text = text.replace(/\\n/g, '\n')
  }

  // 1. Identify Mermaid diagram code blocks (or unlabelled code blocks containing Mermaid diagrams) and format them as ```mermaid
  text = text.replace(/```(?:mermaid|gherkin|text|bdd|cucumber)?\s*\n([\s\S]*?)\n```/gi, (match, inner) => {
    const trimmed = inner.trim()
    if (
      trimmed.startsWith('graph ') ||
      trimmed.startsWith('sequenceDiagram') ||
      trimmed.startsWith('flowchart ') ||
      trimmed.startsWith('mindmap') ||
      trimmed.startsWith('stateDiagram') ||
      trimmed.startsWith('stateDiagram-v2') ||
      trimmed.startsWith('pie') ||
      trimmed.startsWith('gantt') ||
      trimmed.startsWith('classDiagram') ||
      trimmed.startsWith('erDiagram') ||
      trimmed.startsWith('journey') ||
      trimmed.startsWith('gitGraph') ||
      trimmed.includes('stateDiagram') ||
      trimmed.includes('pie title')
    ) {
      return `\n\`\`\`mermaid\n${trimmed}\n\`\`\`\n`
    }
    return match
  })

  // 2. Safely wrap standalone un-fenced stateDiagram or pie title lines without multiline regex backtracking
  if (!text.includes('```mermaid')) {
    text = text.replace(/^(stateDiagram(?:-v2)?(?:\s+.*)?(?:\n[^\n#]+)*)/gm, (match) => {
      if (match.includes('```')) return match
      return `\n\`\`\`mermaid\n${match.trim()}\n\`\`\`\n`
    })

    text = text.replace(/^(pie\s+title(?:\s+.*)?(?:\n[^\n#]+)*)/gm, (match) => {
      if (match.includes('```')) return match
      return `\n\`\`\`mermaid\n${match.trim()}\n\`\`\`\n`
    })
  }

  // 2. Remove ASCII divider comment lines like "# ----------------------------------------------------"
  text = text.replace(/^#\s*[-=]{5,}\s*$/gm, '')

  // 3. Process GitHub-style Alert Callouts > [!NOTE]
  text = text.replace(/^>\s*\[!(NOTE|WARNING|IMPORTANT|TIP|CAUTION)\]\s*(.*)$/gmi, (_, type, content) => {
    const iconMap: Record<string, string> = {
      NOTE: 'ℹ️',
      WARNING: '⚠️',
      IMPORTANT: '📌',
      TIP: '💡',
      CAUTION: '🚨',
    }
    const icon = iconMap[type.toUpperCase()] || '💡'
    return `<div class="alert-box alert-${type.toLowerCase()}"><strong>${icon} ${type.toUpperCase()}:</strong> ${content}</div>`
  })

  // 4. Fix pipe tables missing separator header line
  text = text.replace(/(\|[^\n]+\|\n)(\|[^\n-]+\|)/g, (match, header, firstRow) => {
    if (header.includes('---') || firstRow.includes('---')) return match
    const colCount = (header.match(/\|/g) || []).length - 1
    if (colCount > 0) {
      const sep = '|' + Array(colCount).fill(' :--- ').join('|') + '|\n'
      return header + sep + firstRow
    }
    return match
  })

  // 5. Clean up Gherkin keywords into standard Markdown headings & list items
  text = text.replace(/^(\s*)(Scenario(?: Outline)?:)(.*)$/gm, '\n### 🎬 $2$3\n')
  text = text.replace(/^(\s*)(Given\b)(.*)$/gm, '* **Given**$3')
  text = text.replace(/^(\s*)(When\b)(.*)$/gm, '* **When**$3')
  text = text.replace(/^(\s*)(Then\b)(.*)$/gm, '* **Then**$3')
  text = text.replace(/^(\s*)(And\b)(.*)$/gm, '* **And**$3')

  return text
}

export function processMermaidCodeBlocks(html: string): string {
  return html.replace(/<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/gi, (_, code) => {
    const unescaped = code
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
    return `<div class="mermaid">${unescaped}</div>`
  })
}

// ─── EXPORT MARKDOWN TO FULL HTML ─────────────────────────────────────────────

// ─── EXPORT MARKDOWN TO FULL HTML ─────────────────────────────────────────────

export function exportMarkdownToHtml(
  title: string,
  markdownText: string,
  projectName: string,
  docType: string = 'DOCUMENT',
  version: number = 1,
  createdAt: string = new Date().toISOString(),
  projectId?: string,
  docId?: string
): string {
  const docTypeTitle = DOC_TYPE_LABEL[docType] || docType.toUpperCase()
  let renderedHtml = ''
  try {
    const processed = preprocessMarkdown(markdownText)
    const rawHtml = marked.parse(processed, { gfm: true, breaks: true }) as string
    renderedHtml = processMermaidCodeBlocks(rawHtml)
  } catch {
    renderedHtml = `<pre>${markdownText}</pre>`
  }

  const safeJsonMarkdown = JSON.stringify(markdownText || '')

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — ${projectName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; }
    body { font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; background-color: #f8fafc; color: #0f172a; padding: 0; margin: 0; line-height: 1.6; }
    
    /* Sticky Top Action Toolbar */
    .top-toolbar { position: sticky; top: 0; z-index: 100; background: #ffffff; border-bottom: 2px solid #e2e8f0; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
    .toolbar-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .toolbar-title { font-weight: 800; font-size: 1rem; color: #0f172a; }
    .tag-badge { background: #e0e7ff; color: #3730a3; padding: 3px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; border: 1px solid #c7d2fe; text-transform: uppercase; font-family: 'JetBrains Mono', monospace !important; }
    .ver-badge { background: #f1f5f9; color: #334155; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; border: 1px solid #cbd5e1; font-family: 'JetBrains Mono', monospace !important; }
    
    .toolbar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .btn-group { display: flex; background: #f1f5f9; padding: 3px; border-radius: 10px; border: 1px solid #cbd5e1; }
    .btn-toggle { border: none; background: transparent; padding: 6px 14px; border-radius: 7px; font-size: 0.82rem; font-weight: 700; color: #475569; cursor: pointer; transition: all 0.15s; }
    .btn-toggle.active { background: #4f46e5; color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    
    .btn-primary { background: #16a34a; color: #ffffff; border: none; padding: 7px 16px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: background 0.15s; display: inline-flex; align-items: center; gap: 6px; }
    .btn-primary:hover { background: #15803d; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    
    .btn-secondary { background: #ffffff; color: #334155; border: 1px solid #cbd5e1; padding: 7px 14px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.15s; }
    .btn-secondary:hover { background: #f8fafc; border-color: #94a3b8; }
    
    .toast-banner { display: none; position: fixed; top: 68px; right: 24px; z-index: 200; background: #16a34a; color: #ffffff; padding: 10px 18px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; box-shadow: 0 4px 14px rgba(0,0,0,0.15); animation: fadeIn 0.2s ease-in-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

    /* Page Container */
    .page-wrapper { max-width: 1040px; margin: 32px auto 60px auto; padding: 0 20px; }
    .container { background: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; padding: 40px 48px; }
    .header-banner { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 28px; }
    .header-banner h1 { font-size: 1.75rem; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
    .meta-tags { display: flex; gap: 12px; font-size: 0.85rem; color: #64748b; font-family: 'JetBrains Mono', monospace !important; flex-wrap: wrap; }
    .tag { background: #eff6ff; color: #1d4ed8; padding: 2px 10px; border-radius: 12px; font-weight: 700; border: 1px solid #bfdbfe; }
    
    /* Typography */
    h1 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin-top: 1.75rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid #e2e8f0; }
    h2 { font-size: 1.25rem; font-weight: 700; color: #1e293b; margin-top: 1.5rem; margin-bottom: 0.75rem; padding-bottom: 0.35rem; border-bottom: 1px solid #e2e8f0; }
    h3 { font-size: 1.05rem; font-weight: 700; color: #4f46e5; margin-top: 1.25rem; margin-bottom: 0.5rem; }
    p { margin-bottom: 0.85rem; color: #334155; }
    ul, ol { margin-bottom: 1rem; padding-left: 1.5rem; color: #334155; }
    li { margin-bottom: 0.35rem; }
    table { width: 100%; border-collapse: collapse; margin: 1.25rem 0; font-size: 0.875rem; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    th { background: #f1f5f9; color: #0f172a; font-weight: 700; padding: 10px 14px; text-align: left; border-bottom: 2px solid #e2e8f0; border-right: 1px solid #e2e8f0; }
    td { padding: 10px 14px; border-bottom: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; color: #334155; }
    tr:nth-child(even) td { background: #f8fafc; }
    code { background: #f1f5f9; color: #4338ca; padding: 2px 6px; border-radius: 4px; font-family: 'JetBrains Mono', monospace !important; font-size: 0.85em; border: 1px solid #e2e8f0; }
    pre { background: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 1rem 0; border: 1px solid #e2e8f0; }

    /* Editor View Panel */
    #edit-panel { display: none; }
    .editor-wrapper { background: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.06); border: 2px solid #cbd5e1; padding: 24px; }
    .editor-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
    .editor-info { font-size: 0.85rem; font-weight: 700; color: #475569; }
    .markdown-textarea { width: 100%; min-height: 70vh; padding: 16px; font-family: 'JetBrains Mono', monospace !important; font-size: 0.88rem; line-height: 1.6; color: #0f172a; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; resize: vertical; outline: none; }
    .markdown-textarea:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15); background: #ffffff; }

    /* Gherkin BDD Styling */
    .gherkin-tag { display: inline-block; background-color: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; font-family: 'JetBrains Mono', monospace !important; font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 12px; margin-right: 4px; margin-bottom: 4px; }
    .gherkin-scenario-header { font-size: 1.05rem; font-weight: 800; color: #0f172a; background: #f8fafc; border-left: 4px solid #4f46e5; padding: 10px 14px; border-radius: 6px; margin-top: 1.25rem; margin-bottom: 0.75rem; }
    .gherkin-step { padding: 4px 0 4px 16px; color: #334155; font-size: 0.9rem; line-height: 1.6; }
    .gherkin-kw { font-weight: 800; font-family: 'JetBrains Mono', monospace !important; padding: 1px 6px; border-radius: 4px; font-size: 0.82rem; margin-right: 6px; display: inline-block; }
    .gherkin-scenario { background: #e0e7ff; color: #3730a3; }
    .gherkin-given { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
    .gherkin-when { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .gherkin-then { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .gherkin-and { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

    /* Mermaid Container */
    .mermaid { display: flex; justify-content: center; background: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px 0; overflow-x: auto; }
    
    /* GitHub-style Alerts */
    .alert-box { padding: 14px 18px; border-radius: 10px; margin: 16px 0; font-size: 0.9rem; border-left: 5px solid; }
    .alert-note { background: #eff6ff; border-color: #3b82f6; color: #1e40af; }
    .alert-warning { background: #fffbebfb; border-color: #f59e0b; color: #92400e; }
    .alert-important { background: #fef2f2; border-color: #ef4444; color: #991b1b; }
    .alert-tip { background: #f0fdf4; border-color: #22c55e; color: #166534; }
    .alert-caution { background: #faf5ff; border-color: #a855f7; color: #6b21a8; }

    @media print {
      .top-toolbar, .toast-banner, #edit-panel { display: none !important; }
      #view-panel { display: block !important; }
      body { background: white; padding: 0; }
      .page-wrapper { margin: 0; max-width: 100%; padding: 0; }
      .container { box-shadow: none; border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <!-- Top Navigation & Action Toolbar -->
  <div class="top-toolbar">
    <div class="toolbar-left">
      <span class="tag-badge">${docTypeTitle}</span>
      <span class="ver-badge">v${version}</span>
      <span class="toolbar-title">${title}</span>
    </div>
    <div class="toolbar-right">
      <div class="btn-group">
        <button id="btn-view-mode" class="btn-toggle active" onclick="setViewMode(false)">Chế độ Xem</button>
        <button id="btn-edit-mode" class="btn-toggle" onclick="setViewMode(true)">Chỉnh sửa Markdown</button>
      </div>
      <button id="btn-save" class="btn-primary" style="display:none;" onclick="saveDocumentContent()">Lưu thay đổi</button>
      <button class="btn-secondary" onclick="window.print()">In / Xuất PDF</button>
    </div>
  </div>

  <div id="toast-banner" class="toast-banner">Đã lưu thay đổi thành công!</div>

  <div class="page-wrapper">
    <!-- View Panel -->
    <div id="view-panel" class="container">
      <div class="header-banner">
        <h1>${title}</h1>
        <div class="meta-tags">
          <span class="tag">${docTypeTitle}</span>
          <span>Dự án: <strong>${projectName}</strong></span>
          <span>Phiên bản: <strong>v${version}</strong></span>
          <span>Cập nhật: <strong>${new Date(createdAt).toLocaleString('vi-VN')}</strong></span>
        </div>
      </div>
      <article id="rendered-content" class="doc-body">
        ${renderedHtml}
      </article>
    </div>

    <!-- Edit Panel -->
    <div id="edit-panel" class="editor-wrapper">
      <div class="editor-header">
        <div class="editor-info">Chỉnh sửa nội dung Markdown trực tiếp. Bấm "Lưu thay đổi" ở thanh công cụ phía trên khi hoàn tất.</div>
        <button class="btn-primary" onclick="saveDocumentContent()">Lưu thay đổi</button>
      </div>
      <textarea id="markdown-editor" class="markdown-textarea" placeholder="Nhập nội dung markdown..."></textarea>
    </div>
  </div>

  <script>
    let rawContent = ${safeJsonMarkdown};
    const projectId = ${JSON.stringify(projectId || '')};
    const docId = ${JSON.stringify(docId || '')};
    let isEdit = false;

    document.getElementById('markdown-editor').value = rawContent;

    function setViewMode(edit) {
      isEdit = edit;
      document.getElementById('view-panel').style.display = edit ? 'none' : 'block';
      document.getElementById('edit-panel').style.display = edit ? 'block' : 'none';
      document.getElementById('btn-view-mode').className = edit ? 'btn-toggle' : 'btn-toggle active';
      document.getElementById('btn-edit-mode').className = edit ? 'btn-toggle active' : 'btn-toggle';
      document.getElementById('btn-save').style.display = edit ? 'inline-flex' : 'none';
      if (edit) {
        document.getElementById('markdown-editor').focus();
      }
    }

    async function saveDocumentContent() {
      const newText = document.getElementById('markdown-editor').value;
      const saveBtns = document.querySelectorAll('#btn-save, .editor-header .btn-primary');
      saveBtns.forEach(btn => { btn.disabled = true; btn.innerText = 'Đang lưu...'; });

      if (projectId && docId) {
        try {
          const res = await fetch('/api/projects/' + projectId + '/documents/' + docId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: newText })
          });
          if (!res.ok) throw new Error('Không thể lưu dữ liệu lên hệ thống');
        } catch (err) {
          alert('Lỗi khi lưu tài liệu: ' + err.message);
          saveBtns.forEach(btn => { btn.disabled = false; btn.innerText = 'Lưu thay đổi'; });
          return;
        }
      }

      rawContent = newText;
      if (window.marked) {
        try {
          let html = marked.parse(newText, { gfm: true, breaks: true });
          html = html.replace(/<pre><code class="language-mermaid">([\\s\\S]*?)<\\/code><\\/pre>/gi, function(_, code) {
            const unescaped = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
            return '<div class="mermaid">' + unescaped + '</div>';
          });
          document.getElementById('rendered-content').innerHTML = html;
          if (window.mermaid) {
            mermaid.run();
          }
        } catch(e) {
          document.getElementById('rendered-content').innerHTML = '<pre>' + newText + '</pre>';
        }
      }

      saveBtns.forEach(btn => { btn.disabled = false; btn.innerText = 'Lưu thay đổi'; });
      
      const toast = document.getElementById('toast-banner');
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 3000);

      setViewMode(false);
    }

    document.addEventListener("DOMContentLoaded", function() {
      if (window.mermaid) {
        mermaid.initialize({ startOnLoad: true, theme: "default", securityLevel: "loose" });
      }
    });
  </script>
</body>
</html>`
}

// ─── TEST CASES FORMATTER & HTML EXPORT ──────────────────────────────────────

export function formatTestCasesToMarkdown(rawContent: any): string {
  let data = rawContent
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      return rawContent
    }
  }

  if (Array.isArray(data)) {
    return data.map((tc: TestCase) => {
      const st = tc.executionStatus || 'UNTRIED'
      return `### [${tc.id}] ${tc.title}\n- **Priority**: \`${tc.priority || 'P2'}\` | **Type**: \`${tc.type || 'positive'}\` | **Status**: **${st}**\n- **Expected Result**: ${tc.expectedResult}\n`
    }).join('\n')
  }

  if (!data || typeof data !== 'object') return String(data || '')

  let md = ''

  // 1. High-Level Test Scenarios
  if (Array.isArray(data.scenarios) && data.scenarios.length > 0) {
    md += `## High-Level Test Scenarios (${data.scenarios.length} Scenarios)\n\n`
    md += `| ID | Scenario Name | User Journey | Coverage |\n`
    md += `| :--- | :--- | :--- | :--- |\n`
    data.scenarios.forEach((sc: any) => {
      const id = sc.scenario_id || sc.id || 'SCEN'
      const name = sc.scenario_name || sc.title || sc.name || ''
      const journey = (sc.user_journey || sc.description || '').replace(/\|/g, '\\|')
      const coverage = (sc.coverage || '').replace(/\|/g, '\\|')
      md += `| **${id}** | ${name} | ${journey} | \`${coverage}\` |\n`
    })
    md += `\n---\n\n`
  }

  // 2. Detailed Test Cases
  const cases = Array.isArray(data.testCases) ? data.testCases : Array.isArray(data.cases) ? data.cases : []
  if (cases.length > 0) {
    md += `## Detailed Test Cases Suite (${cases.length} Test Cases)\n\n`
    cases.forEach((tc: TestCase) => {
      const st = tc.executionStatus || 'UNTRIED'
      md += `### [${tc.id}] ${tc.title}\n`
      md += `- **Priority**: \`${tc.priority || 'P2'}\` | **Type**: \`${tc.type || 'positive'}\` | **Status**: **${st}**\n`
      if (tc.preconditions) md += `- **Preconditions**: ${tc.preconditions}\n`
      if (tc.steps && Array.isArray(tc.steps)) {
        md += `- **Execution Steps**:\n`
        tc.steps.forEach((step, idx) => md += `  ${idx + 1}. ${step}\n`)
      }
      md += `- **Expected Result**: ${tc.expectedResult}\n`
      if (tc.actualResult) md += `- **Actual Result**: ${tc.actualResult}\n`
      if (tc.bugId) md += `- **Bug ID**: \`${tc.bugId}\` \n`
      md += `\n`
    })
  }

  return md.trim() || JSON.stringify(data, null, 2)
}

export function exportTestCasesToCsv(cases: TestCase[]): string {
  const headers = ['ID', 'Title', 'Type', 'Priority', 'ExecutionStatus', 'ActualResult', 'BugID', 'Preconditions', 'Steps', 'ExpectedResult']
  const rows = (cases || []).map(tc => [
    `"${(tc.id || '').replace(/"/g, '""')}"`,
    `"${(tc.title || '').replace(/"/g, '""')}"`,
    `"${(tc.type || '').replace(/"/g, '""')}"`,
    `"${(tc.priority || '').replace(/"/g, '""')}"`,
    `"${(tc.executionStatus || 'UNTRIED').replace(/"/g, '""')}"`,
    `"${(tc.actualResult || '').replace(/"/g, '""')}"`,
    `"${(tc.bugId || '').replace(/"/g, '""')}"`,
    `"${(tc.preconditions || '').replace(/"/g, '""')}"`,
    `"${(Array.isArray(tc.steps) ? tc.steps.join(' | ') : tc.steps || '').replace(/"/g, '""')}"`,
    `"${(tc.expectedResult || '').replace(/"/g, '""')}"`,
  ])
  return '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

export function exportTestCasesToHtml(doc: GeneratedDocument, projectName: string): string {
  let rawContent = doc.content
  if (rawContent && typeof rawContent === 'object' && 'rawText' in rawContent && typeof rawContent.rawText === 'string') {
    rawContent = rawContent.rawText
  }
  if (typeof rawContent === 'string') {
    try {
      rawContent = JSON.parse(rawContent)
    } catch {}
  }

  let scenarios: any[] = []
  let cases: TestCase[] = []

  if (Array.isArray(rawContent)) {
    cases = rawContent
  } else if (rawContent && typeof rawContent === 'object') {
    const obj = rawContent as any
    if (Array.isArray(obj.testCases)) cases = obj.testCases
    else if (Array.isArray(obj.cases)) cases = obj.cases
    
    if (Array.isArray(obj.scenarios)) scenarios = obj.scenarios
  }

  const featureName = doc.inputSummary || 'Test Cases Suite'

  const passedCount = cases.filter(c => c.executionStatus === 'PASS').length
  const failedCount = cases.filter(c => c.executionStatus === 'FAIL').length
  const blockedCount = cases.filter(c => c.executionStatus === 'BLOCKED').length
  const untriedCount = cases.length - passedCount - failedCount - blockedCount

  const markdownEquivalent = formatTestCasesToMarkdown(doc.content)
  const safeJsonMarkdown = JSON.stringify(markdownEquivalent)

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${featureName} — ${projectName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; }
    body { font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; background-color: #f8fafc; color: #0f172a; padding: 0; margin: 0; line-height: 1.5; }
    
    /* Top Toolbar */
    .top-toolbar { position: sticky; top: 0; z-index: 100; background: #ffffff; border-bottom: 2px solid #e2e8f0; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
    .toolbar-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .toolbar-title { font-weight: 800; font-size: 1rem; color: #0f172a; }
    .tag-badge { background: #e0e7ff; color: #3730a3; padding: 3px 10px; border-radius: 8px; font-size: 0.75rem; font-weight: 700; border: 1px solid #c7d2fe; text-transform: uppercase; font-family: 'JetBrains Mono', monospace !important; }
    .ver-badge { background: #f1f5f9; color: #334155; padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; border: 1px solid #cbd5e1; font-family: 'JetBrains Mono', monospace !important; }

    .toolbar-right { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .btn-group { display: flex; background: #f1f5f9; padding: 3px; border-radius: 10px; border: 1px solid #cbd5e1; }
    .btn-toggle { border: none; background: transparent; padding: 6px 14px; border-radius: 7px; font-size: 0.82rem; font-weight: 700; color: #475569; cursor: pointer; transition: all 0.15s; }
    .btn-toggle.active { background: #4f46e5; color: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    
    .btn-primary { background: #16a34a; color: #ffffff; border: none; padding: 7px 16px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: background 0.15s; display: inline-flex; align-items: center; gap: 6px; }
    .btn-primary:hover { background: #15803d; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    
    .btn-secondary { background: #ffffff; color: #334155; border: 1px solid #cbd5e1; padding: 7px 14px; border-radius: 8px; font-size: 0.82rem; font-weight: 700; cursor: pointer; transition: all 0.15s; }
    .btn-secondary:hover { background: #f8fafc; border-color: #94a3b8; }
    
    .toast-banner { display: none; position: fixed; top: 68px; right: 24px; z-index: 200; background: #16a34a; color: #ffffff; padding: 10px 18px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; box-shadow: 0 4px 14px rgba(0,0,0,0.15); animation: fadeIn 0.2s ease-in-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

    .page-wrapper { max-width: 1100px; margin: 32px auto 60px auto; padding: 0 20px; }
    .header { background: white; border-radius: 20px; padding: 28px; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.04); margin-bottom: 24px; }
    .header h1 { font-size: 1.75rem; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
    .meta { display: flex; gap: 16px; font-size: 0.875rem; color: #64748b; font-family: 'JetBrains Mono', monospace !important; flex-wrap: wrap; margin-bottom: 16px; }
    .stats-bar { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f1f5f9; }
    .stat-pill { padding: 4px 14px; border-radius: 20px; font-weight: 800; font-size: 0.8rem; }
    .stat-pass { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .stat-fail { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
    .stat-blocked { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .stat-untried { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

    .tc-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
    .tc-header { background: #f8fafc; padding: 14px 20px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .tc-id { font-family: 'JetBrains Mono', monospace !important; font-weight: 800; color: #4338ca; background: #e0e7ff; padding: 2px 8px; border-radius: 6px; font-size: 0.85rem; }
    .tc-title { font-weight: 800; color: #0f172a; flex: 1; min-width: 200px; }
    .badge { font-size: 0.75rem; font-weight: 800; padding: 2px 8px; border-radius: 12px; text-transform: uppercase; }
    .badge.p1 { background: #fee2e2; color: #991b1b; }
    .badge.p2 { background: #fef3c7; color: #92400e; }
    .badge.p3 { background: #f1f5f9; color: #475569; }
    .badge.positive { background: #dcfce7; color: #166534; }
    .badge.negative { background: #ffedd5; color: #9a3412; }
    .badge.edge { background: #f3e8ff; color: #6b21a8; }
    .status-tag { font-size: 0.8rem; font-weight: 800; padding: 2px 10px; border-radius: 12px; }

    .tc-body { padding: 20px; font-size: 0.9rem; }
    .preconditions { background: #f8fafc; padding: 10px 14px; border-radius: 8px; color: #475569; margin-bottom: 14px; border-left: 4px solid #818cf8; }
    ol { padding-left: 20px; margin-bottom: 14px; color: #334155; }
    li { margin-bottom: 6px; }
    .expected { background: #f0fdf4; color: #166534; padding: 10px 14px; border-radius: 8px; font-weight: 600; border-left: 4px solid #22c55e; }
    .actual-box { background: #fff1f2; color: #9f1239; padding: 10px 14px; border-radius: 8px; margin-top: 10px; border-left: 4px solid #f43f5e; font-size: 0.85rem; }

    /* Editor View */
    #edit-panel { display: none; }
    .editor-wrapper { background: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.06); border: 2px solid #cbd5e1; padding: 24px; }
    .editor-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
    .editor-info { font-size: 0.85rem; font-weight: 700; color: #475569; }
    .markdown-textarea { width: 100%; min-height: 70vh; padding: 16px; font-family: 'JetBrains Mono', monospace !important; font-size: 0.88rem; line-height: 1.6; color: #0f172a; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; resize: vertical; outline: none; }
    .markdown-textarea:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15); background: #ffffff; }

    @media print {
      .top-toolbar, .toast-banner, #edit-panel { display: none !important; }
      #view-panel { display: block !important; }
      body { background: white; padding: 0; }
      .page-wrapper { margin: 0; max-width: 100%; padding: 0; }
      .container, .header { box-shadow: none; border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <!-- Top Action Toolbar -->
  <div class="top-toolbar">
    <div class="toolbar-left">
      <span class="tag-badge">Test Cases Suite</span>
      <span class="ver-badge">v${doc.version || 1}</span>
      <span class="toolbar-title">${featureName}</span>
    </div>
    <div class="toolbar-right">
      <div class="btn-group">
        <button id="btn-view-mode" class="btn-toggle active" onclick="setViewMode(false)">Chế độ Xem</button>
        <button id="btn-edit-mode" class="btn-toggle" onclick="setViewMode(true)">Chỉnh sửa Nội dung</button>
      </div>
      <button id="btn-save" class="btn-primary" style="display:none;" onclick="saveDocumentContent()">Lưu thay đổi</button>
      <button class="btn-secondary" onclick="window.print()">In / Xuất PDF</button>
    </div>
  </div>

  <div id="toast-banner" class="toast-banner">Đã lưu thay đổi thành công!</div>

  <div class="page-wrapper">
    <div id="view-panel">
      <div class="header">
        <h1>${featureName}</h1>
        <div class="meta">
          <span>Dự án: <strong>${projectName}</strong></span>
          <span>Phiên bản: <strong>v${doc.version || 1}</strong></span>
          <span>Kịch bản: <strong>${scenarios.length} Scenarios</strong></span>
          <span>Test Cases: <strong>${cases.length} Cases</strong></span>
          <span>Cập nhật: <strong>${new Date(doc.createdAt).toLocaleString('vi-VN')}</strong></span>
        </div>
        <div class="stats-bar">
          <span class="stat-pill stat-pass">PASSED: ${passedCount}</span>
          <span class="stat-pill stat-fail">FAILED: ${failedCount}</span>
          <span class="stat-pill stat-blocked">BLOCKED: ${blockedCount}</span>
          <span class="stat-pill stat-untried">UNTRIED: ${untriedCount}</span>
        </div>
      </div>

      ${scenarios.length > 0 ? `
        <div style="margin-bottom: 28px; background: white; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          <h2 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">
            High-Level Test Scenarios (${scenarios.length} Scenarios)
          </h2>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">
              <thead>
                <tr style="background: #f8fafc; text-align: left;">
                  <th style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: 800;">ID</th>
                  <th style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: 800;">Scenario Name</th>
                  <th style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: 800;">User Journey</th>
                  <th style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: 800;">Coverage</th>
                </tr>
              </thead>
              <tbody>
                ${scenarios.map(sc => `
                  <tr>
                    <td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-family: 'JetBrains Mono', monospace !important; font-weight: 800; color: #4338ca;">${sc.scenario_id || sc.id || 'SCEN'}</td>
                    <td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${sc.scenario_name || sc.title || sc.name}</td>
                    <td style="padding: 10px 14px; border: 1px solid #e2e8f0; color: #334155;">${sc.user_journey || sc.description || ''}</td>
                    <td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-family: 'JetBrains Mono', monospace !important; font-size: 0.8rem; color: #64748b;">${sc.coverage || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      ${cases.length > 0 ? `
        <h2 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">
          Detailed Test Cases Suite (${cases.length} Cases)
        </h2>
        <div id="test-cases-list">
          ${cases.map(tc => {
            const st = (tc.executionStatus || 'UNTRIED').toUpperCase()
            const stClass = st === 'PASS' ? 'status-pass' : st === 'FAIL' ? 'status-fail' : st === 'BLOCKED' ? 'status-blocked' : 'status-untried'
            const stLabel = st === 'PASS' ? 'PASS' : st === 'FAIL' ? 'FAIL' : st === 'BLOCKED' ? 'BLOCKED' : 'UNTRIED'
            return `
            <div class="tc-card">
              <div class="tc-header">
                <span class="tc-id">${tc.id}</span>
                <span class="tc-title">${tc.title}</span>
                <span class="badge ${tc.priority?.toLowerCase() || 'p2'}">${tc.priority || 'P2'}</span>
                <span class="badge ${tc.type?.toLowerCase() || 'positive'}">${tc.type || 'positive'}</span>
                <span class="status-tag ${stClass}">${stLabel}</span>
              </div>
              <div class="tc-body">
                ${tc.preconditions ? `<div class="preconditions"><strong>Preconditions:</strong> ${tc.preconditions}</div>` : ''}
                <ol>${(tc.steps || []).map(s => `<li>${s}</li>`).join('')}</ol>
                <div class="expected"><strong>Expected Result:</strong> ${tc.expectedResult}</div>
                ${tc.actualResult || tc.bugId ? `
                  <div class="actual-box">
                    <strong>Actual Result:</strong> ${tc.actualResult || 'Chưa ghi nhận'}
                    ${tc.bugId ? ` &nbsp;·&nbsp; <strong>Bug ID:</strong> <code>${tc.bugId}</code>` : ''}
                  </div>
                ` : ''}
              </div>
            </div>
            `
          }).join('')}
        </div>
      ` : ''}
    </div>

    <!-- Editor View -->
    <div id="edit-panel" class="editor-wrapper">
      <div class="editor-header">
        <div class="editor-info">Chỉnh sửa nội dung Test Cases trực tiếp dạng Markdown. Bấm "Lưu thay đổi" khi hoàn tất.</div>
        <button class="btn-primary" onclick="saveDocumentContent()">Lưu thay đổi</button>
      </div>
      <textarea id="markdown-editor" class="markdown-textarea" placeholder="Nội dung test cases..."></textarea>
    </div>
  </div>

  <script>
    let rawContent = ${safeJsonMarkdown};
    const projectId = ${JSON.stringify(doc.projectId || '')};
    const docId = ${JSON.stringify(doc.id || '')};
    let isEdit = false;

    document.getElementById('markdown-editor').value = rawContent;

    function setViewMode(edit) {
      isEdit = edit;
      document.getElementById('view-panel').style.display = edit ? 'none' : 'block';
      document.getElementById('edit-panel').style.display = edit ? 'block' : 'none';
      document.getElementById('btn-view-mode').className = edit ? 'btn-toggle' : 'btn-toggle active';
      document.getElementById('btn-edit-mode').className = edit ? 'btn-toggle active' : 'btn-toggle';
      document.getElementById('btn-save').style.display = edit ? 'inline-flex' : 'none';
      if (edit) {
        document.getElementById('markdown-editor').focus();
      }
    }

    async function saveDocumentContent() {
      const newText = document.getElementById('markdown-editor').value;
      const saveBtns = document.querySelectorAll('#btn-save, .editor-header .btn-primary');
      saveBtns.forEach(btn => { btn.disabled = true; btn.innerText = 'Đang lưu...'; });

      if (projectId && docId) {
        try {
          const res = await fetch('/api/projects/' + projectId + '/documents/' + docId, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: newText })
          });
          if (!res.ok) throw new Error('Không thể lưu dữ liệu lên hệ thống');
        } catch (err) {
          alert('Lỗi khi lưu tài liệu: ' + err.message);
          saveBtns.forEach(btn => { btn.disabled = false; btn.innerText = 'Lưu thay đổi'; });
          return;
        }
      }

      rawContent = newText;
      saveBtns.forEach(btn => { btn.disabled = false; btn.innerText = 'Lưu thay đổi'; });
      
      const toast = document.getElementById('toast-banner');
      toast.style.display = 'block';
      setTimeout(() => { toast.style.display = 'none'; }, 3000);

      setViewMode(false);
      // Reload page to reflect full parsed test cases structure if JSON modified
      setTimeout(() => { window.location.reload(); }, 600);
    }
  </script>
</body>
</html>`
}

// ─── TEST PLAN EXPORT TO HTML ─────────────────────────────────────────────────

export function exportTestPlanToHtml(doc: GeneratedDocument, projectName: string): string {
  let rawContent = doc.content
  if (rawContent && typeof rawContent === 'object' && 'rawText' in rawContent && typeof rawContent.rawText === 'string') {
    rawContent = rawContent.rawText
  }
  const markdownText = formatTestPlanToMarkdown(rawContent)
  return exportMarkdownToHtml(
    doc.inputSummary || 'Master Test Plan',
    markdownText,
    projectName,
    'test-plan',
    doc.version || 1,
    doc.createdAt || new Date().toISOString(),
    doc.projectId,
    doc.id
  )
}

export function wrapRawHtmlWithEditor(
  htmlContent: string,
  doc: GeneratedDocument,
  projectName: string
): string {
  const title = doc.inputSummary || doc.title || 'HTML Document'
  const docTypeTitle = DOC_TYPE_LABEL[doc.type] || (doc.type || 'DOCUMENT').toUpperCase()
  const safeJsonHtml = JSON.stringify(htmlContent)
  const projectId = doc.projectId || ''
  const docId = doc.id || ''
  const version = doc.version || 1
  const createdAt = doc.createdAt || new Date().toISOString()

  // Inject top action bar and editor overlay into raw HTML
  const topBarHtml = `
    <!-- QA BRAIN TOP ACTION TOOLBAR -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style id="qa-brain-toolbar-styles">
      .qa-top-toolbar { position: sticky; top: 0; left: 0; right: 0; z-index: 99999; background: #ffffff !important; border-bottom: 2px solid #cbd5e1 !important; padding: 12px 24px !important; display: flex !important; align-items: center !important; justify-content: space-between !important; gap: 16px !important; flex-wrap: wrap !important; box-shadow: 0 4px 12px rgba(0,0,0,0.08) !important; font-family: 'Inter', system-ui, -apple-system, sans-serif !important; }
      .qa-toolbar-left { display: flex !important; align-items: center !important; gap: 10px !important; flex-wrap: wrap !important; }
      .qa-toolbar-title { font-weight: 800 !important; font-size: 1rem !important; color: #0f172a !important; }
      .qa-tag-badge { background: #e0e7ff !important; color: #3730a3 !important; padding: 3px 10px !important; border-radius: 8px !important; font-size: 0.75rem !important; font-weight: 700 !important; border: 1px solid #c7d2fe !important; text-transform: uppercase !important; font-family: 'JetBrains Mono', monospace !important; }
      .qa-ver-badge { background: #f1f5f9 !important; color: #334155 !important; padding: 3px 8px !important; border-radius: 6px !important; font-size: 0.75rem !important; font-weight: 700 !important; border: 1px solid #cbd5e1 !important; font-family: 'JetBrains Mono', monospace !important; }
      
      .qa-toolbar-right { display: flex !important; align-items: center !important; gap: 8px !important; flex-wrap: wrap !important; }
      .qa-btn-group { display: flex !important; background: #f1f5f9 !important; padding: 3px !important; border-radius: 10px !important; border: 1px solid #cbd5e1 !important; }
      .qa-btn-toggle { border: none !important; background: transparent !important; padding: 6px 14px !important; border-radius: 7px !important; font-size: 0.82rem !important; font-weight: 700 !important; color: #475569 !important; cursor: pointer !important; transition: all 0.15s !important; }
      .qa-btn-toggle.active { background: #4f46e5 !important; color: #ffffff !important; box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important; }
      
      .qa-btn-primary { background: #16a34a !important; color: #ffffff !important; border: none !important; padding: 7px 16px !important; border-radius: 8px !important; font-size: 0.82rem !important; font-weight: 700 !important; cursor: pointer !important; transition: background 0.15s !important; display: inline-flex !important; align-items: center !important; gap: 6px !important; }
      .qa-btn-primary:hover { background: #15803d !important; }
      .qa-btn-primary:disabled { opacity: 0.6 !important; cursor: not-allowed !important; }
      
      .qa-btn-secondary { background: #ffffff !important; color: #334155 !important; border: 1px solid #cbd5e1 !important; padding: 7px 14px !important; border-radius: 8px !important; font-size: 0.82rem !important; font-weight: 700 !important; cursor: pointer !important; transition: all 0.15s !important; }
      .qa-btn-secondary:hover { background: #f8fafc !important; border-color: #94a3b8 !important; }
      
      .qa-toast-banner { display: none; position: fixed; top: 68px; right: 24px; z-index: 999999; background: #16a34a; color: #ffffff; padding: 10px 18px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; box-shadow: 0 4px 14px rgba(0,0,0,0.15); }

      #qa-raw-editor-panel { display: none; padding: 24px; max-width: 1200px; margin: 24px auto; background: #ffffff; border-radius: 16px; border: 2px solid #cbd5e1; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
      .qa-editor-textarea { width: 100%; min-height: 75vh; padding: 16px; font-family: 'JetBrains Mono', monospace !important; font-size: 0.85rem; line-height: 1.6; color: #0f172a; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; resize: vertical; outline: none; }
      .qa-editor-textarea:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15); background: #ffffff; }
      
      @media print {
        .qa-top-toolbar, .qa-toast-banner, #qa-raw-editor-panel { display: none !important; }
      }
    </style>

    <div class="qa-top-toolbar">
      <div class="qa-toolbar-left">
        <span class="qa-tag-badge">${docTypeTitle}</span>
        <span class="qa-ver-badge">v${version}</span>
        <span class="qa-toolbar-title">${title}</span>
      </div>
      <div class="qa-toolbar-right">
        <div class="qa-btn-group">
          <button id="qa-btn-view" class="qa-btn-toggle active" onclick="qaSetViewMode(false)">Chế độ Xem</button>
          <button id="qa-btn-edit" class="qa-btn-toggle" onclick="qaSetViewMode(true)">Chỉnh sửa HTML</button>
        </div>
        <button id="qa-btn-save" class="qa-btn-primary" style="display:none;" onclick="qaSaveRawContent()">Lưu thay đổi</button>
        <button class="qa-btn-secondary" onclick="window.print()">In / Xuất PDF</button>
      </div>
    </div>

    <div id="qa-toast-banner" class="qa-toast-banner">Đã lưu thay đổi thành công!</div>

    <div id="qa-raw-editor-panel">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; font-family:'Inter', sans-serif;">
        <span style="font-size:0.85rem; font-weight:700; color:#475569;">Chỉnh sửa trực tiếp mã nguồn HTML / Dữ liệu. Bấm "Lưu thay đổi" khi hoàn tất.</span>
        <button class="qa-btn-primary" onclick="qaSaveRawContent()">Lưu thay đổi</button>
      </div>
      <textarea id="qa-html-editor" class="qa-editor-textarea" placeholder="Nhập mã HTML..."></textarea>
    </div>

    <script id="qa-toolbar-script">
      let qaInitialHtml = ${safeJsonHtml};
      const qaProjectId = ${JSON.stringify(projectId)};
      const qaDocId = ${JSON.stringify(docId)};

      document.getElementById('qa-html-editor').value = qaInitialHtml;

      function qaSetViewMode(edit) {
        document.getElementById('qa-raw-editor-panel').style.display = edit ? 'block' : 'none';
        document.getElementById('qa-btn-view').className = edit ? 'qa-btn-toggle' : 'qa-btn-toggle active';
        document.getElementById('qa-btn-edit').className = edit ? 'qa-btn-toggle active' : 'qa-btn-toggle';
        document.getElementById('qa-btn-save').style.display = edit ? 'inline-flex' : 'none';
        
        // Hide or show the original body children
        const bodyChildren = Array.from(document.body.children);
        bodyChildren.forEach(el => {
          if (!el.classList.contains('qa-top-toolbar') && el.id !== 'qa-raw-editor-panel' && el.id !== 'qa-toast-banner' && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
            el.style.display = edit ? 'none' : '';
          }
        });

        if (edit) {
          document.getElementById('qa-html-editor').focus();
        }
      }

      async function qaSaveRawContent() {
        const newHtml = document.getElementById('qa-html-editor').value;
        const saveBtns = document.querySelectorAll('#qa-btn-save, #qa-raw-editor-panel .qa-btn-primary');
        saveBtns.forEach(btn => { btn.disabled = true; btn.innerText = 'Đang lưu...'; });

        if (qaProjectId && qaDocId) {
          try {
            const res = await fetch('/api/projects/' + qaProjectId + '/documents/' + qaDocId, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: newHtml })
            });
            if (!res.ok) throw new Error('Không thể lưu lên máy chủ');
          } catch(err) {
            alert('Lỗi lưu: ' + err.message);
            saveBtns.forEach(btn => { btn.disabled = false; btn.innerText = 'Lưu thay đổi'; });
            return;
          }
        }

        saveBtns.forEach(btn => { btn.disabled = false; btn.innerText = 'Lưu thay đổi'; });
        const toast = document.getElementById('qa-toast-banner');
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 3000);

        // Reload to render the new full HTML
        setTimeout(() => { window.location.reload(); }, 500);
      }
    </script>
  `

  if (htmlContent.includes('<body')) {
    return htmlContent.replace(/<body([^>]*)>/i, `<body$1>${topBarHtml}`)
  } else {
    return topBarHtml + htmlContent
  }
}

export function exportToHtml(doc: GeneratedDocument, projectName: string, featureName?: string): string {
  let content = doc.content

  if (typeof content === 'string') {
    const trimmed = content.trim().toLowerCase()
    if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html') || trimmed.includes('<html')) {
      return wrapRawHtmlWithEditor(content, doc, projectName)
    }
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(content)
        if (parsed && typeof parsed === 'object') content = parsed
      } catch {}
    }
  }

  if (content && typeof content === 'object' && 'rawText' in content && typeof content.rawText === 'string') {
    content = content.rawText
  }

  const docTypeStr = doc.type as string
  if (docTypeStr === 'test-case' || docTypeStr === 'test-cases' || docTypeStr === 'test-scenario') {
    return exportTestCasesToHtml({ ...doc, content }, projectName)
  }

  if (content && typeof content === 'object' && ('testCases' in content || 'scenarios' in content)) {
    return exportTestCasesToHtml({ ...doc, content }, projectName)
  }

  if (doc.type === 'test-plan') {
    return exportTestPlanToHtml({ ...doc, content }, projectName)
  }

  const markdownText = typeof content === 'string'
    ? content
    : typeof content === 'object'
    ? JSON.stringify(content, null, 2)
    : String(content ?? '')

  const title = doc.inputSummary || featureName || DOC_TYPE_LABEL[doc.type] || doc.type.toUpperCase()

  return exportMarkdownToHtml(
    title,
    markdownText,
    projectName,
    doc.type,
    doc.version || 1,
    doc.createdAt || new Date().toISOString(),
    doc.projectId,
    doc.id
  )
}

