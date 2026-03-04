import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CalendarLegendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const items = [
  { color: "bg-purple-200 border border-purple-300 dark:bg-purple-900 dark:border-purple-700", label: "Start Date" },
  { color: "bg-green-200 border border-green-300 dark:bg-green-900 dark:border-green-700", label: "All Paid" },
  { color: "bg-[#faf3a0] border border-[#f0e668]", label: "Partial" },
  { color: "bg-red-200 border border-red-300 dark:bg-red-900 dark:border-red-700", label: "Unpaid" },
  { color: "bg-muted/50 border border-border", label: "Holiday / Off Day" },
  { color: "bg-foreground/90 border border-foreground", label: "Excluded Day" },
];

export function CalendarLegendModal({ open, onOpenChange }: CalendarLegendModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-base">Calendar Colors</DialogTitle>
        </DialogHeader>
        <div className="space-y-2.5">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span
                className={`inline-block h-4 w-4 shrink-0 rounded ${item.color}`}
              />
              <span className="text-sm text-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
