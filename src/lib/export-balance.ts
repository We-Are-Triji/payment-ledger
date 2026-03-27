import Papa from "papaparse";
import jsPDF from "jspdf";
import { formatCurrency, formatCurrencyPdf } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/lib/avatar";
import { escapeHtml } from "@/lib/sanitize";
import type { StudentWithBalance } from "@/types";

export async function exportBalanceCard(
  element: HTMLElement,
  studentName: string
): Promise<void> {
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: "#ffffff",
    logging: false,
  });
  const url = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = url;
  link.download = `${studentName}-balance.png`;
  link.click();
}

const ROW_HEIGHT = 7;
const TABLE_LEFT = 14;
const TABLE_RIGHT = 196;
const COL_NUM = 14;
const COL_NAME = 22;
const COL_PAID = 120;
const COL_BAL = 152;

function drawReportHeader(doc: jsPDF, y: number): number {
  doc.setFillColor(240, 240, 240);
  doc.rect(TABLE_LEFT, y - 4.5, TABLE_RIGHT - TABLE_LEFT, ROW_HEIGHT, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(60, 60, 60);
  doc.text("#", COL_NUM, y);
  doc.text("Student", COL_NAME, y);
  doc.text("Paid", COL_PAID, y, { align: "right" });
  doc.text("Balance", COL_BAL, y, { align: "right" });
  doc.text("Status", TABLE_RIGHT, y, { align: "right" });

  doc.setDrawColor(100);
  doc.setLineWidth(0.4);
  doc.line(TABLE_LEFT, y + 2, TABLE_RIGHT, y + 2);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
  doc.setLineWidth(0.2);

  return y + ROW_HEIGHT;
}

export function exportBulkBalancePDF(
  students: StudentWithBalance[],
  ledgerName: string,
  totalExpected: number,
  depositAmount: number
): void {
  const sorted = [...students].sort((a, b) => {
    const order = { unpaid: 0, partial: 1, paid: 2 };
    const diff = order[a.status] - order[b.status];
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });

  const doc = new jsPDF();
  const now = new Date();
  const totalCollected = sorted.reduce((s, st) => s + st.totalPaid, 0);

  // Title
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(`${ledgerName} — Balance Report`, TABLE_LEFT, 20);

  // Subtitle info
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(
    `Generated: ${now.toLocaleDateString("en-PH")} ${now.toLocaleTimeString("en-PH")}`,
    TABLE_LEFT,
    28
  );
  doc.text(
    `Daily Deposit: ${formatCurrencyPdf(depositAmount)}  ·  Expected per student: ${formatCurrencyPdf(totalExpected)}`,
    TABLE_LEFT,
    34
  );

  // Separator
  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.line(TABLE_LEFT, 39, TABLE_RIGHT, 39);

  doc.setTextColor(0, 0, 0);

  // Table header
  let y = drawReportHeader(doc, 47);

  // Rows
  for (let i = 0; i < sorted.length; i++) {
    if (y > 275) {
      doc.addPage();
      y = drawReportHeader(doc, 20);
    }

    const s = sorted[i];

    if (i % 2 === 1) {
      doc.setFillColor(248, 248, 248);
      doc.rect(TABLE_LEFT, y - 4.5, TABLE_RIGHT - TABLE_LEFT, ROW_HEIGHT, "F");
    }

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(String(i + 1), COL_NUM, y);

    doc.setTextColor(0, 0, 0);
    doc.text(s.name, COL_NAME, y);
    doc.text(formatCurrencyPdf(s.totalPaid), COL_PAID, y, { align: "right" });
    doc.text(formatCurrencyPdf(s.balance), COL_BAL, y, { align: "right" });

    const statusLabel = s.status.toUpperCase();
    if (s.status === "unpaid") doc.setTextColor(220, 38, 38);
    else if (s.status === "partial") doc.setTextColor(202, 138, 4);
    else doc.setTextColor(22, 163, 74);
    doc.setFont("helvetica", "bold");
    doc.text(statusLabel, TABLE_RIGHT, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    doc.setDrawColor(220);
    doc.line(TABLE_LEFT, y + 2, TABLE_RIGHT, y + 2);

    y += ROW_HEIGHT;
  }

  // Bottom separator
  doc.setDrawColor(100);
  doc.setLineWidth(0.4);
  doc.line(TABLE_LEFT, y, TABLE_RIGHT, y);

  // Summary
  y += 8;
  if (y > 280) {
    doc.addPage();
    y = 20;
  }

  const unpaidCount = sorted.filter((s) => s.status === "unpaid").length;
  const partialCount = sorted.filter((s) => s.status === "partial").length;
  const paidCount = sorted.filter((s) => s.status === "paid").length;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Total Collected: ${formatCurrencyPdf(totalCollected)}`, TABLE_LEFT, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Unpaid: ${unpaidCount}  ·  Partial: ${partialCount}  ·  Paid: ${paidCount}`,
    TABLE_LEFT,
    y + 6
  );

  doc.save(`${ledgerName}-Balance-Report.pdf`);
}

export function exportBulkBalanceCSV(
  students: StudentWithBalance[],
  ledgerName: string,
  totalExpected: number,
  depositAmount: number
): void {
  const rows = [...students]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((student) => ({
      Member: student.name,
      Paid: student.totalPaid.toFixed(2),
      Expected: totalExpected.toFixed(2),
      Balance: student.balance.toFixed(2),
      Status: student.status,
      "Daily Rate": depositAmount.toFixed(2),
    }));

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${ledgerName}-Balance-Report.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportSingleBalanceCSV(
  student: StudentWithBalance,
  ledgerName: string,
  totalExpected: number,
  depositAmount: number
): void {
  const csv = Papa.unparse([
    {
      Ledger: ledgerName,
      Member: student.name,
      Paid: student.totalPaid.toFixed(2),
      Expected: totalExpected.toFixed(2),
      Balance: student.balance.toFixed(2),
      Status: student.status,
      "Daily Rate": depositAmount.toFixed(2),
    },
  ]);

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${student.name}-balance.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportSingleBalancePDF(
  student: StudentWithBalance,
  ledgerName: string,
  totalExpected: number,
  depositAmount: number
): void {
  const doc = new jsPDF();
  const now = new Date();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(`${student.name} Balance Report`, TABLE_LEFT, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Ledger: ${ledgerName}`, TABLE_LEFT, 28);
  doc.text(
    `Generated: ${now.toLocaleDateString("en-PH")} ${now.toLocaleTimeString("en-PH")}`,
    TABLE_LEFT,
    34
  );

  doc.setDrawColor(180);
  doc.setLineWidth(0.3);
  doc.line(TABLE_LEFT, 39, TABLE_RIGHT, 39);

  const rows = [
    ["Total Paid", formatCurrencyPdf(student.totalPaid)],
    ["Expected", formatCurrencyPdf(totalExpected)],
    ["Balance", formatCurrencyPdf(student.balance)],
    ["Daily Rate", formatCurrencyPdf(depositAmount)],
    ["Status", student.status.toUpperCase()],
  ];

  let y = 52;
  for (const [label, value] of rows) {
    doc.setTextColor(90, 90, 90);
    doc.setFont("helvetica", "normal");
    doc.text(label, TABLE_LEFT, y);

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(value, TABLE_RIGHT, y, { align: "right" });

    doc.setDrawColor(220);
    doc.setLineWidth(0.2);
    doc.line(TABLE_LEFT, y + 3, TABLE_RIGHT, y + 3);
    y += 12;
  }

  doc.save(`${student.name}-Balance-Report.pdf`);
}

export function renderBalanceCardStyles(
  student: StudentWithBalance,
  ledgerName: string,
  depositAmount: number,
  totalExpected: number
): { __html: string } {
  const { bg, text } = getAvatarColor(student.name);
  const initials = getInitials(student.name);
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const statusColor =
    student.status === "paid"
      ? "#16a34a"
      : student.status === "partial"
        ? "#ca8a04"
        : "#dc2626";
  const statusBg =
    student.status === "paid"
      ? "#f0fdf4"
      : student.status === "partial"
        ? "#fefce8"
        : "#fef2f2";

  const safeName = escapeHtml(student.name);
  const safeInitials = escapeHtml(initials);
  const safeLedgerName = escapeHtml(ledgerName);

  const html = `
    <div style="width:360px;padding:24px;font-family:system-ui,-apple-system,sans-serif;background:#fff;border:1px solid #e5e7eb;border-radius:12px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div style="width:48px;height:48px;border-radius:50%;background:${bg};color:${text};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;">${safeInitials}</div>
        <div>
          <div style="font-weight:600;font-size:16px;color:#111;">${safeName}</div>
          <div style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;background:${statusBg};color:${statusColor};margin-top:2px;">${student.status.toUpperCase()}</div>
        </div>
      </div>
      <div style="border-top:1px solid #e5e7eb;padding-top:12px;display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;justify-content:space-between;font-size:14px;">
          <span style="color:#6b7280;">Balance</span>
          <span style="font-weight:600;color:${student.balance >= 0 ? "#16a34a" : "#dc2626"};">${formatCurrency(student.balance)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:14px;">
          <span style="color:#6b7280;">Total Paid</span>
          <span style="font-weight:600;">${formatCurrency(student.totalPaid)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:14px;">
          <span style="color:#6b7280;">Expected</span>
          <span style="font-weight:600;">${formatCurrency(totalExpected)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:14px;">
          <span style="color:#6b7280;">Daily Rate</span>
          <span style="font-weight:600;">${formatCurrency(depositAmount)}</span>
        </div>
      </div>
      <div style="border-top:1px solid #e5e7eb;margin-top:12px;padding-top:8px;font-size:11px;color:#9ca3af;text-align:center;">
        ${safeLedgerName} · ${dateStr}
      </div>
    </div>
  `;

  return { __html: html };
}
