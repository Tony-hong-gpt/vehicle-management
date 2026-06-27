-- ============================================================
-- 001_initial_schema.sql
-- 교회 통합 차량 관리 시스템 — 초기 스키마
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 헬퍼 함수: 현재 사용자의 role 반환 (public 스키마)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role'),
    'field'
  )
$$;

-- ─────────────────────────────────────────────────────────────
-- 1. vehicles
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vehicles (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   TEXT        NOT NULL,
  plate                  TEXT        NOT NULL UNIQUE,
  fuel_type              TEXT        CHECK (fuel_type IN ('diesel','gasoline','electric','hybrid')),
  year                   INTEGER,
  capacity               INTEGER,
  current_mileage        INTEGER     DEFAULT 0,
  insurance_company      TEXT,
  insurance_policy_no    TEXT,
  insurance_expire_date  DATE,
  last_inspection_date   DATE,
  next_inspection_date   DATE,
  last_tax_paid_date     DATE,
  tax_payment_method     TEXT        DEFAULT 'direct',
  annual_tax_prepaid     BOOLEAN     DEFAULT false,
  vin                    TEXT,
  primary_operation_time TEXT,
  assigned_field_user_id UUID        REFERENCES auth.users(id),
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- admin: 전체 접근
CREATE POLICY "admin_all_vehicles" ON vehicles
  FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- field: 담당 차량만 조회
CREATE POLICY "field_own_vehicles" ON vehicles
  FOR SELECT
  USING (
    public.current_user_role() = 'field'
    AND assigned_field_user_id = auth.uid()
  );

-- ─────────────────────────────────────────────────────────────
-- 2. weekly_inspections
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_inspections (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id     UUID        NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  week_start     DATE        NOT NULL,
  mileage        INTEGER     NOT NULL,
  exterior_ok    BOOLEAN     NOT NULL,
  interior_clean TEXT        CHECK (interior_clean IN ('good','fair','poor')),
  car_wash_done  BOOLEAN     DEFAULT false,
  lights_ok      BOOLEAN     NOT NULL,
  fluids_ok      BOOLEAN     NOT NULL,
  tire_status    TEXT        CHECK (tire_status IN ('normal','wear','replace')),
  note           TEXT,
  submitted_by   UUID        REFERENCES auth.users(id),
  submitted_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vehicle_id, week_start)
);

