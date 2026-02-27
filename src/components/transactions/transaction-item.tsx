import { UserAvatar } from "@/components/users/user-avatar";
import { formatCurrency, formatTime } from "@/lib/utils";
import type { PaymentWithStudent } from "@/types";

interface TransactionItemProps {
  payment: PaymentWithStudent;
}

export function TransactionItem({ payment }: TransactionItemProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <UserAvatar
        name={payment.student.name}
        avatarUrl={payment.student.avatar_url}
        className="h-8 w-8"
      />
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">
          {payment.student.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatTime(payment.created_at)}
        </p>
      </div>
      <span className="text-sm font-semibold text-accent">
        +{formatCurrency(payment.amount)}
      </span>
    </div>
  );
}
