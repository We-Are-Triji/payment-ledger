-- ============================================================
-- Migration 018: Public balance share links
-- Adds tokenized read-only share links with live access rules.
-- ============================================================

CREATE TABLE public.ledger_public_shares (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_id      uuid NOT NULL REFERENCES public.ledger_config(id) ON DELETE CASCADE,
  token          uuid NOT NULL DEFAULT gen_random_uuid(),
  access_mode    text NOT NULL DEFAULT 'private' CHECK (access_mode IN ('private', 'anyone', 'restricted')),
  allowed_emails text[] NOT NULL DEFAULT '{}',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ledger_id),
  UNIQUE (token)
);

CREATE INDEX idx_ledger_public_shares_token ON public.ledger_public_shares(token);

CREATE OR REPLACE FUNCTION public.normalize_email_array(p_emails text[])
RETURNS text[] AS $$
  SELECT COALESCE(
    ARRAY(
      SELECT DISTINCT lower(trim(email))
      FROM unnest(COALESCE(p_emails, '{}'::text[])) AS email
      WHERE NULLIF(trim(email), '') IS NOT NULL
      ORDER BY lower(trim(email))
    ),
    '{}'::text[]
  );
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.ledger_public_shares_before_write()
RETURNS trigger AS $$
BEGIN
  NEW.allowed_emails := public.normalize_email_array(NEW.allowed_emails);
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ledger_public_shares_before_write
  BEFORE INSERT OR UPDATE ON public.ledger_public_shares
  FOR EACH ROW
  EXECUTE FUNCTION public.ledger_public_shares_before_write();

ALTER TABLE public.ledger_public_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage public shares"
  ON public.ledger_public_shares FOR ALL
  USING (public.user_has_ledger_access(ledger_id))
  WITH CHECK (public.user_has_ledger_access(ledger_id));

CREATE OR REPLACE FUNCTION public.get_public_balance_view(p_token uuid)
RETURNS TABLE (
  ledger_id uuid,
  ledger_name text,
  deposit_amount numeric,
  payment_goal numeric,
  start_date date,
  week_filter jsonb,
  students jsonb,
  payment_totals jsonb,
  overrides jsonb,
  access_mode text
) AS $$
DECLARE
  v_share RECORD;
  v_email text;
BEGIN
  SELECT
    s.ledger_id,
    s.access_mode,
    s.allowed_emails,
    lc.name AS ledger_name,
    lc.deposit_amount,
    lc.payment_goal,
    lc.start_date,
    lc.week_filter
  INTO v_share
  FROM public.ledger_public_shares s
  JOIN public.ledger_config lc ON lc.id = s.ledger_id
  WHERE s.token = p_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Public balance link not found';
  END IF;

  IF v_share.access_mode = 'private' THEN
    RAISE EXCEPTION 'You are not permitted to view this balance link';
  END IF;

  IF v_share.access_mode = 'restricted' THEN
    v_email := lower(trim(COALESCE(auth.jwt() ->> 'email', '')));
    IF v_email = '' OR NOT (v_email = ANY(v_share.allowed_emails)) THEN
      RAISE EXCEPTION 'You are not permitted to view this balance link';
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    v_share.ledger_id,
    v_share.ledger_name,
    v_share.deposit_amount,
    v_share.payment_goal,
    v_share.start_date,
    v_share.week_filter,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', st.id,
            'ledger_id', st.ledger_id,
            'name', st.name,
            'sex', st.sex,
            'avatar_url', st.avatar_url,
            'created_at', st.created_at,
            'updated_at', st.updated_at
          )
          ORDER BY st.name
        )
        FROM public.students st
        WHERE st.ledger_id = v_share.ledger_id
      ),
      '[]'::jsonb
    ),
    COALESCE(
      (
        SELECT jsonb_object_agg(t.student_id::text, t.total_paid)
        FROM (
          SELECT p.student_id, SUM(p.amount) AS total_paid
          FROM public.payments p
          JOIN public.students st ON st.id = p.student_id
          WHERE st.ledger_id = v_share.ledger_id
            AND p.voided_at IS NULL
          GROUP BY p.student_id
        ) t
      ),
      '{}'::jsonb
    ),
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', co.id,
            'override_date', co.override_date,
            'status', co.status,
            'label', co.label,
            'ledger_id', co.ledger_id,
            'created_at', co.created_at
          )
          ORDER BY co.override_date
        )
        FROM public.calendar_overrides co
        WHERE co.ledger_id = v_share.ledger_id
      ),
      '[]'::jsonb
    ),
    v_share.access_mode;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, auth;

REVOKE ALL ON FUNCTION public.get_public_balance_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_balance_view(uuid) TO anon, authenticated, service_role;
