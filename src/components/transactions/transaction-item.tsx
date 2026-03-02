import { UserAvatar } from "@/components/users/user-avatar";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { PaymentWithStudent } from "@/types";

interface TransactionItemProps {
  payment: PaymentWithStudent;
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
      className={`flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent/50 ${isVoided ? "opacity-50" : ""}`}
    >
      <UserAvatar
        name={payment.student.name}
        avatarUrl={payment.student.avatar_url}
        className="h-8 w-8"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="truncate text-sm font-medium">{payment.student.name}</p>
          <Badge variant={methodVariant[payment.method] ?? "outline"} className="text-[10px] px-1.5 py-0">
            {methodLabel[payment.method] ?? payment.method}
          </Badge>
          {isAdvance && !isVoided && (
            <Badge variant="default" className="bg-green-600 text-[10px] px-1.5 py-0">
              Advance
            </Badge>
          )}
          {isVoided && (
            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
              VOID
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {formatDateTime(payment.created_at)}
        </p>
      </div>
      <span className={`text-sm font-bold tabular-nums ${isVoided ? "line-through text-muted-foreground" : "text-accent"}`}>
        +{formatCurrency(payment.amount)}
      </span>
    </button>
  );
}
