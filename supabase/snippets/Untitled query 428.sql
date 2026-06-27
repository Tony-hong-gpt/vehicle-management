ALTER TABLE consumable_defaults ADD COLUMN IF NOT EXISTS image_url TEXT;

UPDATE consumable_defaults SET image_url = '/images/parts/engine-oil.svg'        WHERE part_name = '엔진오일';
UPDATE consumable_defaults SET image_url = '/images/parts/engine-oil-filter.svg' WHERE part_name = '엔진오일 필터';
UPDATE consumable_defaults SET image_url = '/images/parts/air-cleaner.svg'       WHERE part_name = '에어클리너';
UPDATE consumable_defaults SET image_url = '/images/parts/brake-pad.svg'         WHERE part_name = '브레이크 패드';
UPDATE consumable_defaults SET image_url = '/images/parts/tire.svg'              WHERE part_name = '타이어';
UPDATE consumable_defaults SET image_url = '/images/parts/battery.svg'           WHERE part_name = '시동 배터리';
UPDATE consumable_defaults SET image_url = '/images/parts/ac-filter.svg'         WHERE part_name = '에어컨 필터';
UPDATE consumable_defaults SET image_url = '/images/parts/wiper.svg'             WHERE part_name = '와이퍼 블레이드'; 