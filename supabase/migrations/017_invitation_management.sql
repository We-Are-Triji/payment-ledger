-- ============================================================
-- Migration 017: Invitation management
-- Adds explicit invalidation tracking and makes invite links expire
-- after 3 days by default. Also returns clearer invite states.
-- ============================================================

ALTER TABLE public.ledger_invitations
  ALTER COLUMN expires_at SET DEFAULT now() + interval '3 days';

ALTER TABLE public.ledger_invitations
  ADD COLUMN IF NOT EXISTS invalidated_at timestamptz;

ALTER TABLE public.ledger_invitations
  ADD COLUMN IF NOT EXISTS invalidated_by uuid REFERENCES auth.users(id);

UPDATE public.ledger_invitations
SET expires_at = LEAST(expires_at, created_at + interval '3 days')
WHERE accepted_at IS NULL
  AND invalidated_at IS NULL;

CREATE OR REPLACE FUNCTION public.accept_invitation(p_token uuid)
RETURNS void AS $$
DECLARE
  v_ledger_id uuid;
  v_inv RECORD;
BEGIN
  UPDATE public.ledger_invitations
  SET accepted_at = now()
  WHERE token = p_token
    AND accepted_at IS NULL
    AND invalidated_at IS NULL
    AND expires_at > now()
  RETURNING ledger_id INTO v_ledger_id;

  IF NOT FOUND THEN
    SELECT accepted_at, invalidated_at, expires_at
    INTO v_inv
    FROM public.ledger_invitations
    WHERE token = p_token;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Invitation not found';
    ELSIF v_inv.invalidated_at IS NOT NULL THEN
      RAISE EXCEPTION 'Invitation has been invalidated';
    ELSIF v_inv.accepted_at IS NOT NULL THEN
      RAISE EXCEPTION 'Invitation has already been used';
    ELSIF v_inv.expires_at <= now() THEN
      RAISE EXCEPTION 'Invitation has expired';
    ELSE
      RAISE EXCEPTION 'Invitation is no longer valid';
    END IF;
  END IF;

  INSERT INTO public.ledger_members (ledger_id, user_id, role)
  VALUES (v_ledger_id, auth.uid(), 'admin')
  ON CONFLICT (ledger_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.get_invitation_details(uuid);

CREATE OR REPLACE FUNCTION public.get_invitation_details(p_token uuid)
RETURNS TABLE (
  id uuid,
  ledger_id uuid,
  email text,
  token uuid,
  invited_by uuid,
  accepted_at timestamptz,
  invalidated_at timestamptz,
  invalidated_by uuid,
  expires_at timestamptz,
  created_at timestamptz,
  ledger_name text
) AS $$
  SELECT
    i.id,
    i.ledger_id,
    i.email,
    i.token,
    i.invited_by,
    i.accepted_at,
    i.invalidated_at,
    i.invalidated_by,
    i.expires_at,
    i.created_at,
    lc.name AS ledger_name
  FROM public.ledger_invitations i
  JOIN public.ledger_config lc ON lc.id = i.ledger_id
  WHERE i.token = p_token;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
