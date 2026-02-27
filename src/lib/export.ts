import Papa from "papaparse";
import jsPDF from "jspdf";
import type { PaymentWithStudent, GlobalSummary } from "@/types";
import { formatCurrency } from "@/lib/utils";

export function exportToCSV(
  payments: PaymentWithStudent[],
  ledgerName: string
): void {
  const rows = payments.map((p) => ({
    Date: p.payment_date,
    Time: new Date(p.created_at).toLocaleTimeString("en-PH"),
    Student: p.student.name,
    Amount: Number(p.amount).toFixed(2),
  }));
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${ledgerName}-full-log.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToPDF(
  payments: PaymentWithStudent[],
  summary: GlobalSummary,
  ledgerName: string
): void {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text(ledgerName, 14, 22);

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-PH")}`, 14, 30);
  doc.text(`Total Collected: ${formatCurrency(summary.totalCollected)}`, 14, 38);
  doc.text(`Payment Goal: ${formatCurrency(summary.paymentGoal)}`, 14, 44);
  doc.text(`Progress: ${summary.goalProgress.toFixed(1)}%`, 14, 50);

  doc.setFontSize(12);
  doc.text("Transaction Log", 14, 62);

  doc.setFontSize(8);
  doc.text("Date", 14, 70);
  doc.text("Student", 50, 70);
  doc.text("Amount", 140, 70);

  doc.setDrawColor(200);
  doc.line(14, 72, 196, 72);

  let y = 78;
  for (const p of payments) {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(p.payment_date, 14, y);
    doc.text(p.student.name, 50, y);
    doc.text(formatCurrency(p.amount), 140, y);
    y += 6;
  }

  doc.save(`${ledgerName}-full-log.pdf`);
}
