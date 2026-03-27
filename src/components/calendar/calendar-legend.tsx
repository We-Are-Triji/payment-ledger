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
  { color: "border border-[rgba(174,203,235,0.35)] bg-[rgba(174,203,235,0.2)]", label: "Start Date" },
  { color: "border border-[rgba(168,213,186,0.4)] bg-[rgba(168,213,186,0.18)]", label: "All Paid" },
  { color: "border border-[rgba(251,228,161,0.35)] bg-[rgba(251,228,161,0.18)]", label: "Partial" },
  { color: "border border-[rgba(255,181,167,0.38)] bg-[rgba(255,181,167,0.16)]", label: "Unpaid" },
  { color: "border border-white/8 bg-white/[0.06]", label: "Holiday / Off Day" },
  { color: "border border-white/8 bg-[#0f1012]", label: "Excluded Day" },
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
