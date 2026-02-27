import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { uploadStudentAvatar } from "@/api/storage";
import type { Student, StudentInsert } from "@/types";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student;
  ledgerId: string;
  onSubmit: (data: StudentInsert | Partial<StudentInsert>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function UserFormDialog({
  open,
  onOpenChange,
  student,
  ledgerId,
  onSubmit,
  onDelete,
}: UserFormDialogProps) {
  const isEditing = !!student;
  const [name, setName] = useState("");
  const [sex, setSex] = useState<"male" | "female" | "other">("male");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (open) {
      setName(student?.name || "");
      setSex(student?.sex || "male");
      setFile(null);
    }
  }, [open, student]);

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
      let avatarUrl = student?.avatar_url || null;
      if (file) {
        const tempId = student?.id || crypto.randomUUID();
        avatarUrl = await uploadStudentAvatar(tempId, file);
      }

      await onSubmit({
        name: name.trim(),
        sex,
        avatar_url: avatarUrl,
        ledger_id: ledgerId,
      });

      toast.success(isEditing ? "Student updated" : "Student added");
      onOpenChange(false);
    } catch {
      toast.error(
        isEditing ? "Failed to update student" : "Failed to add student"
      );
    } finally {
      setSubmitting(false);
      setConfirmSave(false);
    }
  };

  const handleDelete = async () => {
    if (!student || !onDelete) return;
    try {
      setSubmitting(true);
      await onDelete(student.id);
      toast.success("Student deleted");
      onOpenChange(false);
    } catch {
      toast.error("Failed to delete student");
    } finally {
      setSubmitting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Student" : "Add Student"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-name">Name</Label>
              <Input
                id="student-name"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Sex</Label>
              <Select
                value={sex}
                onValueChange={(v) => setSex(v as typeof sex)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="student-avatar">Profile Image (optional)</Label>
              <Input
                id="student-avatar"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 sm:justify-between">
            {isEditing && onDelete ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                disabled={submitting}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
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
                {isEditing ? "Save" : "Add Student"}
              </Button>
            </div>
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

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete Student?"
        description={`This will permanently delete "${student?.name}" and all their payment records. This cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        destructive
      />
    </>
  );
}
