import { useState, useMemo } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UserAvatar } from "@/components/users/user-avatar";
import { Loader2, Download, Check } from "lucide-react";
import { format, startOfWeek, startOfMonth } from "date-fns";
import { getPaymentsByRange } from "@/api/payments";
import { exportToCSV, exportToPDF } from "@/lib/export";
import { toast } from "sonner";
import type { Student } from "@/types";

type ExportPeriod = "today" | "week" | "month" | "custom";
type ExportFormat = "csv" | "pdf";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ledgerId: string;
  ledgerName: string;
  students: Student[];
}

export function ExportModal({
  open,
  onOpenChange,
  ledgerId,
  ledgerName,
  students,
}: ExportModalProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const [period, setPeriod] = useState<ExportPeriod>("today");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [customFrom, setCustomFrom] = useState(today);
  const [customTo, setCustomTo] = useState(today);
  const [exporting, setExporting] = useState(false);
  const [allStudents, setAllStudents] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState("");

  const filteredStudents = useMemo(() => {
    if (!studentSearch) return students;
    const q = studentSearch.toLowerCase();
    return students.filter((s) => s.name.toLowerCase().includes(q));
  }, [students, studentSearch]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId]
  );

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
      let payments = await getPaymentsByRange(ledgerId, from, to);

      if (!allStudents && selectedStudentId) {
        payments = payments.filter((p) => p.student_id === selectedStudentId);
      }

      if (payments.length === 0) {
        toast.error("No transactions found for the selected period");
        return;
      }

      const periodLabel = period === "custom" ? `${from}_to_${to}` : period;
      const studentName = selectedStudent?.name;
      const fileName = studentName
        ? `${ledgerName}-${studentName}-${periodLabel}`
        : `${ledgerName}-${periodLabel}`;

      if (exportFormat === "csv") {
        exportToCSV(payments, fileName, "");
      } else {
        exportToPDF(payments, ledgerName, periodLabel, studentName ?? undefined);
      }

      toast.success(`${exportFormat.toUpperCase()} exported successfully`);
      onOpenChange(false);
    } catch {
      toast.error("Failed to export");
    } finally {
      setExporting(false);
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setAllStudents(true);
      setSelectedStudentId(null);
      setStudentSearch("");
    }
    onOpenChange(v);
  };

  const canExport = allStudents || !!selectedStudentId;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Export Transactions</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
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

          <Separator />

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>All Students</Label>
              <Switch
                checked={allStudents}
                onCheckedChange={(v) => {
                  setAllStudents(v);
                  if (v) {
                    setSelectedStudentId(null);
                    setStudentSearch("");
                  }
                }}
              />
            </div>
            {!allStudents && (
              <>
                <Input
                  placeholder="Search student..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                />
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {filteredStudents.map((s) => (
                    <button
                      key={s.id}
                      className="flex w-full items-center gap-2 rounded-lg p-2 text-left hover:bg-muted/50"
                      onClick={() => setSelectedStudentId(s.id)}
                    >
                      <UserAvatar
                        name={s.name}
                        avatarUrl={s.avatar_url}
                        className="h-7 w-7"
                      />
                      <span className="flex-1 text-sm">{s.name}</span>
                      {selectedStudentId === s.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <Separator />

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
          <Button
            onClick={handleExport}
            disabled={exporting || !canExport}
            className="w-full"
          >
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
