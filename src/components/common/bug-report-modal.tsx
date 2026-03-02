import { useState, useEffect, useRef } from "react";
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
import { useAuthStore } from "@/store/auth-store";
import { createBugReport, uploadScreenshot } from "@/api/bug-reports";
import { toast } from "sonner";
import { Loader2, Upload, X } from "lucide-react";

interface BugReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const BUG_REPORT_EMAIL = "vincentaugusto16@gmail.com";

function sendBugReportEmail(
  description: string,
  userEmail: string,
  screenshotUrl: string | null
) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const body = [
    "Bug Report - Ledgy",
    "===========================",
    "",
    `Date: ${dateStr}`,
    `Reporter: ${userEmail}`,
    "",
    "Description:",
    description,
    "",
    `Screenshot: ${screenshotUrl || "None"}`,
    "",
    "---",
    "Sent from Ledgy PWA",
  ].join("\n");

  const subject = `Bug Report: Ledgy`;
  const mailto = `mailto:${BUG_REPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.open(mailto, "_blank");
}

export function BugReportModal({ open, onOpenChange }: BugReportModalProps) {
  const { user } = useAuthStore();
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const clearFile = () => {
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

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

      sendBugReportEmail(
        description.trim(),
        user.email || "Unknown",
        screenshotUrl
      );

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
            <Label>Screenshot (optional)</Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {preview && file ? (
              <div className="relative flex items-center gap-3 rounded-md border p-2">
                <img
                  src={preview}
                  alt="Preview"
                  className="h-12 w-12 rounded-md object-cover"
                />
                <span className="flex-1 truncate text-sm text-muted-foreground">
                  {file.name}
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
                Attach screenshot
              </button>
            )}
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
