import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Generates and downloads a clean, professional Tax / GST Audit Report in PDF format.
 * Matches and enhances the Excel report data.
 */
export const generateTaxReportPDF = ({ data = [], totals = {}, timeframe = 'monthly' }) => {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 297 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210 mm

  // Header Background Bar (Navy / Brand primary)
  doc.setFillColor(30, 58, 138); // #1E3A8A
  doc.rect(0, 0, pageWidth, 26, "F");

  // Accent Line
  doc.setFillColor(37, 99, 235); // #2563EB
  doc.rect(0, 26, pageWidth, 2, "F");

  // Company / Brand Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("KWIK CAB SERVICES - ADMIN PORTAL", 14, 11);

  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(219, 234, 254);
  doc.text("TAX & GST AUDIT REPORT • COMPLETED BOOKINGS & TAX BREAKDOWN", 14, 18);

  // Top Right Meta Info
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  const tfLabel = (timeframe || 'monthly').toUpperCase();
  doc.text(`TIMEFRAME: ${tfLabel}`, pageWidth - 14, 10, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(219, 234, 254);
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  doc.text(`Generated: ${dateStr}`, pageWidth - 14, 16, { align: "right" });
  doc.text("Currency: INR (Rs.)", pageWidth - 14, 21, { align: "right" });

  // 4 Top KPI Highlights
  const startY = 32;
  const cardGap = 5;
  const cardWidth = (pageWidth - 28 - (3 * cardGap)) / 4;
  const cardHeight = 17;

  const totalBase = typeof totals.baseFare === 'number' ? totals.baseFare : parseFloat(totals.baseFare || 0);
  const totalGst = typeof totals.totalTax === 'number' ? totals.totalTax : parseFloat(totals.totalTax || 0);
  const totalGross = typeof totals.finalFare === 'number' ? totals.finalFare : parseFloat(totals.finalFare || 0);

  const cards = [
    {
      label: "TOTAL COMPLETED TRIPS",
      value: `${data.length}`,
      bg: [240, 249, 255],
      border: [186, 230, 253],
      text: [3, 105, 161],
    },
    {
      label: "TOTAL BASE FARE",
      value: `Rs. ${totalBase.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      bg: [240, 253, 244],
      border: [187, 247, 208],
      text: [21, 128, 61],
    },
    {
      label: "TOTAL GST (5%)",
      value: `Rs. ${totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      bg: [254, 242, 242],
      border: [254, 202, 202],
      text: [185, 28, 28],
    },
    {
      label: "TOTAL GROSS FARE",
      value: `Rs. ${totalGross.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      bg: [245, 243, 255],
      border: [221, 214, 254],
      text: [109, 40, 217],
    },
  ];

  cards.forEach((card, idx) => {
    const x = 14 + idx * (cardWidth + cardGap);
    doc.setFillColor(...card.bg);
    doc.setDrawColor(...card.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(card.label, x + 3.5, startY + 5.5);

    doc.setFontSize(9.5);
    doc.setTextColor(...card.text);
    doc.text(card.value, x + 3.5, startY + 12.5);
  });

  // Table Preparation
  const tableRows = data.map((item, idx) => {
    const base = parseFloat(item["Base Fare"] || 0);
    const cgst = parseFloat(item["CGST (2.5%)"] || 0);
    const sgst = parseFloat(item["SGST (2.5%)"] || 0);
    const tax = parseFloat(item["Total Tax"] || 0);
    const finalFare = parseFloat(item["Final Fare"] || 0);

    const bookingId = item["Booking ID"] || "";
    const shortId = bookingId.length > 12 ? bookingId.substring(bookingId.length - 12) : bookingId;

    return [
      (idx + 1).toString(),
      item["Date"] || "-",
      shortId || "-",
      item["Ride Type"] || "Normal",
      item["Customer Name"] || "Unknown",
      base.toFixed(2),
      cgst.toFixed(2),
      sgst.toFixed(2),
      tax.toFixed(2),
      finalFare.toFixed(2),
    ];
  });

  const totalCgst = typeof totals.cgst === 'number' ? totals.cgst : parseFloat(totals.cgst || 0);
  const totalSgst = typeof totals.sgst === 'number' ? totals.sgst : parseFloat(totals.sgst || 0);

  const footRow = [
    [
      { content: "GRAND TOTAL (Rs.)", colSpan: 5, styles: { halign: "right", fontStyle: "bold", textColor: [255, 255, 255] } },
      { content: totalBase.toFixed(2), styles: { halign: "right", fontStyle: "bold", textColor: [255, 255, 255] } },
      { content: totalCgst.toFixed(2), styles: { halign: "right", fontStyle: "bold", textColor: [255, 255, 255] } },
      { content: totalSgst.toFixed(2), styles: { halign: "right", fontStyle: "bold", textColor: [255, 255, 255] } },
      { content: totalGst.toFixed(2), styles: { halign: "right", fontStyle: "bold", textColor: [255, 255, 255] } },
      { content: totalGross.toFixed(2), styles: { halign: "right", fontStyle: "bold", textColor: [255, 255, 255] } },
    ]
  ];

  autoTable(doc, {
    startY: 53,
    margin: { left: 14, right: 14, bottom: 15 },
    head: [
      [
        "#",
        "Date",
        "Booking ID",
        "Ride Type",
        "Customer Name",
        "Base Fare",
        "CGST (2.5%)",
        "SGST (2.5%)",
        "Total Tax",
        "Final Fare",
      ],
    ],
    body: tableRows.length > 0 ? tableRows : [
      [{ content: "No completed bookings found for the selected timeframe.", colSpan: 10, styles: { halign: "center", fontStyle: "italic", textColor: [100, 116, 139], cellPadding: 8 } }]
    ],
    foot: tableRows.length > 0 ? footRow : undefined,
    theme: "striped",
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
      cellPadding: 2.8,
    },
    footStyles: {
      fillColor: [15, 23, 42],
      fontSize: 8.5,
      cellPadding: 3,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.3,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 36, halign: "left" },
      2: { cellWidth: 32, halign: "center" },
      3: { cellWidth: 26, halign: "center" },
      4: { cellWidth: 41, halign: "left" },
      5: { cellWidth: 25, halign: "right" },
      6: { cellWidth: 25, halign: "right" },
      7: { cellWidth: 25, halign: "right" },
      8: { cellWidth: 24, halign: "right" },
      9: { cellWidth: 25, halign: "right" },
    },
    didDrawPage: () => {
      const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
      const totalPages = doc.internal.getNumberOfPages();

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(
        "Kwik Cabs Admin Portal • System Generated Official GST & Tax Audit Report • Confidential",
        14,
        pageHeight - 6
      );
      doc.text(
        `Page ${pageNum} of ${totalPages}`,
        pageWidth - 14,
        pageHeight - 6,
        { align: "right" }
      );
    },
  });

  const filename = `Kwikcab_Tax_Report_${tfLabel.toLowerCase()}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
};

/**
 * Generates an Executive System Summary Report (Overview, Financials, Growth, Recent Activity)
 */
export const generateSystemSummaryPDF = ({ reportData = {}, timeframe = 'monthly' }) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297 mm

  const overview = reportData.overview || {};
  const financials = reportData.financials || {};
  const growth = reportData.growth || {};
  const transactions = reportData.recentTransactions || [];

  const totalRevenue = overview.totalRevenue || 0;
  const totalBookings = overview.totalBookings || 0;
  const completedRides = overview.completedRides || 0;
  const cancelledRides = overview.cancelledRides || 0;
  const cancellationRate = overview.cancellationRate || '0%';
  const adminEarnings = financials.adminEarnings || 0;
  const totalAgentCommissions = financials.totalAgentCommissions || 0;
  const newUsers = growth.newUsersLast30Days || 0;
  const newDrivers = growth.newDriversLast30Days || 0;

  // Header Banner
  doc.setFillColor(30, 58, 138); // #1E3A8A
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setFillColor(37, 99, 235); // Accent
  doc.rect(0, 28, pageWidth, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("KWIK CAB SERVICES", 14, 12);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(219, 234, 254);
  doc.text("EXECUTIVE SYSTEM SUMMARY & FINANCIAL REPORT", 14, 19);

  // Right Header Info
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(`STATUS: ACTIVE`, pageWidth - 14, 11, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(219, 234, 254);
  const now = new Date();
  doc.text(`Generated: ${now.toLocaleDateString("en-IN")}`, pageWidth - 14, 17, { align: "right" });
  doc.text(`Currency: INR (Rs.)`, pageWidth - 14, 23, { align: "right" });

  // Section 1: Executive KPI Cards
  let currentY = 36;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text("1. EXECUTIVE PERFORMANCE OVERVIEW", 14, currentY);

  currentY += 4;
  const kpiGrid = [
    { label: "TOTAL REVENUE", value: `Rs. ${totalRevenue.toLocaleString('en-IN')}`, color: [37, 99, 235] },
    { label: "TOTAL BOOKINGS", value: `${totalBookings}`, color: [16, 185, 129] },
    { label: "COMPLETED RIDES", value: `${completedRides}`, color: [5, 150, 105] },
    { label: "CANCELLED RIDES", value: `${cancelledRides} (${cancellationRate})`, color: [220, 38, 38] },
    { label: "ADMIN EARNINGS", value: `Rs. ${adminEarnings.toLocaleString('en-IN')}`, color: [124, 58, 237] },
    { label: "AGENT COMMISSIONS", value: `Rs. ${totalAgentCommissions.toLocaleString('en-IN')}`, color: [217, 119, 6] },
    { label: "NEW USERS (30D)", value: `${newUsers}`, color: [8, 145, 178] },
    { label: "NEW DRIVERS (30D)", value: `${newDrivers}`, color: [219, 39, 119] },
  ];

  const cols = 4;
  const cardW = (pageWidth - 28 - (cols - 1) * 4) / cols;
  const cardH = 16;

  kpiGrid.forEach((kpi, idx) => {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    const x = 14 + c * (cardW + 4);
    const y = currentY + r * (cardH + 4);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, cardW, cardH, 1.5, 1.5, "FD");

    // Left colored accent border
    doc.setFillColor(...kpi.color);
    doc.rect(x, y, 1.5, cardH, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, x + 3.5, y + 5);

    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(kpi.value, x + 3.5, y + 12);
  });

  currentY += (2 * (cardH + 4)) + 6;

  // Section 2: Recent Transactions Table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text("2. RECENT FINANCIAL TRANSACTIONS", 14, currentY);

  const txRows = transactions.slice(0, 20).map((t, idx) => [
    (idx + 1).toString(),
    new Date(t.createdAt).toLocaleDateString('en-IN'),
    t.user?.name || t.userModel || "System",
    t.type || "Credit",
    t.category || "General",
    `${t.type === 'Credit' ? '+' : '-'} Rs. ${(t.amount || 0).toLocaleString('en-IN')}`,
    t.status || "Completed",
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    margin: { left: 14, right: 14, bottom: 15 },
    head: [["#", "Date", "User / Entity", "Type", "Category", "Amount", "Status"]],
    body: txRows.length > 0 ? txRows : [
      [{ content: "No recent transactions found.", colSpan: 7, styles: { halign: "center", fontStyle: "italic", textColor: [100, 116, 139] } }]
    ],
    theme: "striped",
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 26, halign: "left" },
      2: { cellWidth: 42, halign: "left" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 32, halign: "left" },
      5: { cellWidth: 28, halign: "right" },
      6: { cellWidth: 24, halign: "center" },
    },
    didDrawPage: () => {
      const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
      const totalPages = doc.internal.getNumberOfPages();

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(
        "Kwik Cabs Admin Portal • System Executive Report • Confidential",
        14,
        pageHeight - 6
      );
      doc.text(
        `Page ${pageNum} of ${totalPages}`,
        pageWidth - 14,
        pageHeight - 6,
        { align: "right" }
      );
    },
  });

  const filename = `Kwikcab_System_Report_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
};

/**
 * Generates and downloads a detailed transaction audit ledger in PDF format.
 */
export const generateTransactionsPDF = ({ transactions = [], timeframe = 'monthly' }) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Header Banner
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 26, "F");

  doc.setFillColor(37, 99, 235);
  doc.rect(0, 26, pageWidth, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("KWIK CAB SERVICES", 14, 11);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(219, 234, 254);
  doc.text("DETAILED TRANSACTION AUDIT LEDGER", 14, 18);

  const tfLabel = (timeframe || 'monthly').toUpperCase();
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(`TIMEFRAME: ${tfLabel}`, pageWidth - 14, 10, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(219, 234, 254);
  const now = new Date();
  doc.text(`Generated: ${now.toLocaleDateString("en-IN")}`, pageWidth - 14, 16, { align: "right" });
  doc.text(`Total Records: ${transactions.length}`, pageWidth - 14, 21, { align: "right" });

  // Summary Metrics
  let totalCredits = 0;
  let totalDebits = 0;
  transactions.forEach(t => {
    const amt = parseFloat(t.amount || 0);
    if (t.type === 'Credit') totalCredits += amt;
    else if (t.type === 'Debit') totalDebits += amt;
  });

  const startY = 32;
  const cardGap = 4;
  const cardWidth = (pageWidth - 28 - (2 * cardGap)) / 3;
  const cardHeight = 15;

  const cards = [
    { label: "TOTAL TRANSACTIONS", value: `${transactions.length}`, bg: [240, 249, 255], border: [186, 230, 253], text: [3, 105, 161] },
    { label: "TOTAL CREDITS (+)", value: `Rs. ${totalCredits.toLocaleString('en-IN')}`, bg: [240, 253, 244], border: [187, 247, 208], text: [21, 128, 61] },
    { label: "TOTAL DEBITS (-)", value: `Rs. ${totalDebits.toLocaleString('en-IN')}`, bg: [254, 242, 242], border: [254, 202, 202], text: [185, 28, 28] },
  ];

  cards.forEach((c, idx) => {
    const x = 14 + idx * (cardWidth + cardGap);
    doc.setFillColor(...c.bg);
    doc.setDrawColor(...c.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, startY, cardWidth, cardHeight, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(c.label, x + 3.5, startY + 5);

    doc.setFontSize(9);
    doc.setTextColor(...c.text);
    doc.text(c.value, x + 3.5, startY + 11.5);
  });

  const txRows = transactions.map((t, idx) => [
    (idx + 1).toString(),
    new Date(t.createdAt).toLocaleDateString('en-IN'),
    t.user?.name || t.userModel || "System",
    t.type || "Credit",
    t.category || "General",
    `${t.type === 'Credit' ? '+' : '-'} Rs. ${(t.amount || 0).toLocaleString('en-IN')}`,
    t.status || "Completed",
  ]);

  autoTable(doc, {
    startY: 51,
    margin: { left: 14, right: 14, bottom: 15 },
    head: [["#", "Date", "User / Entity", "Type", "Category", "Amount", "Status"]],
    body: txRows.length > 0 ? txRows : [
      [{ content: "No transactions found.", colSpan: 7, styles: { halign: "center", fontStyle: "italic", textColor: [100, 116, 139] } }]
    ],
    theme: "striped",
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 26, halign: "left" },
      2: { cellWidth: 42, halign: "left" },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 32, halign: "left" },
      5: { cellWidth: 28, halign: "right" },
      6: { cellWidth: 24, halign: "center" },
    },
    didDrawPage: () => {
      const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
      const totalPages = doc.internal.getNumberOfPages();

      doc.setFontSize(7.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(
        "Kwik Cabs Admin Portal • Detailed Transactions Ledger • Confidential",
        14,
        pageHeight - 6
      );
      doc.text(
        `Page ${pageNum} of ${totalPages}`,
        pageWidth - 14,
        pageHeight - 6,
        { align: "right" }
      );
    },
  });

  const filename = `Kwikcab_Transactions_${tfLabel.toLowerCase()}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
};
