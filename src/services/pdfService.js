import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const BRAND_COLOR = [26, 63, 181]; // blue-700
const LIGHT_GRAY  = [248, 249, 250];
const DARK_TEXT   = [31, 41, 55];

// ─── Payslip PDF ────────────────────────────────────────────────────────────
export const generatePayslipPDF = (employee) => {
  const doc = new jsPDF();
  const net = employee.basic + employee.allowances - employee.deductions;

  // Header bar
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("NetPair Infotech", 14, 12);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Employee Payslip", 14, 20);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 196, 20, { align: "right" });

  // Employee info box
  doc.setFillColor(...LIGHT_GRAY);
  doc.roundedRect(14, 34, 182, 36, 3, 3, "F");
  doc.setTextColor(...DARK_TEXT);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(employee.name, 20, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Department: ${employee.dept}`, 20, 52);
  doc.text(`Designation: ${employee.designation}`, 20, 59);
  doc.text(`Pay Period: ${employee.month}`, 120, 44);
  doc.text(`Status: ${employee.status}`, 120, 52);

  // Salary table
  autoTable(doc, {
    startY: 78,
    head: [["Component", "Amount (₹)"]],
    body: [
      ["Basic Salary",  `₹ ${employee.basic.toLocaleString()}`],
      ["Allowances",    `+ ₹ ${employee.allowances.toLocaleString()}`],
      ["Deductions",    `- ₹ ${employee.deductions.toLocaleString()}`],
    ],
    foot: [["Net Pay", `₹ ${net.toLocaleString()}`]],
    headStyles:  { fillColor: BRAND_COLOR, textColor: 255, fontStyle: "bold" },
    footStyles:  { fillColor: [220, 230, 255], textColor: DARK_TEXT, fontStyle: "bold", fontSize: 11 },
    bodyStyles:  { textColor: DARK_TEXT },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    columnStyles: { 1: { halign: "right" } },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageH = doc.internal.pageSize.height;
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, pageH - 14, 210, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("This is a system-generated payslip. NetPair Infotech © 2026", 105, pageH - 5, { align: "center" });

  doc.save(`payslip_${employee.name.replace(/\s+/g, "_")}_${employee.month.replace(/\s+/g, "_")}.pdf`);
};

// ─── Attendance Report PDF ───────────────────────────────────────────────────
export const generateAttendanceReportPDF = (data, filters = {}) => {
  const doc = new jsPDF();

  const present = data.filter(r => r.status === "Present").length;
  const absent  = data.filter(r => r.status === "Absent").length;
  const late    = data.filter(r => r.status === "Late").length;

  // Header
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("NetPair Infotech", 14, 12);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Attendance Report", 14, 20);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 196, 20, { align: "right" });

  // Date range
  doc.setTextColor(...DARK_TEXT);
  doc.setFontSize(9);
  if (filters.fromDate || filters.toDate) {
    doc.text(`Period: ${filters.fromDate || "—"} to ${filters.toDate || "—"}`, 14, 36);
  }
  if (filters.department && filters.department !== "All") {
    doc.text(`Department: ${filters.department}`, 14, 43);
  }

  // Summary cards
  const summaryY = 50;
  const cards = [
    { label: "Total",   value: data.length, color: BRAND_COLOR },
    { label: "Present", value: present,     color: [5, 150, 105] },
    { label: "Absent",  value: absent,      color: [220, 38, 38] },
    { label: "Late",    value: late,        color: [217, 119, 6] },
  ];
  cards.forEach((c, i) => {
    const x = 14 + i * 46;
    doc.setFillColor(...c.color);
    doc.roundedRect(x, summaryY, 42, 20, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(String(c.value), x + 21, summaryY + 11, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text(c.label, x + 21, summaryY + 17, { align: "center" });
  });

  // Table
  autoTable(doc, {
    startY: summaryY + 28,
    head: [["Employee", "Date", "Check In", "Check Out", "Status"]],
    body: data.map(r => [r.employee, r.date, r.checkIn || "—", r.checkOut || "—", r.status]),
    headStyles: { fillColor: BRAND_COLOR, textColor: 255, fontStyle: "bold" },
    bodyStyles: { textColor: DARK_TEXT, fontSize: 9 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    didDrawCell: (hookData) => {
      if (hookData.section === "body" && hookData.column.index === 4) {
        const status = hookData.cell.raw;
        const colors = { Present: [5,150,105], Absent: [220,38,38], Late: [217,119,6] };
        if (colors[status]) doc.setTextColor(...colors[status]);
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageH = doc.internal.pageSize.height;
  doc.setFillColor(...BRAND_COLOR);
  doc.rect(0, pageH - 14, 210, 14, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text("NetPair Infotech — Attendance Report © 2026", 105, pageH - 5, { align: "center" });

  const from = filters.fromDate || "all";
  const to   = filters.toDate   || "dates";
  doc.save(`attendance_report_${from}_${to}.pdf`);
};
