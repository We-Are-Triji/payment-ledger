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
  periodLabel: string,
  studentName?: string
): void {
  const active = payments.filter((p) => !p.voided_at);
  const doc = new jsPDF();
  const now = new Date();

  doc.setFontSize(18);
  doc.text(ledgerName, 14, 22);

  let headerY = 30;
  doc.setFontSize(10);
  if (studentName) {
    doc.text(`Student: ${studentName}`, 14, headerY);
    headerY += 6;
  }
  doc.text(`Period: ${periodLabel}`, 14, headerY);
  doc.text(
    `Generated: ${now.toLocaleDateString("en-PH")} ${now.toLocaleTimeString("en-PH")}`,
    14,
    headerY + 6
  );
  doc.text(`Total Transactions: ${active.length}`, 14, headerY + 12);

  const total = active.reduce((sum, p) => sum + Number(p.amount), 0);
  doc.text(`Total Amount: ${formatCurrency(total)}`, 14, headerY + 18);

  doc.setFontSize(12);
  doc.text("Transaction Log", 14, headerY + 30);

  doc.setFontSize(8);
  doc.text("Date", 14, headerY + 38);
  doc.text("Time", 40, headerY + 38);
  doc.text("Student", 70, headerY + 38);
  doc.text("Amount", 160, headerY + 38);

  doc.setDrawColor(200);
  doc.line(14, headerY + 40, 196, headerY + 40);

  let y = headerY + 46;
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

  const pdfFileName = studentName
    ? `${ledgerName}-${studentName}-${periodLabel}`
    : `${ledgerName}-${periodLabel}`;
  doc.save(`${pdfFileName}.pdf`);
}
