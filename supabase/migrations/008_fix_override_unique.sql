-- Fix: override_date should be unique per ledger, not globally
ALTER TABLE public.calendar_overrides
  DROP CONSTRAINT calendar_overrides_override_date_key;

ALTER TABLE public.calendar_overrides
  ADD CONSTRAINT calendar_overrides_ledger_date_unique
    UNIQUE (ledger_id, override_date);
