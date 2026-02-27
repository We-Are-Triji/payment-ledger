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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Download } from "lucide-react";
import { format, startOfWeek, startOfMonth } from "date-fns";
import { getPaymentsByRange } from "@/api/payments";
import { exportToCSV, exportToPDF } from "@/lib/export";
import { toast } from "sonner";

type ExportPeriod = "today" | "week" | "month" | "custom";
type ExportFormat = "csv" | "pdf";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ledgerId: string;
  ledgerName: string;
}

export function ExportModal({
  open,
  onOpenChange,
  ledgerId,
  ledgerName,
}: ExportModalProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [period, setPeriod] = useState<ExportPeriod>("today");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo] = useState(today);
  const [exporting, setExporting] = useState(false);

  const getDateRange = (): { from: string; to: string } => {
    const now = new Date();
    switch (period) {
      case "today":
        return { from: today, to: today };
      case "week":
        return {
          from: format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd"),
          to: today,
        };
      case "month":
        return {
          from: format(startOfMonth(now), "yyyy-MM-dd"),
          to: today,
        };
      case "custom":
        return { from: customFrom, to: customTo };
    }
  };

  const handleExport = async () => {
    const { from, to } = getDateRange();

    if (from > to) {
      toast.error("Start date must be before end date");
      return;
    }

    try {
      setExporting(true);
      const payments = await getPaymentsByRange(ledgerId, from, to);

      if (payments.length === 0) {
        toast.error("No transactions found for the selected period");
        return;
      }

      const periodLabel = period === "custom" ? `${from}_to_${to}` : period;

      if (exportFormat === "csv") {
        exportToCSV(payments, ledgerName, periodLabel);
      } else {
        exportToPDF(payments, ledgerName, periodLabel);
      }

      toast.success(`${exportFormat.toUpperCase()} exported successfully`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to export");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Export Transactions</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Period</Label>
            <RadioGroup
              value={period}
              onValueChange={(v) => setPeriod(v as ExportPeriod)}
              className="grid grid-cols-2 gap-2"
            >
              {[
                { value: "today", label: "Today" },
                { value: "week", label: "This Week" },
                { value: "month", label: "This Month" },
                { value: "custom", label: "Custom Range" },
              ].map((opt) => (
                <Label
                  key={opt.value}
                  htmlFor={`period-${opt.value}`}
                  className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5"
                >
                  <RadioGroupItem value={opt.value} id={`period-${opt.value}`} />
                  {opt.label}
                </Label>
              ))}
            </RadioGroup>
          </div>

          {period === "custom" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="export-from" className="text-xs">From</Label>
                <Input
                  id="export-from"
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="export-to" className="text-xs">To</Label>
                <Input
                  id="export-to"
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Format</Label>
            <RadioGroup
              value={exportFormat}
              onValueChange={(v) => setExportFormat(v as ExportFormat)}
              className="flex gap-4"
            >
              <Label
                htmlFor="format-csv"
                className="flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5"
              >
                <RadioGroupItem value="csv" id="format-csv" />
                CSV
              </Label>
              <Label
                htmlFor="format-pdf"
                className="flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm [&:has(:checked)]:border-primary [&:has(:checked)]:bg-primary/5"
              >
                <RadioGroupItem value="pdf" id="format-pdf" />
                PDF
              </Label>
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleExport} disabled={exporting} className="w-full">
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
