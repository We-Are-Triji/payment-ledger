-- ============================================================
-- Migration 015: Rework invitation system
-- Remove required email field — invitations are now simple
-- shareable links without email association.
-- ============================================================

-- Make email nullable (no longer required for invitations)
ALTER TABLE public.ledger_invitations ALTER COLUMN email DROP NOT NULL;
