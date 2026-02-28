import { useNavigate } from "react-router-dom";
import { ClassSettings } from "@/components/class/class-settings";
import { DangerousSettings } from "@/components/class/dangerous-settings";
import { BackupManager } from "@/components/class/backup-manager";
import { LoadingSpinner } from "@/components/common/loading-spinner";
import { useLedgerStore } from "@/store/ledger-store";
import { useLedgerConfig } from "@/hooks/use-ledger-config";

export default function ClassPage() {
  const config = useLedgerStore((s) => s.config);
  const { update, remove, loading } = useLedgerConfig();
  const navigate = useNavigate();

  if (loading || !config) return <LoadingSpinner />;

  const handleUpdate = async (updates: Record<string, unknown>) => {
    await update(config.id, updates);
  };

  const handleDelete = async () => {
    await remove(config.id);
    navigate("/");
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4">
      <h2 className="text-lg font-semibold">Class Profile</h2>
      <ClassSettings config={config} onUpdate={handleUpdate} />
      <DangerousSettings config={config} onUpdate={handleUpdate} onDelete={handleDelete} />
      <BackupManager />
    </div>
  );
}
