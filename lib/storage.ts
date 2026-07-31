import fs from 'fs'
import path from 'path'
import { Project, GeneratedDocument, RawDocument, BuiltDocument } from './types'
import { isSupabaseConfigured, supabase } from './supabase'

const STORAGE_DIR = path.join(process.cwd(), 'storage')
const PROJECTS_FILE = path.join(STORAGE_DIR, 'projects.json')

// ── Local file helpers (only used when Supabase is NOT configured) ──────────

function ensureStorageDir() {
  if (isSupabaseConfigured) return
  try {
    if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true })
  } catch {}
}

function readProjects(): Project[] {
  if (isSupabaseConfigured) return []
  ensureStorageDir()
  try {
    if (!fs.existsSync(PROJECTS_FILE)) return []
    return JSON.parse(fs.readFileSync(PROJECTS_FILE, 'utf-8'))
  } catch {
    return []
  }
}

function writeProjects(projects: Project[]) {
  if (isSupabaseConfigured) return
  ensureStorageDir()
  try {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 2))
  } catch {}
}

function getProjectDir(projectId: string) {
  return path.join(STORAGE_DIR, 'projects', projectId)
}

function getDocsFile(projectId: string) {
  return path.join(getProjectDir(projectId), 'documents.json')
}

function getRawDocsFile(projectId: string) {
  return path.join(getProjectDir(projectId), 'raw-docs.json')
}

function getBuiltDocsFile(projectId: string) {
  return path.join(getProjectDir(projectId), 'built-docs.json')
}

function getInstructionFile(projectId: string) {
  return path.join(getProjectDir(projectId), 'system_instruction.md')
}

function ensureProjectDir(projectId: string) {
  if (isSupabaseConfigured) return ''
  const dir = getProjectDir(projectId)
  try {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  } catch {}
  return dir
}

// ── Storage API ────────────────────────────────────────────────────────────

