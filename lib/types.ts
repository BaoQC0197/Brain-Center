export type InputType = 'text' | 'srs' | 'brd' | 'user-story' | 'epic' | 'api-spec' | 'image'

// ── PHASE 1: Requirement Baseline Documents (Product / BA / PO) ────────────

export type RawDocType =
  | 'brd'
  | 'srs'
  | 'user-story'
  | 'epic'
  | 'feature-request'
  | 'change-request'
  | 'api-spec'
  | 'wireframe'
  | 'meeting-minutes'
  | 'email-notes'
  | 'upload-doc'
  | 'figma'

export interface RawDocument {
  id: string
  projectId: string
  type: RawDocType
  name: string
  textContent?: string
  imageBase64?: string
  imageMime?: string
  audioBase64?: string
  audioMime?: string
  figmaUrl?: string
  createdAt: string
}

export const RAW_DOC_META: Record<RawDocType, { label: string; icon: string; desc: string; color: string }> = {
  brd:               { label: 'BRD',               icon: '', desc: 'Business Requirements Document',        color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  srs:               { label: 'SRS',               icon: '', desc: 'Software Requirements Specification',    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  'user-story':      { label: 'User Story',        icon: '', desc: 'User story & acceptance criteria',      color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  epic:              { label: 'Epic',              icon: '', desc: 'Epic / Feature nhóm lớn',              color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
  'feature-request': { label: 'Feature Request',   icon: '', desc: 'Yêu cầu tính năng mới',                 color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  'change-request':  { label: 'Change Request',    icon: '', desc: 'Yêu cầu thay đổi (CR)',                 color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  'api-spec':        { label: 'API Spec',          icon: '', desc: 'Đặc tả API / Swagger / Postman',        color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  wireframe:         { label: 'Wireframe',         icon: '', desc: 'Mockup / Wireframe / Screenshot UI',    color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  'meeting-minutes': { label: '🎙️ Ghi âm Cuộc họp', icon: '🎙️', desc: 'Ghi âm cuộc họp & Văn bản bóc tách', color: 'bg-teal-100 text-teal-900 border-teal-400' },
  'email-notes':     { label: 'Email / Request',   icon: '', desc: 'Email / Ghi chú từ đối tác',            color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  'upload-doc':      { label: 'PDF / DOCX Upload', icon: '', desc: 'Tài liệu file PDF / Word đính kèm',     color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
  figma:             { label: 'Figma',             icon: '', desc: 'Link Figma frame / design file',         color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
}

export interface KanbanTask {
  id: string
  title: string
  project: string
  role: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'High' | 'Medium' | 'Low'
  assignee: string
  isReleased?: boolean
}

export interface Project {
  id: string
  name: string
  description: string
  techStack: string
  stagingUrl?: string
  stagingAdminUrl?: string
  prodUrl?: string
  prodAdminUrl?: string
  bugListUrl?: string
  figmaUrl?: string
  sortOrder?: number
  createdAt: string
  updatedAt: string
}



// ── PHASE 2: QA Testing Lifecycle Data Artifacts ────────────────────────────

export interface TestScenario {
  id: string
  name: string
  description: string
}

export interface TestInputData {
  field: string
  validValues: string[]
  invalidValues: string[]
}

export interface TestCase {
  id: string
  scenarioId?: string
  feature: string
  title: string
  priority: 'P1' | 'P2' | 'P3'
  preconditions: string
  steps: string[]
  expectedResult: string
  type: 'positive' | 'negative' | 'edge'
  testData?: string
  executionStatus?: 'PASS' | 'FAIL' | 'BLOCKED' | 'UNTRIED'
  actualResult?: string
  bugId?: string
}

export interface TestPlanRisk {
  risk: string
  impact: 'Cao' | 'Trung bình' | 'Thấp'
  mitigation: string
}

export interface TestPlan {
  title: string
  version: string
  scope: string
  objectives: string[]
  testStrategy: string
  testTypes: string[]
  featuresToTest: string[]
  featuresToSkip: string[]
  entryExitCriteria: { entry: string[]; exit: string[] }
  risks: TestPlanRisk[]
  testEnvironment: string
  schedule: string
  resources: string[]
}

export interface AcceptanceCriteriaItem {
  id: string
  feature: string
  userStory: string
  scenarios: {
    title: string
    given: string
    when: string
    then: string
  }[]
}

export interface RegressionChecklistItem {
  id: string
  module: string
  title: string
  priority: 'P1' | 'P2' | 'P3'
  checkSteps: string
  expectedStatus: string
}

export interface TestReportSummary {
  title: string
  execDate: string
  summary: string
  totalCases: number
  passed: number
  failed: number
  blocked: number
  skipped: number
  criticalBugs: string[]
  recommendation: string
}

// ── Clarification (Requirements Analyst subagent) ──────────────────────────

export type ClarifyTargetType =
  | 'review-requirement'
  | 'acceptance-criteria'
  | 'test-strategy'
  | 'test-plan'
  | 'test-scenario'
  | 'test-cases'
  | 'regression-checklist'
  | 'test-report'

export type ClarifyCategory =
  | 'actors' | 'businessRules' | 'data' | 'coverage'
  | 'nonFunctional' | 'dependencies' | 'assumptions' | 'general'

export interface ClarifyQuestion {
  id: string
  category: ClarifyCategory
  question: string
  why: string
  suggestedAnswer: string
}

export interface ClarifyDataField {
  field: string
  constraints: string
}

export interface ClarificationReport {
  targetType: ClarifyTargetType
  understanding: string
  actors: string[]
  businessRules: string[]
  dataFields: ClarifyDataField[]
  testConditions: string[]
  coverageItems: string[]
  testTypes: string[]
  nonFunctional: string[]
  dependencies: string[]
  assumptions: string[]
  gaps: string[]
  questions: ClarifyQuestion[]
}

export type GeneratedDocType =
  | 'test-cases'
  | 'test-plan'
  | 'review-requirement'
  | 'acceptance-criteria'
  | 'test-strategy'
  | 'test-scenario'
  | 'regression-checklist'
  | 'test-report'

export interface GeneratedDocument {
  id: string
  projectId: string
  type: GeneratedDocType
  inputType: InputType
  inputSummary: string
  version: number
  parentDocId?: string
  createdAt: string
  content: any
  // for test-cases only
  scenarios?: TestScenario[]
  inputData?: TestInputData[]
}

// ── PHASE 1: Document Builder Agent (Requirements Generation Only) ──────────

export type DocBuilderType =
  | 'brd'
  | 'srs'
  | 'user-story'
  | 'change-request'
  | 'api-spec'

export type DocBuilderStandard = 'iso-25010' | 'ieee-830' | 'babok' | 'agile-template' | 'custom'

export interface DocBuilderQuestion {
  id: string
  section: string
  question: string
  why: string
  suggestedAnswer: string
}

export interface DocBuilderQuestionnaire {
  docType: DocBuilderType
  standard: DocBuilderStandard
  title: string
  overview: string
  questions: DocBuilderQuestion[]
}

export interface BuiltDocument {
  id: string
  projectId: string
  title: string
  docType: DocBuilderType
  standard: DocBuilderStandard
  contentMarkdown: string
  answers: Record<string, string>
  createdAt: string
}

export const DOC_BUILDER_TYPES: Record<DocBuilderType, { label: string; icon: string; desc: string }> = {
  brd:               { label: 'BRD',               icon: '', desc: 'Business Requirements Document (Nghiệp vụ doanh nghiệp & Bài toán kinh doanh)' },
  srs:               { label: 'SRS',               icon: '', desc: 'Software Requirements Specification (Đặc tả yêu cầu hệ thống & Kỹ thuật)' },
  'user-story':      { label: 'User Story',        icon: '', desc: 'Danh sách User Stories & Acceptance Criteria (Tiêu chí nghiệm thu)' },
  'change-request':  { label: 'Change Request (CR)',icon: '', desc: 'Yêu cầu thay đổi (CR) & Đánh giá tác động hệ thống (Impact Analysis)' },
  'api-spec':        { label: 'API Spec',          icon: '', desc: 'Đặc tả API Endpoint, Request/Response payload & Schema dữ liệu' },
}

export const DOC_BUILDER_STANDARDS: Record<DocBuilderStandard, { label: string; tag: string; desc: string }> = {
  'iso-25010':      { label: 'ISO/IEC 25010',      tag: 'Quality Standard',            desc: 'Chuẩn quốc tế về đặc tả chất lượng phần mềm' },
  'ieee-830':       { label: 'IEEE 830',           tag: 'SRS Standard',                desc: 'Chuẩn quốc tế kinh điển cho Software Requirements Specification' },
  'babok':          { label: 'BABOK Standard',     tag: 'Business Analysis Framework', desc: 'Khung chuẩn phân tích nghiệp vụ chuyên nghiệp' },
  'agile-template': { label: 'Agile / User Story', tag: 'Scrum/Agile Standard',        desc: 'Chuẩn Agile User Story & Acceptance Criteria' },
  'custom':         { label: 'Standard Enterprise',tag: 'Company Standard',            desc: 'Template doanh nghiệp tiêu chuẩn, chi tiết' },
}

export const DOC_TYPE_DEFAULT_STANDARD: Record<DocBuilderType, DocBuilderStandard> = {
  brd: 'babok',
  srs: 'ieee-830',
  'user-story': 'agile-template',
  'change-request': 'custom',
  'api-spec': 'iso-25010',
}

export const DOC_TYPE_RECOMMENDED_STANDARDS: Record<DocBuilderType, DocBuilderStandard[]> = {
  brd: ['babok', 'custom', 'iso-25010'],
  srs: ['ieee-830', 'iso-25010', 'custom'],
  'user-story': ['agile-template', 'babok', 'custom'],
  'change-request': ['custom', 'babok', 'ieee-830'],
  'api-spec': ['iso-25010', 'custom', 'ieee-830'],
}

// Strictly allowed standards per doc type to prevent invalid/irrelevant standards selection
export const DOC_TYPE_ALLOWED_STANDARDS: Record<DocBuilderType, DocBuilderStandard[]> = {
  brd: ['babok', 'iso-25010', 'custom'],
  srs: ['ieee-830', 'iso-25010', 'custom'],
  'user-story': ['agile-template', 'babok', 'custom'],
  'change-request': ['custom', 'babok', 'ieee-830'],
  'api-spec': ['iso-25010', 'custom', 'ieee-830'],
}

// ── PHASE 2: QA Testing Lifecycle Agents ────────────────────────────────────

export type QAAgentType =
  | 'review-requirement'
  | 'acceptance-criteria'
  | 'test-strategy'
  | 'test-plan'
  | 'test-scenario'
  | 'test-case'
  | 'regression-checklist'
  | 'test-report'

export interface QAAgentMeta {
  type: QAAgentType
  label: string
  icon: string
  desc: string
  stepOrder: number // 1 to 4 streamlined pipeline
  testingStandard: string // ISTQB / IEEE / ISO testing standard
  prerequisites: string[]
  badgeColor: string
}

export const QA_AGENTS: Record<string, QAAgentMeta> = {
  'review-requirement': {
    type: 'review-requirement',
    label: 'Requirements Review & Acceptance Criteria',
    icon: '🔍',
    desc: 'Rà soát đặc tả yêu cầu (Static Testing) & Tạo tiêu chí nghiệm thu BDD Gherkin (Given-When-Then)',
    stepOrder: 1,
    testingStandard: 'ISTQB Static Testing & Agile BDD',
    prerequisites: ['Cần ít nhất 1 Tài liệu Yêu cầu ở Phase 1 (BRD/SRS/User Story/Figma)'],
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  'test-plan': {
    type: 'test-plan',
    label: 'Master Test Strategy & Plan',
    icon: '📊',
    desc: 'Lập Chiến lược & Kế hoạch kiểm thử tổng thể (Scope, Risk Matrix, Criteria, Schedule & Resources)',
    stepOrder: 2,
    testingStandard: 'IEEE 829 / ISO 29119 Test Plan',
    prerequisites: ['Cần Step 1 Requirements Review & AC hoặc Requirement Baseline Phase 1'],
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  },
  'test-case': {
    type: 'test-case',
    label: 'Test Scenarios & Detailed Test Cases',
    icon: '🧪',
    desc: 'Sinh danh sách Kịch bản E2E & Bộ Test Cases chi tiết (P1/P2/P3, Steps, Expected & Test Data)',
    stepOrder: 3,
    testingStandard: 'ISTQB Test Design (EP & BVA)',
    prerequisites: ['Cần Step 2 Master Test Strategy & Plan hoặc Step 1 AC'],
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  },
  'test-report': {
    type: 'test-report',
    label: 'Regression Checklist & Test Summary Report',
    icon: '📝',
    desc: 'Danh mục kiểm thử hồi quy trước Release & Báo cáo tổng kết kết quả kèm đánh giá Go/No-Go',
    stepOrder: 4,
    testingStandard: 'ISO/IEC/IEEE 29119-3 & Risk-Based Testing',
    prerequisites: ['Cần Step 3 Test Scenarios & Detailed Test Cases'],
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
}
