-- Cron Job 설정 (pg_cron + Supabase Edge Functions)
-- Vercel 배포 후 Supabase 대시보드 > Edge Functions > Schedules 에서 설정하거나
-- 아래 SQL을 Supabase SQL Editor에서 실행

-- pg_cron 확장 활성화 (Supabase에서 기본 활성화됨)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 매일 00:00 (KST 09:00 UTC) — 소모품·법정 만기 스캔
SELECT cron.schedule(
  'daily-scan',
  '0 15 * * *',  -- UTC 15:00 = KST 00:00
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/daily-scan',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 매주 월요일 09:00 (KST) = UTC 00:00 월요일
SELECT cron.schedule(
  'weekly-reminder',
  '0 0 * * 1',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/weekly-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 매주 월요일 12:00 (KST) = UTC 03:00 월요일
SELECT cron.schedule(
  'weekly-auto-yellow',
  '0 3 * * 1',
  $$
  SELECT net.http_post(
    url := current_setting('app.supabase_url') || '/functions/v1/weekly-auto-yellow',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body := '{}'::jsonb
  );
  $$
);
