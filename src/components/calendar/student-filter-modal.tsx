import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/users/user-avatar";
import { Check } from "lucide-react";
import type { Student } from "@/types";

interface StudentFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
  selectedIds: Set<string> | null;
  onConfirm: (selectedIds: Set<string> | null) => void;
}

export function StudentFilterModal({
  open,
  onOpenChange,
  students,
  selectedIds,
  onConfirm,
}: StudentFilterModalProps) {
  const [allMode, setAllMode] = useState(selectedIds === null);
  const [selected, setSelected] = useState<Set<string>>(
    () => selectedIds ?? new Set(students.map((s) => s.id))
  );
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return students;
    const q = search.toLowerCase();
    return students.filter((s) => s.name.toLowerCase().includes(q));
  }, [students, search]);

  const toggleStudent = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    onConfirm(allMode ? null : selected);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setSearch("");
          setAllMode(selectedIds === null);
          setSelected(selectedIds ?? new Set(students.map((s) => s.id)));
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-sm max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Filter Students</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label htmlFor="all-students-toggle">All Students</Label>
          <Switch
            id="all-students-toggle"
            checked={allMode}
            onCheckedChange={(checked) => {
              setAllMode(checked);
              if (checked) {
                setSelected(new Set(students.map((s) => s.id)));
              }
            }}
          />
        </div>

        {!allMode && (
          <>
            <Input
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="flex-1 overflow-y-auto max-h-64 space-y-1">
              {filtered.map((student) => (
                <button
                  key={student.id}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-muted/50"
                  onClick={() => toggleStudent(student.id)}
                >
                  <UserAvatar
                    name={student.name}
                    avatarUrl={student.avatar_url}
                    className="h-8 w-8"
                  />
                  <span className="flex-1 text-sm">{student.name}</span>
                  {selected.has(student.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {selected.size} student{selected.size !== 1 ? "s" : ""} selected
            </p>
          </>
        )}

        <Button
          onClick={handleConfirm}
          disabled={!allMode && selected.size === 0}
        >
          Apply Filter
        </Button>
      </DialogContent>
    </Dialog>
  );
}
