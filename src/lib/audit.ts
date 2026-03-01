import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import type { AuditEventType } from "@/types";

interface AuditLogParams {
  ledgerId: string;
  eventType: AuditEventType;
  description: string;
  metadata?: Record<string, unknown>;
}

export function logAuditEvent({
  ledgerId,
  eventType,
  description,
  metadata = {},
}: AuditLogParams): void {
  const user = useAuthStore.getState().user;
  supabase
    .from("audit_log")
    .insert({
      ledger_id: ledgerId,
      event_type: eventType,
      description,
      metadata,
      actor_id: user?.id ?? null,
      actor_email: user?.email ?? null,
    })
    .then(({ error }) => {
      if (error) console.warn("[audit]", error.message);
    });
}
