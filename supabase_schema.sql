-- ==============================================================================
-- FULL SQL SCHEMA & MIGRATION FOR QA BRAIN (SUPABASE POSTGRESQL)
-- Run this script in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  "techStack" TEXT,
  "stagingUrl" TEXT,
  "stagingAdminUrl" TEXT,
  "prodUrl" TEXT,
  "prodAdminUrl" TEXT,
  "figmaUrl" TEXT,
  "bugListUrl" TEXT,
  "sortOrder" INT DEFAULT 0,
  "createdAt" TEXT NOT NULL,
  "updatedAt" TEXT
);

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS "sortOrder" INT DEFAULT 0;

-- Ensure all columns exist for existing projects table
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS "techStack" TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS "stagingUrl" TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS "stagingAdminUrl" TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS "prodUrl" TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS "prodAdminUrl" TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS "figmaUrl" TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS "bugListUrl" TEXT;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS "updatedAt" TEXT;

-- 2. Raw Documents Table (Input docs for Phase 1)
CREATE TABLE IF NOT EXISTS public.raw_documents (
  id TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  "textContent" TEXT,
  "imageBase64" TEXT,
  "imageMime" TEXT,
  "audioBase64" TEXT,
  "audioMime" TEXT,
  "figmaUrl" TEXT,
  "createdAt" TEXT NOT NULL
);

-- Ensure all columns exist for raw_documents
ALTER TABLE public.raw_documents ADD COLUMN IF NOT EXISTS "textContent" TEXT;
ALTER TABLE public.raw_documents ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;
ALTER TABLE public.raw_documents ADD COLUMN IF NOT EXISTS "fileName" TEXT;
ALTER TABLE public.raw_documents ADD COLUMN IF NOT EXISTS "imageBase64" TEXT;
ALTER TABLE public.raw_documents ADD COLUMN IF NOT EXISTS "imageMime" TEXT;
ALTER TABLE public.raw_documents ADD COLUMN IF NOT EXISTS "audioBase64" TEXT;
ALTER TABLE public.raw_documents ADD COLUMN IF NOT EXISTS "audioMime" TEXT;
ALTER TABLE public.raw_documents ADD COLUMN IF NOT EXISTS "figmaUrl" TEXT;

-- 3. Generated Documents Table (Test plans, Test cases, QA agent outputs)
CREATE TABLE IF NOT EXISTS public.generated_documents (
  id TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT,
  "inputType" TEXT,
  "inputSummary" TEXT,
  version INT DEFAULT 1,
  "parentDocId" TEXT,
  content JSONB NOT NULL,
  scenarios JSONB DEFAULT '[]'::jsonb,
  "inputData" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TEXT NOT NULL
);

-- Ensure all columns exist for generated_documents
ALTER TABLE public.generated_documents ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.generated_documents ALTER COLUMN title DROP NOT NULL;
ALTER TABLE public.generated_documents ADD COLUMN IF NOT EXISTS "inputType" TEXT;
ALTER TABLE public.generated_documents ADD COLUMN IF NOT EXISTS "inputSummary" TEXT;
ALTER TABLE public.generated_documents ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;
ALTER TABLE public.generated_documents ADD COLUMN IF NOT EXISTS "parentDocId" TEXT;
ALTER TABLE public.generated_documents ADD COLUMN IF NOT EXISTS scenarios JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.generated_documents ADD COLUMN IF NOT EXISTS "inputData" JSONB DEFAULT '[]'::jsonb;

-- 4. Built Documents Table (Doc Builder Agent)
CREATE TABLE IF NOT EXISTS public.built_documents (
  id TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT,
  "docType" TEXT,
  standard TEXT,
  "contentMarkdown" TEXT NOT NULL,
  answers JSONB DEFAULT '{}'::jsonb,
  "createdAt" TEXT NOT NULL
);

-- Ensure all columns exist for built_documents
ALTER TABLE public.built_documents ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.built_documents ALTER COLUMN type DROP NOT NULL;
ALTER TABLE public.built_documents ADD COLUMN IF NOT EXISTS "docType" TEXT;
ALTER TABLE public.built_documents ADD COLUMN IF NOT EXISTS standard TEXT;
ALTER TABLE public.built_documents ADD COLUMN IF NOT EXISTS "contentMarkdown" TEXT;
ALTER TABLE public.built_documents ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}'::jsonb;

