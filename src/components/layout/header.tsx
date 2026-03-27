import { useState } from "react";
import { LogOut, Bug, ScrollText, Settings, ArrowLeftRight } from "lucide-react";
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
import { SystemLogSheet } from "@/components/common/system-log-sheet";
import { LedgerSettingsSheet } from "@/components/ledger/ledger-settings-sheet";
import { LedgerSwitcherModal } from "@/components/ledger/ledger-switcher-modal";

export function Header() {
  const { user, signOut } = useAuthStore();
  const config = useLedgerStore((s) => s.config);
  const [bugReportOpen, setBugReportOpen] = useState(false);
  const [systemLogOpen, setSystemLogOpen] = useState(false);
  const [ledgerSettingsOpen, setLedgerSettingsOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 px-4 pt-4">
        <div className="soft-panel mx-auto flex h-[72px] max-w-xl items-center justify-between rounded-[30px] border border-white/8 px-5 backdrop-blur-xl">
          <div className="min-w-0">
            <p className="section-kicker mb-1">Ledger Overview</p>
            <h1 className="truncate text-xl font-bold tracking-tight text-white">
              {config?.name || "Ledgy"}
            </h1>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm" className="border-white/10 bg-white/[0.04]">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} referrerPolicy="no-referrer" />
                  <AvatarFallback className="bg-[rgba(174,203,235,0.2)] text-xs text-[var(--soft-blue)]">
                    {user?.email?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setSwitcherOpen(true)}>
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Switch Ledger
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLedgerSettingsOpen(true)}>
                <Settings className="mr-2 h-4 w-4" />
                Ledger Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSystemLogOpen(true)}>
                <ScrollText className="mr-2 h-4 w-4" />
                System Log
              </DropdownMenuItem>
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
      <SystemLogSheet open={systemLogOpen} onOpenChange={setSystemLogOpen} />
      <LedgerSettingsSheet
        open={ledgerSettingsOpen}
        onOpenChange={setLedgerSettingsOpen}
      />
      <LedgerSwitcherModal
        open={switcherOpen}
        onOpenChange={setSwitcherOpen}
      />
    </>
  );
}