ALTER TABLE weekly_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_weekly" ON weekly_inspections
  FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "field_own_weekly" ON weekly_inspections
  FOR ALL
  USING (
    public.current_user_role() = 'field'
    AND EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = weekly_inspections.vehicle_id
        AND v.assigned_field_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.current_user_role() = 'field'
    AND EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = weekly_inspections.vehicle_id
        AND v.assigned_field_user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 3. maintenance_records
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_records (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id          UUID        NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  part_category       TEXT        NOT NULL,
  part_name           TEXT        NOT NULL,
  mileage_at_service  INTEGER     NOT NULL,
  service_date        DATE        NOT NULL,
  cost                INTEGER,
  receipt_url         TEXT,
  note                TEXT,
  registered_by       UUID        REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_maintenance" ON maintenance_records
  FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "field_own_maintenance" ON maintenance_records
  FOR ALL
  USING (
    public.current_user_role() = 'field'
    AND EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = maintenance_records.vehicle_id
        AND v.assigned_field_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.current_user_role() = 'field'
    AND EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = maintenance_records.vehicle_id
        AND v.assigned_field_user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 4. incident_records
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incident_records (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id    UUID        NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  incident_type TEXT        CHECK (incident_type IN ('damage','battery_dead','other')),
  photo_url     TEXT,
  note          TEXT        NOT NULL,
  registered_by UUID        REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE incident_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_incidents" ON incident_records
  FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "field_own_incidents" ON incident_records
  FOR ALL
  USING (
    public.current_user_role() = 'field'
    AND EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = incident_records.vehicle_id
        AND v.assigned_field_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.current_user_role() = 'field'
    AND EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = incident_records.vehicle_id
        AND v.assigned_field_user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 5. legal_documents
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS legal_documents (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id  UUID        NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  doc_type    TEXT        CHECK (doc_type IN ('insurance','inspection','tax','license')),
  expire_date DATE,
  photo_url   TEXT,
  note        TEXT,
  updated_by  UUID        REFERENCES auth.users(id),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_legal" ON legal_documents
  FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "field_own_legal" ON legal_documents
  FOR ALL
  USING (
    public.current_user_role() = 'field'
    AND EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = legal_documents.vehicle_id
        AND v.assigned_field_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.current_user_role() = 'field'
    AND EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = legal_documents.vehicle_id
        AND v.assigned_field_user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 6. consumable_defaults
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consumable_defaults (
  id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  part_name      TEXT    NOT NULL UNIQUE,
  part_category  TEXT    NOT NULL,
  default_km     INTEGER,
  default_months INTEGER,
  min_km         INTEGER,
  min_months     INTEGER,
  sort_order     INTEGER DEFAULT 0
);

ALTER TABLE consumable_defaults ENABLE ROW LEVEL SECURITY;

-- 전체 사용자 조회 가능 (기준값은 공개)
CREATE POLICY "all_read_consumable_defaults" ON consumable_defaults
  FOR SELECT
  USING (true);

-- admin만 수정 가능
CREATE POLICY "admin_write_consumable_defaults" ON consumable_defaults
  FOR INSERT
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "admin_update_consumable_defaults" ON consumable_defaults
  FOR UPDATE
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "admin_delete_consumable_defaults" ON consumable_defaults
  FOR DELETE
  USING (public.current_user_role() = 'admin');

-- ─────────────────────────────────────────────────────────────
-- 7. consumable_thresholds
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consumable_thresholds (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id    UUID        NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  part_name     TEXT        NOT NULL,
  custom_km     INTEGER,
  custom_months INTEGER,
  modified_by   UUID        REFERENCES auth.users(id),
  modified_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vehicle_id, part_name)
);

ALTER TABLE consumable_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_thresholds" ON consumable_thresholds
  FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "field_own_thresholds" ON consumable_thresholds
  FOR ALL
  USING (
    public.current_user_role() = 'field'
    AND EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = consumable_thresholds.vehicle_id
        AND v.assigned_field_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.current_user_role() = 'field'
    AND EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = consumable_thresholds.vehicle_id
        AND v.assigned_field_user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 8. threshold_change_log
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS threshold_change_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id  UUID        REFERENCES vehicles(id) ON DELETE CASCADE,
  part_name   TEXT,
  old_km      INTEGER,
  old_months  INTEGER,
  new_km      INTEGER,
  new_months  INTEGER,
  changed_by  UUID        REFERENCES auth.users(id),
  changed_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE threshold_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_change_log" ON threshold_change_log
  FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "field_own_change_log" ON threshold_change_log
  FOR ALL
  USING (
    public.current_user_role() = 'field'
    AND EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = threshold_change_log.vehicle_id
        AND v.assigned_field_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.current_user_role() = 'field'
    AND EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = threshold_change_log.vehicle_id
        AND v.assigned_field_user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 9. drivers
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drivers (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT        NOT NULL,
  license_type         TEXT,
  license_expire_date  DATE,
  assigned_vehicle_ids UUID[],
  created_at           TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_drivers" ON drivers
  FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

CREATE POLICY "field_read_drivers" ON drivers
  FOR SELECT
  USING (
    public.current_user_role() = 'field'
    AND EXISTS (
      SELECT 1 FROM vehicles v
      WHERE v.id = ANY(drivers.assigned_vehicle_ids)
        AND v.assigned_field_user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 10. notifications
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id UUID        REFERENCES vehicles(id) ON DELETE CASCADE,
  notif_type TEXT,
  title      TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  is_read    BOOLEAN     DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_notifications" ON notifications
  FOR ALL
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- 수신자 본인만 자신의 알림 접근
CREATE POLICY "user_own_notifications" ON notifications
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- updated_at 자동 갱신 트리거
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─────────────────────────────────────────────────────────────
-- 역할별 테이블 권한
-- ─────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.vehicles,
  public.weekly_inspections,
  public.maintenance_records,
  public.incident_records,
  public.legal_documents,
  public.consumable_defaults,
  public.consumable_thresholds,
  public.threshold_change_log,
  public.drivers,
  public.notifications
TO anon, authenticated, service_role;
