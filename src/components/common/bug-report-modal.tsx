import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth-store";
import { createBugReport, uploadScreenshot } from "@/api/bug-reports";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BugReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BugReportModal({ open, onOpenChange }: BugReportModalProps) {
  const { user } = useAuthStore();
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if (!user) return;

    try {
      setSubmitting(true);
      let screenshotUrl: string | null = null;
      if (file) {
        screenshotUrl = await uploadScreenshot(file);
      }
      await createBugReport({
        description: description.trim(),
        screenshot_url: screenshotUrl,
        reported_by: user.id,
      });
      toast.success("Bug report submitted. Thank you!");
      setDescription("");
      setFile(null);
      onOpenChange(false);
    } catch {
      toast.error("Failed to submit bug report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Report a Bug</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bug-description">Description</Label>
            <Textarea
              id="bug-description"
              placeholder="Describe the issue you encountered..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bug-screenshot">Screenshot (optional)</Label>
            <Input
              id="bug-screenshot"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !description.trim()}
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
