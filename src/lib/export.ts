import Papa from "papaparse";
import jsPDF from "jspdf";
import type { PaymentWithStudent } from "@/types";
import { formatCurrency } from "@/lib/utils";

function sanitizeCell(value: string): string {
  if (/^[=+\-@]/.test(value)) return `\t${value}`;
  return value;
}

export function exportToCSV(
  payments: PaymentWithStudent[],
  ledgerName: string,
  periodLabel: string
): void {
  const active = payments.filter((p) => !p.voided_at);
  const rows = active.map((p) => ({
    Date: sanitizeCell(p.payment_date),
    Time: sanitizeCell(new Date(p.created_at).toLocaleTimeString("en-PH")),
    Student: sanitizeCell(p.student.name),
    Amount: Number(p.amount).toFixed(2),
  }));
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${ledgerName}-${periodLabel}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportToPDF(
  payments: PaymentWithStudent[],
  ledgerName: string,
  periodLabel: string
): void {
  const active = payments.filter((p) => !p.voided_at);
  const doc = new jsPDF();
  const now = new Date();

  doc.setFontSize(18);
  doc.text(ledgerName, 14, 22);

  doc.setFontSize(10);
  doc.text(`Period: ${periodLabel}`, 14, 30);
  doc.text(
    `Generated: ${now.toLocaleDateString("en-PH")} ${now.toLocaleTimeString("en-PH")}`,
    14,
    36
  );
  doc.text(`Total Transactions: ${active.length}`, 14, 42);

  const total = active.reduce((sum, p) => sum + Number(p.amount), 0);
  doc.text(`Total Amount: ${formatCurrency(total)}`, 14, 48);

  doc.setFontSize(12);
  doc.text("Transaction Log", 14, 60);

  doc.setFontSize(8);
  doc.text("Date", 14, 68);
  doc.text("Time", 40, 68);
  doc.text("Student", 70, 68);
  doc.text("Amount", 160, 68);

  doc.setDrawColor(200);
  doc.line(14, 70, 196, 70);

  let y = 76;
  for (const p of active) {
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
    doc.text(p.payment_date, 14, y);
    doc.text(new Date(p.created_at).toLocaleTimeString("en-PH"), 40, y);
    doc.text(p.student.name, 70, y);
    doc.text(formatCurrency(p.amount), 160, y);
    y += 6;
  }

  doc.save(`${ledgerName}-${periodLabel}.pdf`);
}
