import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ClassSettings } from "@/components/class/class-settings";
import { AdminManagement } from "@/components/ledger/admin-management";
import { PublicShareSettings } from "@/components/ledger/public-share-settings";
import { BackupManager } from "@/components/class/backup-manager";
import { DangerousSettings } from "@/components/class/dangerous-settings";
import { useLedgerStore } from "@/store/ledger-store";
import { useLedgerConfig } from "@/hooks/use-ledger-config";
import type { LedgerConfig } from "@/types";

interface LedgerSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LedgerSettingsSheet({
  open,
  onOpenChange,
}: LedgerSettingsSheetProps) {
  const navigate = useNavigate();
  const config = useLedgerStore((s) => s.config);
  const userRole = useLedgerStore((s) => s.userRole);
  const { update, remove } = useLedgerConfig();
  const isOwner = userRole === "owner";
  const canManagePublicShare = userRole === "owner" || userRole === "admin";

  if (!config) return null;

  const handleUpdate = async (
    updates: Partial<Pick<LedgerConfig, "name" | "payment_goal" | "week_filter" | "deposit_amount" | "start_date">>
  ) => {
    await update(config.id, updates);
  };

  const handleDelete = async () => {
    await remove(config.id);
    onOpenChange(false);
    navigate("/ledgers");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-full" onOpenAutoFocus={(e) => e.preventDefault()}>
        <SheetHeader>
          <SheetTitle>Ledger Settings</SheetTitle>
          <SheetDescription>
            Manage your ledger configuration, members, and backups.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          <ClassSettings config={config} onUpdate={handleUpdate} />
          <PublicShareSettings
            ledgerId={config.id}
            canManage={canManagePublicShare}
          />
          <AdminManagement ledgerId={config.id} isOwner={isOwner} />
          <BackupManager />
          <DangerousSettings
            config={config}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            isOwner={isOwner}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
