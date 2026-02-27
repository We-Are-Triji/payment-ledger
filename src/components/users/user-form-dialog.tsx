import { useState } from "react";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { uploadStudentAvatar } from "@/api/storage";
import type { Student, StudentInsert } from "@/types";

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student;
  ledgerId: string;
  onSubmit: (data: StudentInsert | Partial<StudentInsert>) => Promise<void>;
}

export function UserFormDialog({
  open,
  onOpenChange,
  student,
  ledgerId,
  onSubmit,
}: UserFormDialogProps) {
  const isEditing = !!student;
  const [name, setName] = useState(student?.name || "");
  const [sex, setSex] = useState<"male" | "female" | "other">(
    student?.sex || "male"
  );
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name");
      return;
    }

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

      toast.success(
        isEditing ? "Student updated" : "Student added"
      );
      onOpenChange(false);
      setName("");
      setSex("male");
      setFile(null);
    } catch {
      toast.error(isEditing ? "Failed to update student" : "Failed to add student");
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
            <Select value={sex} onValueChange={(v) => setSex(v as typeof sex)}>
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
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Save" : "Add Student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
