-- Tabla para registrar transacciones de pasarela de pagos
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL,
  entrepreneur_id uuid NOT NULL,
  product_id uuid NOT NULL,

  provider text NOT NULL,
  provider_payment_id text,
  provider_reference text UNIQUE,

  status text NOT NULL DEFAULT 'pending',
  amount_cop integer NOT NULL,
  currency text NOT NULL DEFAULT 'COP',

  checkout_url text,
  raw_provider_payload jsonb,

  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  paid_at timestamp with time zone,

  CONSTRAINT payment_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT payment_transactions_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id),
  CONSTRAINT payment_transactions_entrepreneur_id_fkey FOREIGN KEY (entrepreneur_id) REFERENCES public.entrepreneurs(id),
  CONSTRAINT payment_transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_reference ON public.payment_transactions(provider_reference);
