"use client";

import * as XLSX from "xlsx-js-style";
import { jsPDF } from "jspdf";

/**
 * Export an array of objects (or array of arrays) to an Excel file and trigger download.
 * @param {Array<Object>|Array<Array>} data - Rows: array of objects (keys = headers) or array of arrays
 * @param {string} [filename="export.xlsx"] - Download filename
 * @param {string} [sheetName="Sheet1"] - Name of the worksheet
 */
export function exportToExcel(data, filename = "export.xlsx", sheetName = "Sheet1") {
  const wb = XLSX.utils.book_new();
  const ws = Array.isArray(data) && data.length > 0
    ? XLSX.utils.json_to_sheet(data)
    : XLSX.utils.aoa_to_sheet([[]]);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

/**
 * Export raw array-of-arrays to Excel (e.g. for custom headers).
 * @param {Array<Array>} rows - Rows of cell values
 * @param {string} [filename="export.xlsx"]
 * @param {string} [sheetName="Sheet1"]
 */
export function exportToExcelFromRows(rows, filename = "export.xlsx", sheetName = "Sheet1") {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows || [[]]);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

// Service list: display headers and mapping from API keys (normalized) to header label
const SERVICE_LIST_HEADERS = [
  "Equipment type",
  "Serial Number",
  "Job Number",
  "Mine",
  "Shaft",
  "Section",
  "Technician",
  "Job Date",
];
const SERVICE_LIST_KEY_MAP = {
  equipmenttype: "Equipment type",
  equipment_type: "Equipment type",
  serialno: "Serial Number",
  serial_number: "Serial Number",
  serialnumber: "Serial Number",
  jobnumber: "Job Number",
  job_number: "Job Number",
  jobno: "Job Number",
  mine: "Mine",
  shaft: "Shaft",
  section: "Section",
  technician: "Technician",
  jobdate: "Job Date",
  job_date: "Job Date",
};

/**
 * Get ordered keys and header labels for service list export (maps API keys to display headers).
 * @param {Object} [firstRow] - First data row to infer keys from
 * @returns {{ orderedKeys: string[], headerLabels: string[] }}
 */
export function getServiceListColumnConfig(firstRow) {
  if (!firstRow || typeof firstRow !== "object") {
    return { orderedKeys: [], headerLabels: [...SERVICE_LIST_HEADERS] };
  }
  const headerToKey = {};
  for (const k of Object.keys(firstRow)) {
    const n = k.toLowerCase().replace(/_/g, "");
    if (SERVICE_LIST_KEY_MAP[n]) headerToKey[SERVICE_LIST_KEY_MAP[n]] = k;
  }
  const orderedKeys = SERVICE_LIST_HEADERS.map((h) => headerToKey[h]).filter(Boolean);
  const headerLabels = orderedKeys.map(
    (k) => SERVICE_LIST_KEY_MAP[k.toLowerCase().replace(/_/g, "")] ?? k
  );
  return { orderedKeys, headerLabels };
}

function formatDateDdMmmYyyy(value) {
  if (value == null || value === "") return "";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-GB", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch {
    return String(value);
  }
}

/**
 * Export an array of objects to Excel with a title line above the table.
 * Column widths are set to fit content. Header row is bold with yellow fill.
 * @param {Array<Object>} data - Array of objects (keys = column headers)
 * @param {string} title - Text for the row above the table
 * @param {string} [filename="export.xlsx"]
 * @param {string} [sheetName="Sheet1"]
 * @param {{ orderedKeys: string[], headerLabels: string[] }} [columnConfig] - Optional: key order and display labels for headers (e.g. from getServiceListColumnConfig)
 * @param {string|Date|null} [fromDate] - Optional: when set, adds date line and filter lines above the table
 * @param {string|Date|null} [toDate] - Optional: appended to row 3 as "   To " + formatted date (dd MMM yyyy)
 * @param {{ mine?: string, shaft?: string, section?: string, gang?: string }} [filterLabels] - Optional: text for Mine/Shaft/Section/Gang lines (lines 4–7)
 * @param {string[]} [equipmentTypeLabels] - Optional: selected equipment type names for line 8 "Equipment types" + ", " + joined list
 */
