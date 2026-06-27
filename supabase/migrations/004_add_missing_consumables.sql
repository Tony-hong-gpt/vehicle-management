-- ============================================================
-- 004_add_missing_consumables.sql
-- 소모품 10개 추가 + image_url 컬럼 추가
-- ============================================================

-- image_url 컬럼 추가
ALTER TABLE consumable_defaults ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 누락 소모품 9개 추가 (엔진오일 필터, 에어클리너, 타이밍 벨트,
--   브레이크 오일, 휠 얼라이먼트, 전조등, 브레이크등/후미등, 방향지시등, 워셔액)
INSERT INTO consumable_defaults (part_name, part_category, default_km, default_months, min_km, min_months, sort_order) VALUES
  ('엔진오일 필터',    '엔진 및 구동계', 10000,  6,    5000,  3,    2),
  ('에어클리너',       '엔진 및 구동계', 15000,  12,   7500,  6,    3),
  ('타이밍 벨트',      '엔진 및 구동계', 100000, 84,   50000, 48,   7),
  ('브레이크 오일',    '제동 및 하체',   40000,  24,   20000, 12,   9),
  ('휠 얼라이먼트',    '제동 및 하체',   10000,  NULL, 5000,  NULL, 12),
  ('전조등',           '전기 및 전장',   NULL,   NULL, NULL,  NULL, 14),
  ('브레이크등/후미등','전기 및 전장',   NULL,   NULL, NULL,  NULL, 15),
  ('방향지시등',       '전기 및 전장',   NULL,   NULL, NULL,  NULL, 16),
  ('워셔액',           '일반 소모품',    NULL,   1,    NULL,  NULL, 19)
ON CONFLICT (part_name) DO NOTHING;

-- 부품별 이미지 경로 (public/images/parts/ 폴더 기준)
UPDATE consumable_defaults SET image_url = '/images/parts/engine-oil.svg'        WHERE part_name = '엔진오일';
UPDATE consumable_defaults SET image_url = '/images/parts/engine-oil-filter.svg' WHERE part_name = '엔진오일 필터';
UPDATE consumable_defaults SET image_url = '/images/parts/air-cleaner.svg'       WHERE part_name = '에어클리너';
UPDATE consumable_defaults SET image_url = '/images/parts/brake-pad.svg'         WHERE part_name = '브레이크 패드';
UPDATE consumable_defaults SET image_url = '/images/parts/tire.svg'              WHERE part_name = '타이어';
UPDATE consumable_defaults SET image_url = '/images/parts/battery.svg'           WHERE part_name = '시동 배터리';
UPDATE consumable_defaults SET image_url = '/images/parts/ac-filter.svg'         WHERE part_name = '에어컨 필터';
UPDATE consumable_defaults SET image_url = '/images/parts/wiper.svg'             WHERE part_name = '와이퍼 블레이드';
