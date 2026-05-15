-- Agregar campos de Wompi a applications
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS wompi_reference VARCHAR(255),
  ADD COLUMN IF NOT EXISTS wompi_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMPTZ;

-- El campo receipt_path se vuelve opcional
ALTER TABLE applications
  ALTER COLUMN receipt_path DROP NOT NULL;

-- Índice para buscar por referencia de Wompi
CREATE INDEX IF NOT EXISTS idx_applications_wompi_reference
  ON applications(wompi_reference);