export function exportToExcelWithTitle(
  data,
  title,
  filename = "export.xlsx",
  sheetName = "Sheet1",
  columnConfig,
  fromDate,
  toDate,
  filterLabels,
  equipmentTypeLabels
) {
  const rows = Array.isArray(data) ? data : [];
  const columns = columnConfig
    ? columnConfig.orderedKeys.length > 0
      ? columnConfig.orderedKeys
      : rows.length > 0
        ? Object.keys(rows[0])
        : []
    : rows.length > 0
      ? Object.keys(rows[0])
      : [];
  const headerRow = columnConfig?.headerLabels?.length
    ? columnConfig.headerLabels
    : columns;
  const colCount = columns.length || 1;
  const jobDateColIndex = headerRow.indexOf("Job Date");
  const dataRows = rows.map((row) =>
    columns.map((col, ci) => {
      const val = row[col];
      if (ci === jobDateColIndex && jobDateColIndex >= 0) return formatDateDdMmmYyyy(val);
      return val;
    })
  );

  const useFromDate = fromDate != null && fromDate !== "";
  const dateLine = useFromDate
    ? "From " + formatDateDdMmmYyyy(fromDate) + "   To " + formatDateDdMmmYyyy(toDate)
    : "";
  const labels = filterLabels || {};
  const eqTypes = Array.isArray(equipmentTypeLabels) ? equipmentTypeLabels : [];
  const equipmentTypesLine =
    "Equipment types" + (eqTypes.length ? ", " + eqTypes.join(", ") : "");
  const aoa = useFromDate
    ? [
        [title],
        [],
        [dateLine],
        ["Mine:  " + (labels.mine ?? "")],
        ["Shaft:  " + (labels.shaft ?? "")],
        ["Section:  " + (labels.section ?? "")],
        ["Gang:  " + (labels.gang ?? "")],
        [equipmentTypesLine], // line 8: Equipment types, type1, type2, ...
        [],
        [], // two blank lines above the table
        headerRow,
        ...dataRows,
      ]
    : [[title], headerRow, ...dataRows];

  const headerRowIndex = useFromDate ? 10 : 1;
  const tableStartRow = headerRowIndex;
  const tableEndRow = tableStartRow + dataRows.length;

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  const merges = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }]; // A1:H1
  if (useFromDate) {
    merges.push(
      { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } }, // A3:G3
      { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } }, // A4:G4
      { s: { r: 4, c: 0 }, e: { r: 4, c: 6 } }, // A5:G5
      { s: { r: 5, c: 0 }, e: { r: 5, c: 6 } }, // A6:G6
      { s: { r: 6, c: 0 }, e: { r: 6, c: 6 } }, // A7:G7
      { s: { r: 7, c: 0 }, e: { r: 7, c: 6 } }  // A8:G8 (Equipment types line)
    );
  }
  ws["!merges"] = merges;

  const a1Ref = XLSX.utils.encode_cell({ r: 0, c: 0 });
  if (ws[a1Ref])
    ws[a1Ref].s = {
      font: { name: "Aptos", sz: 18 },
      alignment: { horizontal: "center", vertical: "center" },
    };

  // Lines 3–8 (rows 2–7 filter lines + row 10 header): Aptos size 14
  const aptos14 = { font: { name: "Aptos", sz: 14 } };
  if (useFromDate) {
    for (let r = 2; r <= 7; r++) {
      const ref = XLSX.utils.encode_cell({ r, c: 0 });
      if (ws[ref]) ws[ref].s = { ...(ws[ref].s || {}), ...aptos14 };
    }
  }

  // Column widths to fit content (max of header + data cell lengths per column)
  const minWch = 8;
  const maxWch = 50;
  const cellStr = (val) => (val == null ? "" : String(val));
  const colWidths = [];
  for (let c = 0; c < colCount; c++) {
    let maxLen = cellStr(headerRow[c]).length;
    if (c === 0) maxLen = Math.max(maxLen, cellStr(title).length);
    for (let r = 0; r < dataRows.length; r++) {
      const len = cellStr(dataRows[r][c]).length;
      if (len > maxLen) maxLen = len;
    }
    colWidths.push(Math.min(maxWch, Math.max(minWch, maxLen + 1)));
  }
  ws["!cols"] = colWidths.map((wch) => ({ wch }));

  const thinBorder = {
    top: { style: "thin" },
    bottom: { style: "thin" },
    left: { style: "thin" },
    right: { style: "thin" },
  };

  // Header row (line 11): Aptos 11, bold + yellow fill + gridline borders
  const headerStyle = {
    font: { name: "Aptos", sz: 11, bold: true },
    fill: { fgColor: { rgb: "FFFF00" }, patternType: "solid" },
    border: thinBorder,
  };
  for (let c = 0; c < colCount; c++) {
    const ref = XLSX.utils.encode_cell({ r: headerRowIndex, c });
    if (ws[ref]) ws[ref].s = headerStyle;
  }

  // Data rows: Aptos 11 + borders
  const dataCellStyle = {
    font: { name: "Aptos", sz: 11 },
    border: thinBorder,
  };
  for (let r = tableStartRow + 1; r < tableEndRow; r++) {
    for (let c = 0; c < colCount; c++) {
      const ref = XLSX.utils.encode_cell({ r, c });
      if (ws[ref]) {
        ws[ref].s = { ...(ws[ref].s || {}), ...dataCellStyle };
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

/**
 * Create a PDF and trigger download with simple text content.
 * @param {string} text - Text to add to the PDF
 * @param {string} [filename="document.pdf"]
 */
export function exportToPdfText(text, filename = "document.pdf") {
  const doc = new jsPDF();
  doc.text(text, 10, 10);
  doc.save(filename);
}

/**
 * Get a jsPDF instance for custom PDF building (tables, multiple pages, etc.).
 * @returns {import("jspdf").jsPDF}
 */
export function createPdf() {
  return new jsPDF();
}

/**
 * Trigger download of an existing jsPDF document.
 * @param {import("jspdf").jsPDF} doc - Instance from createPdf()
 * @param {string} [filename="document.pdf"]
 */
export function savePdf(doc, filename = "document.pdf") {
  doc.save(filename);
}

function formatCellValue(value) {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/**
 * Export an array of objects to a PDF table and trigger download.
 * @param {Array<Object>} data - Array of objects (keys = column headers)
 * @param {string} [filename="export.pdf"]
 * @param {string} [title] - Optional line of text drawn above the table (e.g. "Service List")
 */
export function exportToPdfTable(data, filename = "export.pdf", title) {
  const rows = Array.isArray(data) ? data : [];
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const rowHeight = 6;
  const fontSize = 8;
  doc.setFontSize(fontSize);

  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const colCount = columns.length;
  const colWidth = colCount > 0 ? (pageWidth - 2 * margin) / colCount : pageWidth - 2 * margin;

  let y = margin;

  if (title && String(title).trim()) {
    doc.setFontSize(14);
    doc.text(String(title).trim(), margin, y + 6);
    y += 12;
    doc.setFontSize(fontSize);
  }

  const drawRow = (cells, isHeader = false) => {
    if (y + rowHeight > pageHeight - margin) {
      doc.addPage("landscape");
      y = margin;
    }
    let x = margin;
    doc.setFont(undefined, isHeader ? "bold" : "normal");
    for (let i = 0; i < cells.length; i++) {
      const text = formatCellValue(cells[i]);
      doc.text(text, x + 1, y + 4);
      x += colWidth;
    }
    y += rowHeight;
  };

  drawRow(columns, true);
  doc.setFont(undefined, "normal");
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    drawRow(columns.map((k) => row[k]));
  }

  doc.save(filename);
}
