-- Agrega campos para integrar la referencia de Wompi en la tabla applications
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS wompi_reference VARCHAR(255);

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS wompi_status VARCHAR(50) DEFAULT 'pending';

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMPTZ;

-- Hacer receipt_path opcional si no lo es
ALTER TABLE applications
  ALTER COLUMN receipt_path DROP NOT NULL;

-- Índice para búsqueda por referencia
CREATE INDEX IF NOT EXISTS idx_applications_wompi_reference ON applications(wompi_reference);
