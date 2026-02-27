import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarColor, getInitials } from "@/lib/avatar";

interface UserAvatarProps {
  name: string;
  avatarUrl: string | null;
  className?: string;
}

export function UserAvatar({ name, avatarUrl, className }: UserAvatarProps) {
  const { bg, text } = getAvatarColor(name);
  const initials = getInitials(name);

  return (
    <Avatar className={className}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
      <AvatarFallback style={{ backgroundColor: bg, color: text }}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
