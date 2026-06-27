-- ============================================================
-- seed.sql — 교회 통합 차량 관리 시스템 개발용 초기 데이터
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- consumable_defaults: 소모품 기본 알림 기준 (18개)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE consumable_defaults ADD COLUMN IF NOT EXISTS image_url TEXT;

INSERT INTO consumable_defaults
  (part_name, part_category, default_km, default_months, min_km, min_months, sort_order)
VALUES
  ('엔진오일',          '엔진 및 구동계', 10000,  6,    5000,  3,    1),
  ('엔진오일 필터',     '엔진 및 구동계', 10000,  6,    5000,  3,    2),
  ('에어클리너',        '엔진 및 구동계', 15000,  12,   7500,  6,    3),
  ('미션오일',          '엔진 및 구동계', 50000,  48,   25000, 24,   4),
  ('부동액/냉각수',     '엔진 및 구동계', 40000,  24,   20000, 12,   5),
  ('구동 벨트',         '엔진 및 구동계', 40000,  36,   20000, 18,   6),
  ('타이밍 벨트',       '엔진 및 구동계', 100000, 84,   50000, 48,   7),
  ('브레이크 패드',     '제동 및 하체',   30000,  24,   15000, 12,   8),
  ('브레이크 오일',     '제동 및 하체',   40000,  24,   20000, 12,   9),
  ('타이어',            '제동 및 하체',   50000,  48,   25000, 24,   10),
  ('휠 얼라이먼트',     '제동 및 하체',   10000,  NULL, 5000,  NULL, 12),
  ('시동 배터리',       '전기 및 전장',   NULL,   36,   NULL,  18,   13),
  ('전조등',            '전기 및 전장',   NULL,   NULL, NULL,  NULL, 14),
  ('브레이크등/후미등', '전기 및 전장',   NULL,   NULL, NULL,  NULL, 15),
  ('방향지시등',        '전기 및 전장',   NULL,   NULL, NULL,  NULL, 16),
  ('에어컨 필터',       '일반 소모품',    5000,   6,    2500,  3,    17),
  ('와이퍼 블레이드',   '일반 소모품',    NULL,   12,   NULL,  6,    18),
  ('워셔액',            '일반 소모품',    NULL,   1,    NULL,  NULL, 19)
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

-- ─────────────────────────────────────────────────────────────
-- vehicles: 테스트용 차량 5대
-- ─────────────────────────────────────────────────────────────
INSERT INTO vehicles
  (name, plate, fuel_type, capacity, current_mileage,
   insurance_expire_date, last_inspection_date, next_inspection_date)
VALUES
  ('대형버스 A', '서울12가3456', 'diesel',   45, 120000, '2027-03-31', '2025-12-01', '2026-06-01'),
  ('중형버스 B', '서울34나5678', 'diesel',   25,  85000, '2027-01-15', '2026-01-10', '2027-01-10'),
  ('12인승 C',   '서울56다7890', 'diesel',   12,  47000, '2026-11-30', '2025-11-20', '2026-11-20'),
  ('7인승 D',    '서울78라1234', 'gasoline',  7,  32000, '2027-05-20', '2024-12-05', '2026-12-05'),
  ('승용차 E',   '서울90마5678', 'gasoline',  5,  18000, '2026-09-10', '2025-09-15', '2027-09-15')
ON CONFLICT (plate) DO NOTHING;
