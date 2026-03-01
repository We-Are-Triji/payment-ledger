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
      className="flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left transition-all hover:bg-accent/10 hover:shadow-md hover:-translate-y-0.5 active:bg-accent/20"
    >
      <UserAvatar
        name={student.name}
        avatarUrl={student.avatar_url}
        className="h-10 w-10"
      />
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{student.name}</p>
        <p className="text-xs text-muted-foreground">
          Balance: {formatCurrency(student.balance)}
        </p>
      </div>
      <Badge variant="secondary" className={statusConfig.color}>
        {statusConfig.label}
      </Badge>
    </button>
  );
}