export const storage = {
  // ── Projects ──────────────────────────────────────────────────────────────

  async getProjects(): Promise<Project[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description, "techStack", "stagingUrl", "stagingAdminUrl", "prodUrl", "prodAdminUrl", "figmaUrl", "bugListUrl", "createdAt", "updatedAt"')
        .order('createdAt', { ascending: false })
      if (!error && data) return data as Project[]
    }
    return readProjects()
  },

  async getProject(id: string): Promise<Project | undefined> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single()
      if (!error && data) return data as Project
    }
    return readProjects().find(p => p.id === id)
  },

  async saveProject(project: Project): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('projects').upsert(project)
      if (error) console.error('Supabase saveProject error:', error)
      return // skip local file write on Supabase mode
    }
    const projects = readProjects()
    const idx = projects.findIndex(p => p.id === project.id)
    if (idx >= 0) projects[idx] = project
    else projects.push(project)
    writeProjects(projects)
    ensureProjectDir(project.id)
  },

  async deleteProject(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('projects').delete().eq('id', id)
      return
    }
    const projects = readProjects().filter(p => p.id !== id)
    writeProjects(projects)
    const dir = getProjectDir(id)
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true })
  },

  // ── Generated Documents ───────────────────────────────────────────────────

  async getDocuments(projectId: string): Promise<GeneratedDocument[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('generated_documents')
        .select('*')
        .eq('projectId', projectId)
        .order('createdAt', { ascending: false })
      if (!error && data) return data as GeneratedDocument[]
    }
    const file = getDocsFile(projectId)
    if (!fs.existsSync(file)) return []
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  },

  async saveDocument(doc: GeneratedDocument): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('generated_documents').upsert(doc)
      if (error) console.error('Supabase saveDocument error:', error)
      return
    }
    ensureProjectDir(doc.projectId)
    const file = getDocsFile(doc.projectId)
    const docs: GeneratedDocument[] = fs.existsSync(file)
      ? JSON.parse(fs.readFileSync(file, 'utf-8'))
      : []
    const idx = docs.findIndex(d => d.id === doc.id)
    if (idx >= 0) docs[idx] = doc
    else docs.unshift(doc)
    fs.writeFileSync(file, JSON.stringify(docs, null, 2))
  },

  async deleteDocument(projectId: string, docId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('generated_documents').delete().eq('id', docId)
      return
    }
    const file = getDocsFile(projectId)
    if (!fs.existsSync(file)) return
    const docs = (JSON.parse(fs.readFileSync(file, 'utf-8')) as GeneratedDocument[])
      .filter(d => d.id !== docId)
    fs.writeFileSync(file, JSON.stringify(docs, null, 2))
  },

  // ── Raw Documents ─────────────────────────────────────────────────────────

  async getRawDocuments(projectId: string): Promise<RawDocument[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('raw_documents')
        .select('*')
        .eq('projectId', projectId)
        .order('createdAt', { ascending: false })
      if (!error && data) return data as RawDocument[]
    }
    const file = getRawDocsFile(projectId)
    if (!fs.existsSync(file)) return []
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  },

  async saveRawDocument(doc: RawDocument): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('raw_documents').upsert(doc)
      if (error) console.error('Supabase saveRawDocument error:', error)
      return
    }
    ensureProjectDir(doc.projectId)
    const file = getRawDocsFile(doc.projectId)
    const docs: RawDocument[] = fs.existsSync(file)
      ? JSON.parse(fs.readFileSync(file, 'utf-8'))
      : []
    const idx = docs.findIndex(d => d.id === doc.id)
    if (idx >= 0) docs[idx] = doc
    else docs.unshift(doc)
    fs.writeFileSync(file, JSON.stringify(docs, null, 2))
  },

  async deleteRawDocument(projectId: string, docId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('raw_documents').delete().eq('id', docId)
      return
    }
    const file = getRawDocsFile(projectId)
    if (!fs.existsSync(file)) return
    const docs = (JSON.parse(fs.readFileSync(file, 'utf-8')) as RawDocument[])
      .filter(d => d.id !== docId)
    fs.writeFileSync(file, JSON.stringify(docs, null, 2))
  },

  // ── Built Documents (Doc Builder) ─────────────────────────────────────────

  async getBuiltDocuments(projectId: string): Promise<BuiltDocument[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('built_documents')
        .select('*')
        .eq('projectId', projectId)
        .order('createdAt', { ascending: false })
      if (!error && data) return data as BuiltDocument[]
    }
    const file = getBuiltDocsFile(projectId)
    if (!fs.existsSync(file)) return []
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  },

  async saveBuiltDocument(doc: BuiltDocument): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('built_documents').upsert(doc)
      if (error) console.error('Supabase saveBuiltDocument error:', error)
      return
    }
    ensureProjectDir(doc.projectId)
    const file = getBuiltDocsFile(doc.projectId)
    const docs: BuiltDocument[] = fs.existsSync(file)
      ? JSON.parse(fs.readFileSync(file, 'utf-8'))
      : []
    const idx = docs.findIndex(d => d.id === doc.id)
    if (idx >= 0) docs[idx] = doc
    else docs.unshift(doc)
    fs.writeFileSync(file, JSON.stringify(docs, null, 2))
  },

  async deleteBuiltDocument(projectId: string, docId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('built_documents').delete().eq('id', docId)
      return
    }
    const file = getBuiltDocsFile(projectId)
    if (!fs.existsSync(file)) return
    const docs = (JSON.parse(fs.readFileSync(file, 'utf-8')) as BuiltDocument[])
      .filter(d => d.id !== docId)
    fs.writeFileSync(file, JSON.stringify(docs, null, 2))
  },

  // ── System Instruction ────────────────────────────────────────────────────

  async getInstruction(projectId: string): Promise<string> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('project_instructions')
        .select('instruction')
        .eq('projectId', projectId)
        .single()
      if (!error && data) return data.instruction || ''
      return ''
    }
    const file = getInstructionFile(projectId)
    if (!fs.existsSync(file)) return ''
    return fs.readFileSync(file, 'utf-8')
  },

  async saveInstruction(projectId: string, content: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('project_instructions')
        .upsert({ projectId, instruction: content, updatedAt: new Date().toISOString() })
      if (error) console.error('Supabase saveInstruction error:', error)
      return
    }
    ensureProjectDir(projectId)
    fs.writeFileSync(getInstructionFile(projectId), content, 'utf-8')
  },
}
