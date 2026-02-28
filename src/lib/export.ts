import Papa from "papaparse";
import jsPDF from "jspdf";
import type { PaymentWithStudent, AuditLogEntry } from "@/types";
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

const ROW_HEIGHT = 7;
const TABLE_LEFT = 14;
const TABLE_RIGHT = 196;
const COL_DATE = 14;
const COL_TIME = 44;
const COL_STUDENT = 74;

function drawTableHeader(doc: jsPDF, y: number): number {
  // Header background
  doc.setFillColor(240, 240, 240);
  doc.rect(TABLE_LEFT, y - 4.5, TABLE_RIGHT - TABLE_LEFT, ROW_HEIGHT, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("Date", COL_DATE, y);
  doc.text("Time", COL_TIME, y);
  doc.text("Student", COL_STUDENT, y);
  doc.text("Amount", TABLE_RIGHT, y, { align: "right" });

  // Bold separator under header
  doc.setDrawColor(100);
  doc.setLineWidth(0.4);
  doc.line(TABLE_LEFT, y + 2, TABLE_RIGHT, y + 2);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setLineWidth(0.2);

  return y + ROW_HEIGHT;
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
  const total = active.reduce((sum, p) => sum + Number(p.amount), 0);

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(ledgerName, TABLE_LEFT, 20);

  // Subtitle info
  let infoY = 28;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);

  if (studentName) {
    doc.text(`Student: ${studentName}`, TABLE_LEFT, infoY);
    infoY += 6;
  }
  doc.text(`Period: ${periodLabel}`, TABLE_LEFT, infoY);
  doc.text(
    `Generated: ${now.toLocaleDateString("en-PH")} ${now.toLocaleTimeString("en-PH")}`,
    TABLE_LEFT,
    infoY + 6
  );
  doc.text(
    `${active.length} transactions  ·  ${formatCurrency(total)}`,
    TABLE_LEFT,
    infoY + 12
  );

  // Separator
  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.line(TABLE_LEFT, infoY + 17, TABLE_RIGHT, infoY + 17);

  doc.setTextColor(0, 0, 0);

  // Table header
  let y = drawTableHeader(doc, infoY + 25);

  // Table rows
  for (let i = 0; i < active.length; i++) {
    if (y > 275) {
      doc.addPage();
      y = drawTableHeader(doc, 20);
    }

    const p = active[i];

    // Alternating row shading
    if (i % 2 === 1) {
      doc.setFillColor(248, 248, 248);
      doc.rect(TABLE_LEFT, y - 4.5, TABLE_RIGHT - TABLE_LEFT, ROW_HEIGHT, "F");
    }

    doc.setFontSize(8);
    doc.text(p.payment_date, COL_DATE, y);
    doc.text(new Date(p.created_at).toLocaleTimeString("en-PH"), COL_TIME, y);
    doc.text(p.student.name, COL_STUDENT, y);
    doc.text(formatCurrency(p.amount), TABLE_RIGHT, y, { align: "right" });

    // Light row separator
    doc.setDrawColor(220);
    doc.line(TABLE_LEFT, y + 2, TABLE_RIGHT, y + 2);

    y += ROW_HEIGHT;
  }

  // Bottom summary separator
  doc.setDrawColor(100);
  doc.setLineWidth(0.4);
  doc.line(TABLE_LEFT, y, TABLE_RIGHT, y);

  // Summary
  y += 8;
  if (y > 280) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ${formatCurrency(total)}  ·  ${active.length} transactions`, TABLE_LEFT, y);
  doc.setFont("helvetica", "normal");

  // Save
  const pdfFileName = studentName
    ? `${ledgerName}-${studentName}-${periodLabel}`
    : `${ledgerName}-${periodLabel}`;
  doc.save(`${pdfFileName}.pdf`);
}

export function exportAuditLogToCSV(
  entries: AuditLogEntry[],
  ledgerName: string
): void {
  const rows = entries.map((e) => ({
    Timestamp: sanitizeCell(new Date(e.created_at).toLocaleString("en-PH")),
    Event: sanitizeCell(e.event_type),
    Description: sanitizeCell(e.description),
    Metadata: sanitizeCell(JSON.stringify(e.metadata)),
  }));
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${ledgerName}-audit-log.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const AUDIT_COL_TIME = 14;
const AUDIT_COL_EVENT = 50;
const AUDIT_COL_DESC = 85;

function drawAuditHeader(doc: jsPDF, y: number): number {
  doc.setFillColor(240, 240, 240);
  doc.rect(TABLE_LEFT, y - 4.5, TABLE_RIGHT - TABLE_LEFT, ROW_HEIGHT, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("Timestamp", AUDIT_COL_TIME, y);
  doc.text("Event", AUDIT_COL_EVENT, y);
  doc.text("Description", AUDIT_COL_DESC, y);

  doc.setDrawColor(100);
  doc.setLineWidth(0.4);
  doc.line(TABLE_LEFT, y + 2, TABLE_RIGHT, y + 2);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setLineWidth(0.2);

  return y + ROW_HEIGHT;
}

export function exportAuditLogToPDF(
  entries: AuditLogEntry[],
  ledgerName: string
): void {
  const doc = new jsPDF();
  const now = new Date();

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`${ledgerName} — System Log`, TABLE_LEFT, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Generated: ${now.toLocaleDateString("en-PH")} ${now.toLocaleTimeString("en-PH")}`,
    TABLE_LEFT,
    28
  );
  doc.text(`${entries.length} entries`, TABLE_LEFT, 34);

  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.line(TABLE_LEFT, 39, TABLE_RIGHT, 39);

  doc.setTextColor(0, 0, 0);

  let y = drawAuditHeader(doc, 47);

  for (let i = 0; i < entries.length; i++) {
    if (y > 275) {
      doc.addPage();
      y = drawAuditHeader(doc, 20);
    }

    const e = entries[i];

    if (i % 2 === 1) {
      doc.setFillColor(248, 248, 248);
      doc.rect(TABLE_LEFT, y - 4.5, TABLE_RIGHT - TABLE_LEFT, ROW_HEIGHT, "F");
    }

    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    const ts = new Date(e.created_at);
    doc.text(
      `${ts.toLocaleDateString("en-PH")} ${ts.toLocaleTimeString("en-PH")}`,
      AUDIT_COL_TIME,
      y
    );

    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text(e.event_type, AUDIT_COL_EVENT, y);

    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    const desc = e.description.length > 60
      ? e.description.slice(0, 57) + "..."
      : e.description;
    doc.text(desc, AUDIT_COL_DESC, y);

    doc.setDrawColor(220);
    doc.line(TABLE_LEFT, y + 2, TABLE_RIGHT, y + 2);

    y += ROW_HEIGHT;
  }

  doc.setDrawColor(100);
  doc.setLineWidth(0.4);
  doc.line(TABLE_LEFT, y, TABLE_RIGHT, y);

  y += 8;
  if (y > 280) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`${entries.length} entries`, TABLE_LEFT, y);
  doc.setFont("helvetica", "normal");

  doc.save(`${ledgerName}-audit-log.pdf`);
}
