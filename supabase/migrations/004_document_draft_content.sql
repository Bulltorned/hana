-- Add draft_content column for storing document draft text
-- This allows users to preview and edit documents before generating PDF
ALTER TABLE document_requests
  ADD COLUMN IF NOT EXISTS draft_content TEXT;

-- Add index for faster document lookups by tenant + status
CREATE INDEX IF NOT EXISTS idx_document_requests_tenant_status
  ON document_requests (tenant_id, status);
