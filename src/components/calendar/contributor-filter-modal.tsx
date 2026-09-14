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
import type { Contributor } from "@/types";

interface ContributorFilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contributors: Contributor[];
  selectedIds: Set<string> | null;
  onConfirm: (selectedIds: Set<string> | null) => void;
}

export function ContributorFilterModal({
  open,
  onOpenChange,
  contributors,
  selectedIds,
  onConfirm,
}: ContributorFilterModalProps) {
  const [allMode, setAllMode] = useState(selectedIds === null);
  const [selected, setSelected] = useState<Set<string>>(
    () => selectedIds ?? new Set()
  );
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return contributors;
    const q = search.toLowerCase();
    return contributors.filter((c) => c.name.toLowerCase().includes(q));
  }, [contributors, search]);

  const toggleContributor = (id: string) => {
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
          setSelected(selectedIds ?? new Set());
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-sm max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Filter Contributors</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label htmlFor="all-contributors-toggle">All Contributors</Label>
          <Switch
            id="all-contributors-toggle"
            checked={allMode}
            onCheckedChange={(checked) => {
              setAllMode(checked);
              if (checked) {
                setSelected(new Set(contributors.map((c) => c.id)));
              } else {
                setSelected(new Set());
              }
            }}
          />
        </div>

        {!allMode && (
          <>
            <Input
              placeholder="Search contributors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="flex-1 overflow-y-auto max-h-64 space-y-1">
              {filtered.map((contributor) => (
                <button
                  key={contributor.id}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-muted/50"
                  onClick={() => toggleContributor(contributor.id)}
                >
                  <UserAvatar
                    name={contributor.name}
                    avatarUrl={contributor.avatar_url}
                    className="h-8 w-8"
                  />
                  <span className="flex-1 text-sm">{contributor.name}</span>
                  {selected.has(contributor.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {selected.size} contributor{selected.size !== 1 ? "s" : ""} selected
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
