import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useBackups } from "@/hooks/use-backups";
import { useLedgerStore } from "@/store/ledger-store";
import { useLedgerConfig } from "@/hooks/use-ledger-config";
import { toast } from "sonner";
import { Loader2, Download, Upload, RotateCcw, Plus, Database } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { BackupData } from "@/types";

export function BackupManager() {
  const config = useLedgerStore((s) => s.config);
  const { refetch: refetchConfig } = useLedgerConfig();
  const { backups, loading, create, download, restore, refetch } = useBackups(config);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<{ id: string; label: string } | null>(null);
  const [confirmUpload, setConfirmUpload] = useState<BackupData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    try {
      setCreating(true);
      await create(`Manual - ${new Date().toLocaleDateString("en-PH")}`);
      toast.success("Backup created successfully");
    } catch {
      toast.error("Failed to create backup");
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (id: string) => {
    try {
      const data = await download(id);
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const date = new Date().toISOString().split("T")[0];
      link.download = `ledger-backup-${date}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded");
    } catch {
      toast.error("Failed to download backup");
    }
  };

  const handleRestore = async (backupId: string) => {
    if (!config) return;
    try {
      setRestoring(backupId);
      // Create pre-restore backup first
      await create("Pre-restore backup");
      const data = await download(backupId);
      await restore(data);
      await refetchConfig();
      await refetch();
      toast.success("Backup restored successfully. Page will reload.");
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast.error("Failed to restore backup");
    } finally {
      setRestoring(null);
      setConfirmRestore(null);
    }
  };

  const handleUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupData;

      if (!data.version || !data.ledger_config || !data.students || !data.payments) {
        toast.error("Invalid backup file format");
        return;
      }

      setConfirmUpload(data);
    } catch {
      toast.error("Failed to read backup file");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUploadRestore = async () => {
    if (!confirmUpload || !config) return;
    try {
      setRestoring("upload");
      await create("Pre-upload-restore backup");
      await restore(confirmUpload);
      await refetchConfig();
      await refetch();
      toast.success("Backup restored from file. Page will reload.");
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      toast.error("Failed to restore from uploaded backup");
    } finally {
      setRestoring(null);
      setConfirmUpload(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Database className="h-4 w-4" />
            Backup & Restore
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={handleCreate}
              disabled={creating}
            >
              {creating ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-1 h-4 w-4" />
              )}
              Create Backup
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleUpload}
            >
              <Upload className="mr-1 h-4 w-4" />
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <Separator />

          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : backups.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No backups yet
            </p>
          ) : (
            <div className="space-y-2">
              {backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between rounded-lg border p-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{backup.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(backup.created_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        setConfirmRestore({
                          id: backup.id,
                          label: backup.label,
                        })
                      }
                      disabled={restoring !== null}
                    >
                      {restoring === backup.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDownload(backup.id)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmRestore}
        onOpenChange={(open) => {
          if (!open) setConfirmRestore(null);
        }}
        title="Restore Backup?"
        description={`This will replace ALL current data with the backup "${confirmRestore?.label}". This cannot be undone. A backup of your current data will be created first. Continue?`}
        onConfirm={() => confirmRestore && handleRestore(confirmRestore.id)}
        confirmLabel="Restore"
        destructive
      />

      <ConfirmDialog
        open={!!confirmUpload}
        onOpenChange={(open) => {
          if (!open) setConfirmUpload(null);
        }}
        title="Restore from Uploaded File?"
        description="This will replace ALL current data with the uploaded backup. This cannot be undone. A backup of your current data will be created first. Continue?"
        onConfirm={handleUploadRestore}
        confirmLabel="Restore from File"
        destructive
      />
    </>
  );
}
