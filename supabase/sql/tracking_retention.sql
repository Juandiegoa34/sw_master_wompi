-- ============================================================
-- Retención de datos de tracking — DirectorioSW
-- ============================================================
-- Elimina eventos de más de 90 días para mantener la BD liviana.
-- La página de estadísticas solo usa los últimos 30 días.
--
-- PREREQUISITO: habilitar pg_cron en Supabase Dashboard
--   Dashboard → Database → Extensions → buscar "pg_cron" → Enable
--
-- Luego ejecutar este script en el SQL Editor de Supabase.
-- ============================================================

-- Crear el job de limpieza (se ejecuta todos los días a las 3:00 AM UTC)
SELECT cron.schedule(
  'cleanup-tracking-90d',
  '0 3 * * *',
  $$
    DELETE FROM profile_views  WHERE viewed_at  < now() - INTERVAL '90 days';
    DELETE FROM contact_clicks WHERE clicked_at < now() - INTERVAL '90 days';
  $$
);

-- Para verificar que el job quedó registrado:
-- SELECT * FROM cron.job WHERE jobname = 'cleanup-tracking-90d';

-- Para eliminar el job si es necesario:
-- SELECT cron.unschedule('cleanup-tracking-90d');
