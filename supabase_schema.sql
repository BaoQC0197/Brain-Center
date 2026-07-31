-- SQL Migration Schema for QA Brain (Supabase PostgreSQL)
-- Run this script in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

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
  "createdAt" TEXT NOT NULL
);

-- 2. Raw Documents Table (Input docs for Phase 1)
CREATE TABLE IF NOT EXISTS public.raw_documents (
  id TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  "textContent" TEXT,
  "figmaUrl" TEXT,
  "audioUrl" TEXT,
  "createdAt" TEXT NOT NULL
);

-- 3. Generated Documents Table (Test plans, Test cases, QA agent outputs)
CREATE TABLE IF NOT EXISTS public.generated_documents (
  id TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  "rawDocIds" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TEXT NOT NULL
);

-- 4. Built Documents Table (Doc Builder Agent)
CREATE TABLE IF NOT EXISTS public.built_documents (
  id TEXT PRIMARY KEY,
  "projectId" TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  qa JSONB NOT NULL,
  "rawDocIds" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TEXT NOT NULL
);

-- 5. Project Instructions Table
CREATE TABLE IF NOT EXISTS public.project_instructions (
  "projectId" TEXT PRIMARY KEY REFERENCES public.projects(id) ON DELETE CASCADE,
  instruction TEXT NOT NULL,
  "updatedAt" TEXT NOT NULL
);

-- Row Level Security (RLS) Policies (Enable Public Access for API Keys)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.built_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_instructions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON public.projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.projects FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.projects FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.raw_documents FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON public.raw_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.raw_documents FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.raw_documents FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.generated_documents FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON public.generated_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.generated_documents FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.generated_documents FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.built_documents FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON public.built_documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.built_documents FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.built_documents FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access" ON public.project_instructions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access" ON public.project_instructions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access" ON public.project_instructions FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access" ON public.project_instructions FOR DELETE USING (true);
