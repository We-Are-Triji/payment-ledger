import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";
import { uploadContributorAvatar } from "@/api/storage";
import { toUserError } from "@/lib/sanitize";
import type { Contributor, ContributorInsert } from "@/types";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contributor?: Contributor;
  ledgerId: string;
  onSubmit: (data: ContributorInsert | Partial<ContributorInsert>) => Promise<void>;
}

export function UserFormDialog({
  open,
  onOpenChange,
  contributor,
  ledgerId,
  onSubmit,
}: UserFormDialogProps) {
  const isEditing = !!contributor;
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(contributor?.name || "");
      setFile(null);
      setPreview(contributor?.avatar_url || null);
    }
  }, [open, contributor]);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const clearFile = () => {
    setFile(null);
    setPreview(isEditing ? contributor?.avatar_url || null : null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    if (isEditing) {
      setConfirmSave(true);
      return;
    }

    await doSubmit();
  };

  const doSubmit = async () => {
    try {
      setSubmitting(true);
      let avatarUrl = contributor?.avatar_url || null;
      if (file) {
        const tempId = contributor?.id || crypto.randomUUID();
        avatarUrl = await uploadContributorAvatar(tempId, file);
      }

      await onSubmit({
        name: name.trim(),
        avatar_url: avatarUrl,
        ledger_id: ledgerId,
      });

      toast.success(isEditing ? "Contributor updated" : "Contributor added");
      onOpenChange(false);
    } catch (err) {
      toast.error(toUserError(err));
    } finally {
      setSubmitting(false);
      setConfirmSave(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Contributor" : "Add Contributor"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contributor-name">Name</Label>
              <Input
                id="contributor-name"
                placeholder="Full name"
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Profile Image (optional)</Label>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {preview ? (
                <div className="flex items-center gap-3 rounded-md border p-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="shrink-0"
                  >
                    <img
                      src={preview}
                      alt="Preview"
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  </button>
                  <span className="flex-1 truncate text-sm text-muted-foreground">
                    {file?.name || "Current image"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={clearFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  <Upload className="h-4 w-4" />
                  Upload image
                </button>
              )}
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Save" : "Add Contributor"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmSave}
        onOpenChange={setConfirmSave}
        title="Save Changes?"
        description={`Save changes to "${name.trim()}"?`}
        onConfirm={doSubmit}
        confirmLabel="Save"
      />
    </>
  );
}
