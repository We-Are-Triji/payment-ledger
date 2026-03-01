-- ============================================================
-- Migration 013: Fix RLS circular dependency + invitation details RPC
--
-- 1. ledger_config SELECT policy: allow creator (admin_id) to always
--    see their own ledgers, breaking the chicken-and-egg with ledger_members.
-- 2. SECURITY DEFINER RPC for invitation details so invited users can
--    see the ledger name before becoming a member.
-- ============================================================

-- 1. Fix ledger_config SELECT policy
DROP POLICY IF EXISTS "Members can view own ledgers" ON public.ledger_config;

CREATE POLICY "Members and owner can view ledgers"
  ON public.ledger_config FOR SELECT
  USING (
    admin_id = auth.uid()
    OR id IN (SELECT ledger_id FROM public.ledger_members WHERE user_id = auth.uid())
  );

-- 2. Invitation details RPC (bypasses ledger_config RLS for name lookup)
CREATE OR REPLACE FUNCTION public.get_invitation_details(p_token uuid)
RETURNS TABLE (
  id uuid,
  ledger_id uuid,
  email text,
  token uuid,
  invited_by uuid,
  accepted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz,
  ledger_name text
) AS $$
  SELECT
    i.id, i.ledger_id, i.email, i.token, i.invited_by,
    i.accepted_at, i.expires_at, i.created_at,
    lc.name AS ledger_name
  FROM public.ledger_invitations i
  JOIN public.ledger_config lc ON lc.id = i.ledger_id
  WHERE i.token = p_token;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
