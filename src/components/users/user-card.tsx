import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "./user-avatar";
import { STUDENT_STATUS_CONFIG } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { StudentWithBalance } from "@/types";

interface UserCardProps {
  student: StudentWithBalance;
  onClick: () => void;
}

export function UserCard({ student, onClick }: UserCardProps) {
  const statusConfig = STUDENT_STATUS_CONFIG[student.status];

  return (
    <button
      onClick={onClick}
      className="soft-panel flex w-full items-center gap-3 rounded-[20px] p-3.5 text-left transition-all hover:-translate-y-0.5 hover:bg-white/[0.05] active:bg-white/[0.06]"
    >
      <UserAvatar
        name={student.name}
        avatarUrl={student.avatar_url}
        className="h-10 w-10"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-white">{student.name}</p>
        <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground/75">
          Balance:{" "}
          <span
            className={`font-bold tabular-nums ${
              student.balance >= 0 ? "text-[var(--soft-mint)]" : "text-[var(--soft-peach)]"
            }`}
          >
            {formatCurrency(student.balance)}
          </span>
        </p>
      </div>
      <Badge variant="secondary" className={statusConfig.color}>
        {statusConfig.label}
      </Badge>
    </button>
  );
}
