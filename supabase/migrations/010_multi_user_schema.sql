-- ============================================================
-- Migration 010: Multi-user schema
-- Adds ledger_members, ledger_invitations, user_preferences.
-- Drops UNIQUE(admin_id) on ledger_config.
-- Adds actor columns to audit_log.
-- Creates RPCs for invitation acceptance, user ledger listing,
-- and member-with-email retrieval.
-- ============================================================

-- 1. New tables --------------------------------------------------

CREATE TABLE public.ledger_members (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_id  uuid        NOT NULL REFERENCES public.ledger_config(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text        NOT NULL CHECK (role IN ('owner', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ledger_id, user_id)
);

CREATE INDEX idx_ledger_members_user   ON public.ledger_members(user_id);
CREATE INDEX idx_ledger_members_ledger ON public.ledger_members(ledger_id);

CREATE TABLE public.ledger_invitations (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ledger_id   uuid        NOT NULL REFERENCES public.ledger_config(id) ON DELETE CASCADE,
  email       text        NOT NULL,
  token       uuid        NOT NULL DEFAULT gen_random_uuid(),
  invited_by  uuid        NOT NULL REFERENCES auth.users(id),
  expires_at  timestamptz NOT NULL DEFAULT now() + interval '7 days',
  accepted_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(token)
);

CREATE INDEX idx_invitations_token ON public.ledger_invitations(token);

CREATE TABLE public.user_preferences (
  user_id              uuid    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  show_ledger_selector boolean NOT NULL DEFAULT true,
  last_ledger_id       uuid    REFERENCES public.ledger_config(id) ON DELETE SET NULL,
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- 2. Schema changes ----------------------------------------------

-- Allow multiple ledgers per user
ALTER TABLE public.ledger_config DROP CONSTRAINT ledger_config_admin_id_key;

-- Add actor tracking to audit_log
ALTER TABLE public.audit_log
  ADD COLUMN actor_id    uuid REFERENCES auth.users(id),
  ADD COLUMN actor_email text;

-- 3. Data migration ----------------------------------------------

-- Seed ledger_members from existing ledger_config owners
INSERT INTO public.ledger_members (ledger_id, user_id, role)
SELECT id, admin_id, 'owner' FROM public.ledger_config;

-- 4. RPCs --------------------------------------------------------

-- Accept an invitation (SECURITY DEFINER so the accepting user can
-- insert into ledger_members without being the owner)
CREATE OR REPLACE FUNCTION public.accept_invitation(p_token uuid)
RETURNS void AS $$
DECLARE
  v_inv RECORD;
BEGIN
  SELECT * INTO v_inv FROM public.ledger_invitations
  WHERE token = p_token
    AND accepted_at IS NULL
    AND expires_at > now();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found, expired, or already used';
  END IF;

  INSERT INTO public.ledger_members (ledger_id, user_id, role)
  VALUES (v_inv.ledger_id, auth.uid(), 'admin')
  ON CONFLICT (ledger_id, user_id) DO NOTHING;

  UPDATE public.ledger_invitations
  SET accepted_at = now()
  WHERE id = v_inv.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get all ledgers the current user has access to, with their role
CREATE OR REPLACE FUNCTION public.get_user_ledgers()
RETURNS TABLE(
  id             uuid,
  name           text,
  deposit_amount numeric,
  payment_goal   numeric,
  start_date     date,
  admin_id       uuid,
  created_at     timestamptz,
  role           text
) AS $$
  SELECT lc.id, lc.name, lc.deposit_amount, lc.payment_goal,
         lc.start_date, lc.admin_id, lc.created_at, lm.role
  FROM public.ledger_config lc
  JOIN public.ledger_members lm ON lc.id = lm.ledger_id
  WHERE lm.user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Get ledger members with their email addresses
-- (auth.users is not client-accessible, so we need SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_ledger_members_with_email(p_ledger_id uuid)
RETURNS TABLE(
  id         uuid,
  ledger_id  uuid,
  user_id    uuid,
  role       text,
  email      text,
  created_at timestamptz
) AS $$
  SELECT lm.id, lm.ledger_id, lm.user_id, lm.role, u.email, lm.created_at
  FROM public.ledger_members lm
  JOIN auth.users u ON lm.user_id = u.id
  WHERE lm.ledger_id = p_ledger_id
    AND p_ledger_id IN (
      SELECT lm2.ledger_id FROM public.ledger_members lm2
      WHERE lm2.user_id = auth.uid()
    );
$$ LANGUAGE sql SECURITY DEFINER;
