-- Add void support and payment method tracking
ALTER TABLE public.payments
  ADD COLUMN voided_at timestamptz,
  ADD COLUMN method text NOT NULL DEFAULT 'manual'
    CHECK (method IN ('quick', 'manual', 'migration'));
