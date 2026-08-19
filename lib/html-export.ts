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
  'user-story': 'User Stories & Acceptance Criteria',
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

export function exportMarkdownToHtml(
  title: string,
  markdownText: string,
  projectName: string,
  docType: string = 'DOCUMENT',
  version: number = 1,
  createdAt: string = new Date().toISOString()
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

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${title} — ${projectName}</title>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 40px 24px; line-height: 1.6; }
    .container { max-width: 960px; margin: 0 auto; background: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px -2px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; padding: 40px 48px; }
    .header-banner { border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 28px; }
    .header-banner h1 { font-size: 1.75rem; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
    .meta-tags { display: flex; gap: 12px; font-size: 0.85rem; color: #64748b; font-family: monospace; flex-wrap: wrap; }
    .tag { background: #eff6ff; color: #1d4ed8; padding: 2px 10px; border-radius: 12px; font-weight: 700; border: 1px solid #bfdbfe; }
    
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
    code { background: #f1f5f9; color: #4338ca; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.85em; border: 1px solid #e2e8f0; }
    pre { background: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 1rem 0; border: 1px solid #e2e8f0; }

    /* Gherkin BDD & Tags Styling */
    .gherkin-tag { display: inline-block; background-color: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; font-family: monospace; font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 12px; margin-right: 4px; margin-bottom: 4px; }
    .gherkin-scenario-header { font-size: 1.05rem; font-weight: 800; color: #0f172a; background: #f8fafc; border-left: 4px solid #4f46e5; padding: 10px 14px; border-radius: 6px; margin-top: 1.25rem; margin-bottom: 0.75rem; }
    .gherkin-step { padding: 4px 0 4px 16px; color: #334155; font-size: 0.9rem; line-height: 1.6; }
    .gherkin-kw { font-weight: 800; font-family: monospace; padding: 1px 6px; border-radius: 4px; font-size: 0.82rem; margin-right: 6px; display: inline-block; }
    .gherkin-scenario { background: #e0e7ff; color: #3730a3; }
    .gherkin-given { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
    .gherkin-when { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .gherkin-then { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .gherkin-and { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

    /* Mermaid diagrams container */
    .mermaid { display: flex; justify-content: center; background: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px 0; overflow-x: auto; }
    
    /* GitHub-style Alerts */
    .alert-box { padding: 14px 18px; border-radius: 10px; margin: 16px 0; font-size: 0.9rem; border-left: 5px solid; }
    .alert-note { background: #eff6ff; border-color: #3b82f6; color: #1e40af; }
    .alert-warning { background: #fffbebfb; border-color: #f59e0b; color: #92400e; }
    .alert-important { background: #fef2f2; border-color: #ef4444; color: #991b1b; }
    .alert-tip { background: #f0fdf4; border-color: #22c55e; color: #166534; }
    .alert-caution { background: #faf5ff; border-color: #a855f7; color: #6b21a8; }

    /* Mermaid diagrams container */
    .mermaid { display: flex; justify-content: center; background: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px 0; overflow-x: auto; }
    
    /* GitHub-style Alerts */
    .alert-box { padding: 14px 18px; border-radius: 10px; margin: 16px 0; font-size: 0.9rem; border-left: 5px solid; }
    .alert-note { background: #eff6ff; border-color: #3b82f6; color: #1e40af; }
    .alert-warning { background: #fffbebfb; border-color: #f59e0b; color: #92400e; }
    .alert-important { background: #fef2f2; border-color: #ef4444; color: #991b1b; }
    .alert-tip { background: #f0fdf4; border-color: #22c55e; color: #166534; }
    .alert-caution { background: #faf5ff; border-color: #a855f7; color: #6b21a8; }

    .print-btn { position: fixed; bottom: 24px; right: 24px; background: #4f46e5; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3); }
    @media print { body { background: white; padding: 0; } .container { shadow: none; border: none; padding: 0; } .print-btn { display: none; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-banner">
      <h1>${title}</h1>
      <div class="meta-tags">
        <span class="tag">${docTypeTitle}</span>
        <span>Project: <strong>${projectName}</strong></span>
        <span>Version: <strong>v${version}</strong></span>
        <span>Cập nhật: <strong>${new Date(createdAt).toLocaleString('vi-VN')}</strong></span>
      </div>
    </div>
    <article class="doc-body">
      ${renderedHtml}
    </article>
  </div>
  <button class="print-btn" onclick="window.print()">🖨 In / Export PDF</button>
  <script>
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
      const stTag = st === 'PASS' ? '✅ PASS' : st === 'FAIL' ? '❌ FAIL' : st === 'BLOCKED' ? '🚫 BLOCKED' : '⚪ UNTRIED'
      return `### [${tc.id}] ${tc.title}\n- **Priority**: \`${tc.priority || 'P2'}\` | **Type**: \`${tc.type || 'positive'}\` | **Status**: **${stTag}**\n- **Expected Result**: ${tc.expectedResult}\n`
    }).join('\n')
  }

  if (!data || typeof data !== 'object') return String(data || '')

  let md = ''

  // 1. High-Level Test Scenarios
  if (Array.isArray(data.scenarios) && data.scenarios.length > 0) {
    md += `## 📋 High-Level Test Scenarios (${data.scenarios.length} Scenarios)\n\n`
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
    md += `## 🧪 Detailed Test Cases Suite (${cases.length} Test Cases)\n\n`
    cases.forEach((tc: TestCase) => {
      const st = tc.executionStatus || 'UNTRIED'
      const stTag = st === 'PASS' ? '✅ PASS' : st === 'FAIL' ? '❌ FAIL' : st === 'BLOCKED' ? '🚫 BLOCKED' : '⚪ UNTRIED'
      md += `### [${tc.id}] ${tc.title}\n`
      md += `- **Priority**: \`${tc.priority || 'P2'}\` | **Type**: \`${tc.type || 'positive'}\` | **Status**: **${stTag}**\n`
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

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>${featureName} — ${projectName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 40px 24px; line-height: 1.5; }
    .container { max-width: 1100px; margin: 0 auto; }
    .header { background: white; border-radius: 20px; p: 28px; padding: 28px; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.04); margin-bottom: 24px; }
    .header h1 { font-size: 1.75rem; font-weight: 800; color: #0f172a; margin-bottom: 8px; }
    .meta { display: flex; gap: 16px; font-size: 0.875rem; color: #64748b; font-family: monospace; flex-wrap: wrap; margin-bottom: 16px; }
    .stats-bar { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 12px; pt: 12px; border-top: 1px solid #f1f5f9; }
    .stat-pill { padding: 4px 14px; border-radius: 20px; font-weight: 800; font-size: 0.8rem; }
    .stat-pass { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
    .stat-fail { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
    .stat-blocked { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }
    .stat-untried { background: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; }

    .tc-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; margin-bottom: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
    .tc-header { background: #f8fafc; padding: 14px 20px; border-bottom: 1px solid #e2e8f0; display: flex; items-center; gap: 12px; flex-wrap: wrap; }
    .tc-id { font-family: monospace; font-weight: 800; color: #4338ca; background: #e0e7ff; padding: 2px 8px; border-radius: 6px; font-size: 0.85rem; }
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

    .print-btn { position: fixed; bottom: 24px; right: 24px; background: #4f46e5; color: white; border: none; padding: 12px 24px; border-radius: 30px; font-weight: 800; box-shadow: 0 10px 25px -5px rgba(79,70,229,0.4); cursor: pointer; }
    @media print { .print-btn { display: none; } body { padding: 0; background: white; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${featureName}</h1>
      <div class="meta">
        <span>Dự án: <strong>${projectName}</strong></span>
        <span>Version: <strong>v${doc.version || 1}</strong></span>
        <span>Kịch bản: <strong>${scenarios.length} Scenarios</strong></span>
        <span>Test Cases: <strong>${cases.length} Cases</strong></span>
        <span>Cập nhật: <strong>${new Date(doc.createdAt).toLocaleString('vi-VN')}</strong></span>
      </div>
      <div class="stats-bar">
        <span class="stat-pill stat-pass">✅ PASSED: ${passedCount}</span>
        <span class="stat-pill stat-fail">❌ FAILED: ${failedCount}</span>
        <span class="stat-pill stat-blocked">🚫 BLOCKED: ${blockedCount}</span>
        <span class="stat-pill stat-untried">⚪ UNTRIED: ${untriedCount}</span>
      </div>
    </div>

    ${scenarios.length > 0 ? `
      <div style="margin-bottom: 28px; background: white; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
        <h2 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">
          📋 High-Level Test Scenarios (${scenarios.length} Scenarios)
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
                  <td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 800; color: #4338ca;">${sc.scenario_id || sc.id || 'SCEN'}</td>
                  <td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${sc.scenario_name || sc.title || sc.name}</td>
                  <td style="padding: 10px 14px; border: 1px solid #e2e8f0; color: #334155;">${sc.user_journey || sc.description || ''}</td>
                  <td style="padding: 10px 14px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 0.8rem; color: #64748b;">${sc.coverage || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    ` : ''}

    ${cases.length > 0 ? `
      <h2 style="font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #e2e8f0;">
        🧪 Detailed Test Cases Suite (${cases.length} Cases)
      </h2>
      ${cases.map(tc => {
        const st = (tc.executionStatus || 'UNTRIED').toUpperCase()
        const stClass = st === 'PASS' ? 'status-pass' : st === 'FAIL' ? 'status-fail' : st === 'BLOCKED' ? 'status-blocked' : 'status-untried'
        const stLabel = st === 'PASS' ? '✅ PASS' : st === 'FAIL' ? '❌ FAIL' : st === 'BLOCKED' ? '🚫 BLOCKED' : '⚪ UNTRIED'
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
    ` : ''}
  </div>
  <button class="print-btn" onclick="window.print()">🖨 In / Export PDF</button>
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
    doc.createdAt || new Date().toISOString()
  )
}

export function exportToHtml(doc: GeneratedDocument, projectName: string, featureName?: string): string {
  let content = doc.content

  if (typeof content === 'string') {
    const trimmed = content.trim().toLowerCase()
    if (trimmed.startsWith('<!doctype html') || trimmed.startsWith('<html')) {
      return content
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
    doc.createdAt || new Date().toISOString()
  )
}

