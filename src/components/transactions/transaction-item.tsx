import { UserAvatar } from "@/components/users/user-avatar";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { PaymentWithContributor } from "@/types";

interface TransactionItemProps {
  payment: PaymentWithContributor;
  isAdvance: boolean;
  onClick: () => void;
}

const methodLabel: Record<string, string> = {
  quick: "Quick",
  manual: "Manual",
  migration: "Migration",
};

const methodVariant: Record<string, "secondary" | "outline" | "default"> = {
  quick: "secondary",
  manual: "outline",
  migration: "default",
};

export function TransactionItem({ payment, isAdvance, onClick }: TransactionItemProps) {
  const isVoided = !!payment.voided_at;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`soft-panel flex w-full items-center gap-3 rounded-[28px] p-4 text-left transition-all hover:-translate-y-0.5 hover:bg-white/[0.05] ${isVoided ? "opacity-55" : ""}`}
    >
      <UserAvatar
        name={payment.contributor.name}
        avatarUrl={payment.contributor.avatar_url}
        className="h-8 w-8"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="truncate text-sm font-semibold text-white">{payment.contributor.name}</p>
          <Badge variant={methodVariant[payment.method] ?? "outline"} className="px-2.5 py-1 text-[10px]">
            {methodLabel[payment.method] ?? payment.method}
          </Badge>
          {isAdvance && !isVoided && (
            <Badge variant="default" className="bg-[rgba(168,213,186,0.18)] px-2.5 py-1 text-[10px] text-[var(--soft-mint)]">
              Advance
            </Badge>
          )}
          {isVoided && (
            <Badge variant="destructive" className="px-2.5 py-1 text-[10px]">
              VOID
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDateTime(payment.created_at)}
        </p>
      </div>
      <span className={`text-sm font-bold tabular-nums ${isVoided ? "line-through text-muted-foreground" : "text-[var(--soft-mint)]"}`}>
        +{formatCurrency(payment.amount)}
      </span>
    </button>
  );
}
