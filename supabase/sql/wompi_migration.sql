-- Migración: Agregar campos de Wompi a tabla applications
-- Esta migración añade los campos necesarios para el procesamiento de pagos con Wompi

-- 1. Agregar columna payment_completed_at si no existe
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS payment_completed_at timestamp with time zone;

-- 2. Agregar columna wompi_reference si no existe
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS wompi_reference text;

-- 3. Agregar columna wompi_status si no existe
ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS wompi_status text;

-- 4. Crear índice en wompi_reference para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_applications_wompi_reference ON public.applications(wompi_reference);

-- 5. Crear índice en wompi_status para filtrados
CREATE INDEX IF NOT EXISTS idx_applications_wompi_status ON public.applications(wompi_status);

-- 6. Agregar constraint de check para wompi_status si no existe
DO $$
BEGIN
  ALTER TABLE public.applications
  ADD CONSTRAINT check_wompi_status CHECK (wompi_status IS NULL OR wompi_status IN ('pending', 'completed', 'failed', 'declined'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Comentarios para documentación
COMMENT ON COLUMN public.applications.payment_completed_at IS 'Timestamp cuando el pago fue completado por Wompi';
COMMENT ON COLUMN public.applications.wompi_reference IS 'Referencia única de la transacción en Wompi';
COMMENT ON COLUMN public.applications.wompi_status IS 'Estado del pago en Wompi: pending, completed, failed, declined';