-- 5. Project Instructions Table
CREATE TABLE IF NOT EXISTS public.project_instructions (
  "projectId" TEXT PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  instruction TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

-- Enable Row Level Security (RLS) Policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.built_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_instructions ENABLE ROW LEVEL SECURITY;

-- Grant Full RLS Policies for Anonymous Key Access
DROP POLICY IF EXISTS "Allow anonymous read access" ON public.projects;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON public.projects;
DROP POLICY IF EXISTS "Allow anonymous update access" ON public.projects;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON public.projects;
CREATE POLICY "Allow anonymous read access" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.projects FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow anonymous read access" ON public.raw_documents;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON public.raw_documents;
DROP POLICY IF EXISTS "Allow anonymous update access" ON public.raw_documents;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON public.raw_documents;
CREATE POLICY "Allow anonymous read access" ON public.raw_documents FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON public.raw_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.raw_documents FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.raw_documents FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow anonymous read access" ON public.generated_documents;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON public.generated_documents;
DROP POLICY IF EXISTS "Allow anonymous update access" ON public.generated_documents;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON public.generated_documents;
CREATE POLICY "Allow anonymous read access" ON public.generated_documents FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON public.generated_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.generated_documents FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.generated_documents FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow anonymous read access" ON public.built_documents;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON public.built_documents;
DROP POLICY IF EXISTS "Allow anonymous update access" ON public.built_documents;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON public.built_documents;
CREATE POLICY "Allow anonymous read access" ON public.built_documents FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON public.built_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.built_documents FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.built_documents FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow anonymous read access" ON public.project_instructions;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON public.project_instructions;
DROP POLICY IF EXISTS "Allow anonymous update access" ON public.project_instructions;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON public.project_instructions;
CREATE POLICY "Allow anonymous read access" ON public.project_instructions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON public.project_instructions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.project_instructions FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.project_instructions FOR DELETE USING (true);

-- 6. Global Configs Table (System Instruction & Task Prompts)
CREATE TABLE IF NOT EXISTS public.global_configs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

ALTER TABLE public.global_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous read access" ON public.global_configs;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON public.global_configs;
DROP POLICY IF EXISTS "Allow anonymous update access" ON public.global_configs;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON public.global_configs;
CREATE POLICY "Allow anonymous read access" ON public.global_configs FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON public.global_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.global_configs FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.global_configs FOR DELETE USING (true);

-- 7. Kanban Tasks Table (Persistence across browsers & team members)
CREATE TABLE IF NOT EXISTS public.kanban_tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  project TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
  priority TEXT NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
  assignee TEXT,
  "assigneeId" TEXT,
  "isReleased" BOOLEAN DEFAULT false,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text,
  "updatedAt" TEXT
);

ALTER TABLE public.kanban_tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.kanban_tasks ADD COLUMN IF NOT EXISTS "assigneeId" TEXT;
ALTER TABLE public.kanban_tasks ADD COLUMN IF NOT EXISTS "isReleased" BOOLEAN DEFAULT false;

ALTER TABLE public.kanban_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous read access" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Allow anonymous update access" ON public.kanban_tasks;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON public.kanban_tasks;
CREATE POLICY "Allow anonymous read access" ON public.kanban_tasks FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON public.kanban_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.kanban_tasks FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.kanban_tasks FOR DELETE USING (true);

-- 8. User Profiles Table (Accounts for Team Members & Assignees)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  "fullName" TEXT NOT NULL,
  role TEXT NOT NULL,
  "avatarUrl" TEXT,
  "passwordHash" TEXT,
  "createdAt" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP::text
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous read access" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow anonymous update access" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow anonymous delete access" ON public.user_profiles;
CREATE POLICY "Allow anonymous read access" ON public.user_profiles FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON public.user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.user_profiles FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.user_profiles FOR DELETE USING (true);


