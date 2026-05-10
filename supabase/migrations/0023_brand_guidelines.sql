-- =============================================================
-- 0023_brand_guidelines.sql
-- Adds brand identity vault storage to the businesses table
-- =============================================================

ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS brand_colors JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS brand_typography JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS brand_tone_of_voice TEXT,
ADD COLUMN IF NOT EXISTS brand_strategy_url TEXT;

-- Example JSON structure for brand_colors:
-- [
--   { "name": "Primary", "hex": "#121212" },
--   { "name": "Accent", "hex": "#00f2fe" }
-- ]

-- Example JSON structure for brand_typography:
-- [
--   { "usage": "Headers", "font_family": "Inter", "weight": "700" },
--   { "usage": "Body", "font_family": "Roboto", "weight": "400" }
-- ]
