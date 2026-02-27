import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCSV, exportToPDF } from "@/lib/export";
import { toast } from "sonner";
import type { PaymentWithStudent, GlobalSummary } from "@/types";

interface ExportButtonsProps {
  payments: PaymentWithStudent[];
  summary: GlobalSummary;
  ledgerName: string;
}

export function ExportButtons({
  payments,
  summary,
  ledgerName,
}: ExportButtonsProps) {
  const handleCSV = () => {
    try {
      exportToCSV(payments, ledgerName);
      toast.success("CSV exported successfully");
    } catch {
      toast.error("Failed to export CSV");
    }
  };

  const handlePDF = () => {
    try {
      exportToPDF(payments, summary, ledgerName);
      toast.success("PDF exported successfully");
    } catch {
      toast.error("Failed to export PDF");
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={handleCSV}
      >
        <Download className="mr-1 h-4 w-4" />
        CSV
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={handlePDF}
      >
        <FileText className="mr-1 h-4 w-4" />
        PDF
      </Button>
    </div>
  );
}
