import { useState } from "react";
import { Bug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BugReportModal } from "./bug-report-modal";

export function BugReportFAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-20 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
        onClick={() => setOpen(true)}
      >
        <Bug className="h-5 w-5" />
      </Button>
      <BugReportModal open={open} onOpenChange={setOpen} />
    </>
  );
}
