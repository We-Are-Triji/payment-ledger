-- Immutable audit log table
CREATE TABLE public.audit_log (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_id  uuid        NOT NULL REFERENCES public.ledger_config(id) ON DELETE CASCADE,
  event_type text        NOT NULL,
  description text       NOT NULL,
  metadata   jsonb       NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_ledger  ON public.audit_log(ledger_id);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_event   ON public.audit_log(event_type);

-- RLS: append-only from client (INSERT + SELECT, no UPDATE/DELETE)
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "insert_own_ledger" ON public.audit_log FOR INSERT
  WITH CHECK (
    ledger_id IN (SELECT id FROM public.ledger_config WHERE admin_id = auth.uid())
  );

CREATE POLICY "select_own_ledger" ON public.audit_log FOR SELECT
  USING (
    ledger_id IN (SELECT id FROM public.ledger_config WHERE admin_id = auth.uid())
  );

-- Auto-cleanup RPC (SECURITY DEFINER bypasses RLS to delete old entries)
CREATE OR REPLACE FUNCTION public.purge_old_audit_logs(
  p_ledger_id uuid,
  p_retention_days int DEFAULT 90
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count int;
BEGIN
  DELETE FROM public.audit_log
  WHERE ledger_id = p_ledger_id
    AND created_at < now() - (p_retention_days || ' days')::interval;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;
