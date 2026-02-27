import { useState } from "react";
import { LogOut, Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/auth-store";
import { useLedgerStore } from "@/store/ledger-store";
import { BugReportModal } from "@/components/common/bug-report-modal";

export function Header() {
  const { user, signOut } = useAuthStore();
  const config = useLedgerStore((s) => s.config);
  const [bugReportOpen, setBugReportOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <h1 className="truncate text-base font-semibold">
            {config?.name || "Payment Ledger"}
          </h1>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {user?.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setBugReportOpen(true)}>
                <Bug className="mr-2 h-4 w-4" />
                Report Bug
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                className="text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <BugReportModal open={bugReportOpen} onOpenChange={setBugReportOpen} />
    </>
  );
}
