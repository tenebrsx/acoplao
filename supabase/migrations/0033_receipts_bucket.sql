-- =============================================================
-- 0033_receipts_bucket.sql
-- Create storage bucket for expense receipts
-- =============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for receipts
CREATE POLICY "Anyone can view receipts"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'receipts');

CREATE POLICY "Admins and managers can upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true)
  );

CREATE POLICY "Admins and managers can delete receipts"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'receipts' AND 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager') AND is_active = true)
  );
