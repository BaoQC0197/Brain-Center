-- ==============================================================================
-- PERFORMANCE INDEXES FOR QA BRAIN (SUPABASE POSTGRESQL)
-- Run this in your Supabase SQL Editor after the main schema
-- ==============================================================================

-- Index for raw_documents by projectId (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_raw_documents_project_id ON public.raw_documents ("projectId");

-- Index for generated_documents by projectId
CREATE INDEX IF NOT EXISTS idx_generated_documents_project_id ON public.generated_documents ("projectId");

-- Index for generated_documents by projectId + type (for filtering by agent type)
CREATE INDEX IF NOT EXISTS idx_generated_documents_project_type ON public.generated_documents ("projectId", type);

-- Index for built_documents by projectId
CREATE INDEX IF NOT EXISTS idx_built_documents_project_id ON public.built_documents ("projectId");

-- Index for projects ordered by createdAt
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects ("createdAt" DESC);

-- Index for generated_documents ordered by createdAt
CREATE INDEX IF NOT EXISTS idx_generated_documents_created_at ON public.generated_documents ("createdAt" DESC);
