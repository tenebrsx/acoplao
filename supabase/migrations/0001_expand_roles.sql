-- Expand the user_role ENUM to include 'manager' and 'client'
-- Note: PostgreSQL doesn't support 'IF NOT EXISTS' for ADD VALUE natively in older versions in a single block, 
-- but in modern Postgres, we can just run it. If it fails because it exists, that's fine.

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'client';
