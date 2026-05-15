-- Rate limiting table. Stores one row per attempt.
-- Cleaned up hourly by pg_cron to keep the table small.

create table if not exists rate_limit_attempts (
  id         uuid        primary key default gen_random_uuid(),
  key        text        not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_attempts_key_created_at
  on rate_limit_attempts (key, created_at);

-- Cleanup job: delete rows older than 2 hours, runs every hour.
-- Requires pg_cron extension enabled in Supabase dashboard.
select cron.schedule(
  'cleanup-rate-limits',
  '0 * * * *',
  $$delete from rate_limit_attempts where created_at < now() - interval '2 hours'$$
);
