-- ============================================================
-- 002_weekly_inspection_photo.sql
-- 주간 점검 외관 사진 URL 컬럼 추가 + Storage 버킷 설정
-- ============================================================

ALTER TABLE weekly_inspections
  ADD COLUMN IF NOT EXISTS exterior_photo_url TEXT;

-- Storage 버킷 (로컬 dev에서는 수동 생성 필요 — 아래 INSERT로 처리)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'inspection-photos',
  'inspection-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "authenticated_upload_inspection_photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'inspection-photos');

CREATE POLICY "public_read_inspection_photos"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'inspection-photos');

CREATE POLICY "authenticated_delete_inspection_photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'inspection-photos');
