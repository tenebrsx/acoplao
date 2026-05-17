-- Add tags support to documents
ALTER TABLE public.documents ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Index for tags searching
CREATE INDEX idx_documents_tags ON public.documents USING GIN (tags);
