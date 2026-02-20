"use client";

import * as XLSX from "xlsx-js-style";
import ExcelJS from "exceljs";
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
  "Equipment category ID",
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
  equipmentcategoryid: "Equipment category ID",
  equipmentcategories_id: "Equipment category ID",
  equipment_category_id: "Equipment category ID",
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

export function formatDateDdMmmYyyy(value) {
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
 * Load image from /Siyanda.png as base64 for ExcelJS. Returns null if fetch fails.
 */
async function fetchLogoBase64() {
  try {
    const res = await fetch("/Siyanda.png");
    if (!res.ok) return null;
    const ab = await res.arrayBuffer();
    const bytes = new Uint8Array(ab);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  } catch {
    return null;
  }
}

/**
 * Export Services Done grid to Excel with formatting:
 * - Row 1: "Services Done" merged A1:M1, Aptos 18, centred
 * - Row 2: height 57
 * - Row 3: "From  dd MMM yyyy  To  dd MMM yyyy" merged A3:M3
 * - Rows 4–7: Mine, Shaft, Section, Gang
 * - Row 8: "Equipment Types: " + comma-separated list, merged A8:ZZ8
 * - Rows 3–8: Aptos, size 14
 * - Tabular data starts on row 10; font Aptos 11; header bold + yellow; gridlines
 * @param {Array<Array>} rows - [headerRow, ...dataRows]
 * @param {string} [filename]
 * @param {string} [sheetName]
 * @param {{ fromDate?: string, toDate?: string, mine?: string, shaft?: string, section?: string, gang?: string, equipmentTypeLabels?: string[] }} [filterOptions]
 */
export async function exportServicesDoneToExcel(
  rows,
  filename = "services_done.xlsx",
  sheetName = "Services Done",
  filterOptions = {}
) {
  const aoa = Array.isArray(rows) ? rows : [[]];
  if (aoa.length === 0) return;
  const headerRow = aoa[0];
  const dataRows = aoa.slice(1);
  const colCount = Math.max(headerRow?.length || 1, 1);
  const mergeEndCol = Math.max(colCount, 13);
  const headerExcelRow = 10;
  const lastDataExcelRow = headerExcelRow + dataRows.length;

  const opts = filterOptions || {};
  const fromDateStr = formatDateDdMmmYyyy(opts.fromDate ?? "");
  const toDateStr = formatDateDdMmmYyyy(opts.toDate ?? "");
  const mineLabel = opts.mine ?? "";
  const shaftLabel = opts.shaft ?? "";
  const sectionLabel = opts.section ?? "";
  const gangLabel = opts.gang ?? "";
  const equipmentLabels = Array.isArray(opts.equipmentTypeLabels) ? opts.equipmentTypeLabels : [];
  const equipmentTypesText = equipmentLabels.join(", ");

  const wb = new ExcelJS.Workbook();
  let imageId = null;
  const base64 = await fetchLogoBase64();
  if (base64) {
    try {
      imageId = wb.addImage({ base64, extension: "png" });
    } catch {}
  }
  const ws = wb.addWorksheet(sheetName, { views: [{ rightToLeft: false }] });

  if (imageId != null) {
    ws.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 96, height: 96 },
    });
  }

  ws.getRow(1).getCell(1).value = "Services Done";
  ws.getRow(1).getCell(1).font = { name: "Aptos", size: 18 };
  ws.getRow(1).getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  ws.mergeCells(1, 1, 1, mergeEndCol);

  ws.getRow(2).height = 57;

  const infoFont = { name: "Aptos", size: 14 };
  ws.getRow(3).getCell(1).value = `From  ${fromDateStr}  To  ${toDateStr}`;
  ws.getRow(3).getCell(1).font = infoFont;
  ws.mergeCells(3, 1, 3, mergeEndCol);

  ws.getRow(4).getCell(1).value = `Mine: ${mineLabel}`;
  ws.getRow(4).getCell(1).font = infoFont;
  ws.mergeCells(4, 1, 4, mergeEndCol);

  ws.getRow(5).getCell(1).value = `Shaft: ${shaftLabel}`;
  ws.getRow(5).getCell(1).font = infoFont;
  ws.mergeCells(5, 1, 5, mergeEndCol);

  ws.getRow(6).getCell(1).value = `Section: ${sectionLabel}`;
  ws.getRow(6).getCell(1).font = infoFont;
  ws.mergeCells(6, 1, 6, mergeEndCol);

  ws.getRow(7).getCell(1).value = `Gang: ${gangLabel}`;
  ws.getRow(7).getCell(1).font = infoFont;
  ws.mergeCells(7, 1, 7, mergeEndCol);

  ws.getRow(8).getCell(1).value = `Equipment Types: ${equipmentTypesText}`;
  ws.getRow(8).getCell(1).font = infoFont;
  ws.mergeCells(8, 1, 8, 702);

  const cellStr = (val) => (val == null ? "" : String(val));
  const colWidths = [];
  for (let c = 0; c < colCount; c++) {
    let maxLen = cellStr(headerRow[c]).length;
    for (let r = 0; r < dataRows.length; r++) {
      const len = cellStr(dataRows[r]?.[c]).length;
      if (len > maxLen) maxLen = len;
    }
    colWidths.push(Math.min(50, Math.max(8, maxLen + 1)));
  }
  for (let c = 1; c <= colCount; c++) ws.getColumn(c).width = colWidths[c - 1];

  for (let r = 0; r < dataRows.length; r++) {
    const excelRow = ws.getRow(headerExcelRow + 1 + r);
    const arr = dataRows[r];
    for (let c = 0; c < colCount; c++) {
      excelRow.getCell(c + 1).value = arr?.[c] ?? "";
    }
  }

  for (let c = 1; c <= colCount; c++) {
    const headerCell = ws.getRow(headerExcelRow).getCell(c);
    headerCell.value = headerRow[c - 1] ?? "";
    headerCell.font = { name: "Aptos", size: 11, bold: true };
    headerCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
    headerCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  }

  for (let r = headerExcelRow + 1; r <= lastDataExcelRow; r++) {
    for (let c = 1; c <= colCount; c++) {
      const cell = ws.getCell(r, c);
      cell.font = { name: "Aptos", size: 11 };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export Job Count per Equipment Item grid to Excel with formatting:
 * - Row 1: "Job Count per Equipment Item" merged A1:H1, Aptos 18, centred
 * - Row 2: height 57; image top-left 96x96
 * - Row 3: "From  dd MMM yyyy  To  dd MMM yyyy" merged A3:H3, Aptos 14
 * - Tabular data starts on row 5; font Aptos 8; header bold + yellow; gridlines
 */
export async function exportJobCountPerEquipmentItemToExcel(
  rows,
  filename = "jobcount_per_equipment_item.xlsx",
  sheetName = "Job Count per Item",
  filterOptions = {}
) {
  const aoa = Array.isArray(rows) ? rows : [[]];
  if (aoa.length === 0) return;
  const headerRow = aoa[0];
  const dataRows = aoa.slice(1);
  const colCount = Math.max(headerRow?.length || 1, 1);
  const mergeEndCol = 8;
  const headerExcelRow = 5;
  const lastDataExcelRow = headerExcelRow + dataRows.length;

  const opts = filterOptions || {};
  const fromDateStr = formatDateDdMmmYyyy(opts.fromDate ?? "");
  const toDateStr = formatDateDdMmmYyyy(opts.toDate ?? "");

  const wb = new ExcelJS.Workbook();
  let imageId = null;
  const base64 = await fetchLogoBase64();
  if (base64) {
    try {
      imageId = wb.addImage({ base64, extension: "png" });
    } catch {}
  }
  const ws = wb.addWorksheet(sheetName, { views: [{ rightToLeft: false }] });

  if (imageId != null) {
    ws.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 96, height: 96 },
    });
  }

  ws.getRow(1).getCell(1).value = "Job Count per Equipment Item";
  ws.getRow(1).getCell(1).font = { name: "Aptos", size: 18 };
  ws.getRow(1).getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  ws.mergeCells(1, 1, 1, mergeEndCol);

  ws.getRow(2).height = 57;

  const infoFont = { name: "Aptos", size: 14 };
  ws.getRow(3).getCell(1).value = `From  ${fromDateStr}  To  ${toDateStr}`;
  ws.getRow(3).getCell(1).font = infoFont;
  ws.mergeCells(3, 1, 3, mergeEndCol);

  const cellStr = (val) => (val == null ? "" : String(val));
  const colWidths = [];
  for (let c = 0; c < colCount; c++) {
    let maxLen = cellStr(headerRow[c]).length;
    for (let r = 0; r < dataRows.length; r++) {
      const len = cellStr(dataRows[r]?.[c]).length;
      if (len > maxLen) maxLen = len;
    }
    colWidths.push(Math.min(50, Math.max(8, maxLen + 1)));
  }
  for (let c = 1; c <= colCount; c++) ws.getColumn(c).width = colWidths[c - 1];

  for (let c = 1; c <= colCount; c++) {
    const headerCell = ws.getRow(headerExcelRow).getCell(c);
    headerCell.value = headerRow[c - 1] ?? "";
    headerCell.font = { name: "Aptos", size: 8, bold: true };
    headerCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
    headerCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  }

  for (let r = 0; r < dataRows.length; r++) {
    const excelRow = ws.getRow(headerExcelRow + 1 + r);
    const arr = dataRows[r];
    for (let c = 0; c < colCount; c++) {
      excelRow.getCell(c + 1).value = arr?.[c] ?? "";
    }
  }

  for (let r = headerExcelRow + 1; r <= lastDataExcelRow; r++) {
    for (let c = 1; c <= colCount; c++) {
      const cell = ws.getCell(r, c);
      cell.font = { name: "Aptos", size: 8 };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export No Recent Jobs grid to Excel with formatting:
 * - Row 1: "No Recent Jobs" merged A1:H1, Aptos 18, centred
 * - Row 2: height 57; image top-left 96x96
 * - Row 3: "Report Date: " + current date (dd MMM yyyy)
 * - Row 4: "No Jobs Since " + daysSinceLastJob + " Days ago"
 * - Rows 5-8: Mine, Shaft, Section, Gang
 * - Row 9: "Equipment Types: " + comma-separated list, merge A9:ZZ9
 * - Rows 3-9: Aptos 14
 * - Tabular data starts on row 11; font Aptos 11; header bold + yellow; gridlines
 */
export async function exportNoRecentJobsToExcel(
  rows,
  filename = "no_recent_jobs.xlsx",
  sheetName = "No Recent Jobs",
  filterOptions = {}
) {
  const aoa = Array.isArray(rows) ? rows : [[]];
  if (aoa.length === 0) return;
  const headerRow = aoa[0];
  const dataRows = aoa.slice(1);
  const colCount = Math.max(headerRow?.length || 1, 1);
  const mergeEndCol = 8;
  const headerExcelRow = 11;
  const lastDataExcelRow = headerExcelRow + dataRows.length;

  const opts = filterOptions || {};
  const reportDateStr = formatDateDdMmmYyyy(new Date());
  const daysSinceLastJob = opts.daysSinceLastJob ?? "";
  const mineLabel = opts.mine ?? "";
  const shaftLabel = opts.shaft ?? "";
  const sectionLabel = opts.section ?? "";
  const gangLabel = opts.gang ?? "";
  const equipmentLabels = Array.isArray(opts.equipmentTypeLabels) ? opts.equipmentTypeLabels : [];
  const equipmentTypesText = equipmentLabels.join(", ");

  const wb = new ExcelJS.Workbook();
  let imageId = null;
  const base64 = await fetchLogoBase64();
  if (base64) {
    try {
      imageId = wb.addImage({ base64, extension: "png" });
    } catch {}
  }
  const ws = wb.addWorksheet(sheetName, { views: [{ rightToLeft: false }] });

  if (imageId != null) {
    ws.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 96, height: 96 },
    });
  }

  ws.getRow(1).getCell(1).value = "No Recent Jobs";
  ws.getRow(1).getCell(1).font = { name: "Aptos", size: 18 };
  ws.getRow(1).getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  ws.mergeCells(1, 1, 1, mergeEndCol);

  ws.getRow(2).height = 57;

  const infoFont = { name: "Aptos", size: 14 };
  ws.getRow(3).getCell(1).value = `Report Date: ${reportDateStr}`;
  ws.getRow(3).getCell(1).font = infoFont;
  ws.mergeCells(3, 1, 3, mergeEndCol);

  ws.getRow(4).getCell(1).value = `No Jobs Since ${daysSinceLastJob} Days ago`;
  ws.getRow(4).getCell(1).font = infoFont;
  ws.mergeCells(4, 1, 4, mergeEndCol);

  ws.getRow(5).getCell(1).value = `Mine: ${mineLabel}`;
  ws.getRow(5).getCell(1).font = infoFont;
  ws.mergeCells(5, 1, 5, mergeEndCol);

  ws.getRow(6).getCell(1).value = `Shaft: ${shaftLabel}`;
  ws.getRow(6).getCell(1).font = infoFont;
  ws.mergeCells(6, 1, 6, mergeEndCol);

  ws.getRow(7).getCell(1).value = `Section: ${sectionLabel}`;
  ws.getRow(7).getCell(1).font = infoFont;
  ws.mergeCells(7, 1, 7, mergeEndCol);

  ws.getRow(8).getCell(1).value = `Gang: ${gangLabel}`;
  ws.getRow(8).getCell(1).font = infoFont;
  ws.mergeCells(8, 1, 8, mergeEndCol);

  ws.getRow(9).getCell(1).value = `Equipment Types: ${equipmentTypesText}`;
  ws.getRow(9).getCell(1).font = infoFont;
  ws.mergeCells(9, 1, 9, 702);

  const cellStr = (val) => (val == null ? "" : String(val));
  const colWidths = [];
  for (let c = 0; c < colCount; c++) {
    let maxLen = cellStr(headerRow[c]).length;
    for (let r = 0; r < dataRows.length; r++) {
      const len = cellStr(dataRows[r]?.[c]).length;
      if (len > maxLen) maxLen = len;
    }
    colWidths.push(Math.min(50, Math.max(8, maxLen + 1)));
  }
  for (let c = 1; c <= colCount; c++) ws.getColumn(c).width = colWidths[c - 1];

  for (let c = 1; c <= colCount; c++) {
    const headerCell = ws.getRow(headerExcelRow).getCell(c);
    headerCell.value = headerRow[c - 1] ?? "";
    headerCell.font = { name: "Aptos", size: 11, bold: true };
    headerCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
    headerCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  }

  for (let r = 0; r < dataRows.length; r++) {
    const excelRow = ws.getRow(headerExcelRow + 1 + r);
    const arr = dataRows[r];
    for (let c = 0; c < colCount; c++) {
      excelRow.getCell(c + 1).value = arr?.[c] ?? "";
    }
  }

  for (let r = headerExcelRow + 1; r <= lastDataExcelRow; r++) {
    for (let c = 1; c <= colCount; c++) {
      const cell = ws.getCell(r, c);
      cell.font = { name: "Aptos", size: 11 };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export Individual Item History grid to Excel with formatting:
 * - Row 1: "Individual Item History" merged A1:H1, Aptos 18, centred
 * - Row 2: height 57; image top-left 96x96
 * - Row 3: "Equipment Type: " + label, merge A3:H3
 * - Row 4: "Serial No: " + serialNo, merge A4:H4
 * - Row 5: "From  dd MMM yyyy  To  dd MMM yyyy", merge A5:H5
 * - Rows 3-7: Aptos 14
 * - Tabular data starts on row 7; font Aptos 8; header bold + yellow; gridlines
 */
export async function exportIndivHistoryToExcel(
  rows,
  filename = "individual_item_history.xlsx",
  sheetName = "Individual Item History",
  filterOptions = {}
) {
  const aoa = Array.isArray(rows) ? rows : [[]];
  if (aoa.length === 0) return;
  const headerRow = aoa[0];
  const dataRows = aoa.slice(1);
  const colCount = Math.max(headerRow?.length || 1, 1);
  const mergeEndCol = 8;
  const headerExcelRow = 7;
  const lastDataExcelRow = headerExcelRow + dataRows.length;

  const opts = filterOptions || {};
  const equipmentTypeLabel = opts.equipmentType ?? "";
  const serialNo = opts.serialNo ?? "";
  const fromDateStr = formatDateDdMmmYyyy(opts.fromDate ?? "");
  const toDateStr = formatDateDdMmmYyyy(opts.toDate ?? "");

  const wb = new ExcelJS.Workbook();
  let imageId = null;
  const base64 = await fetchLogoBase64();
  if (base64) {
    try {
      imageId = wb.addImage({ base64, extension: "png" });
    } catch {}
  }
  const ws = wb.addWorksheet(sheetName, { views: [{ rightToLeft: false }] });

  if (imageId != null) {
    ws.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 96, height: 96 },
    });
  }

  ws.getRow(1).getCell(1).value = "Individual Item History";
  ws.getRow(1).getCell(1).font = { name: "Aptos", size: 18 };
  ws.getRow(1).getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  ws.mergeCells(1, 1, 1, mergeEndCol);

  ws.getRow(2).height = 57;

  const infoFont = { name: "Aptos", size: 14 };
  ws.getRow(3).getCell(1).value = `Equipment Type: ${equipmentTypeLabel}`;
  ws.getRow(3).getCell(1).font = infoFont;
  ws.mergeCells(3, 1, 3, mergeEndCol);

  ws.getRow(4).getCell(1).value = `Serial No: ${serialNo}`;
  ws.getRow(4).getCell(1).font = infoFont;
  ws.mergeCells(4, 1, 4, mergeEndCol);

  ws.getRow(5).getCell(1).value = `From  ${fromDateStr}  To  ${toDateStr}`;
  ws.getRow(5).getCell(1).font = infoFont;
  ws.mergeCells(5, 1, 5, mergeEndCol);

  const cellStr = (val) => (val == null ? "" : String(val));
  const colWidths = [];
  for (let c = 0; c < colCount; c++) {
    let maxLen = cellStr(headerRow[c]).length;
    for (let r = 0; r < dataRows.length; r++) {
      const len = cellStr(dataRows[r]?.[c]).length;
      if (len > maxLen) maxLen = len;
    }
    colWidths.push(Math.min(50, Math.max(8, maxLen + 1)));
  }
  for (let c = 1; c <= colCount; c++) ws.getColumn(c).width = colWidths[c - 1];

  for (let c = 1; c <= colCount; c++) {
    const headerCell = ws.getRow(headerExcelRow).getCell(c);
    headerCell.value = headerRow[c - 1] ?? "";
    headerCell.font = { name: "Aptos", size: 8, bold: true };
    headerCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
    headerCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  }

  for (let r = 0; r < dataRows.length; r++) {
    const excelRow = ws.getRow(headerExcelRow + 1 + r);
    const arr = dataRows[r];
    for (let c = 0; c < colCount; c++) {
      excelRow.getCell(c + 1).value = arr?.[c] ?? "";
    }
  }

  for (let r = headerExcelRow + 1; r <= lastDataExcelRow; r++) {
    for (let c = 1; c <= colCount; c++) {
      const cell = ws.getCell(r, c);
      cell.font = { name: "Aptos", size: 8 };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export Jobs per Technician grid to Excel with formatting:
 * - Row 1: "Jobs per Technician" merged A1:H1, Aptos 18, centred
 * - Row 2: height 57; image top-left 96x96
 * - Row 3: "From  dd MMM yyyy  To  dd MMM yyyy" merged A3:H3, Aptos 14
 * - Tabular data starts on row 5; font Aptos 8; header bold + yellow; gridlines
 */
export async function exportJobsPerTechnicianToExcel(
  rows,
  filename = "jobs_per_technician.xlsx",
  sheetName = "Jobs per Technician",
  filterOptions = {}
) {
  const aoa = Array.isArray(rows) ? rows : [[]];
  if (aoa.length === 0) return;
  const headerRow = aoa[0];
  const dataRows = aoa.slice(1);
  const colCount = Math.max(headerRow?.length || 1, 1);
  const mergeEndCol = 8;
  const headerExcelRow = 5;
  const lastDataExcelRow = headerExcelRow + dataRows.length;

  const opts = filterOptions || {};
  const fromDateStr = formatDateDdMmmYyyy(opts.fromDate ?? "");
  const toDateStr = formatDateDdMmmYyyy(opts.toDate ?? "");

  const wb = new ExcelJS.Workbook();
  let imageId = null;
  const base64 = await fetchLogoBase64();
  if (base64) {
    try {
      imageId = wb.addImage({ base64, extension: "png" });
    } catch {}
  }
  const ws = wb.addWorksheet(sheetName, { views: [{ rightToLeft: false }] });

  if (imageId != null) {
    ws.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 96, height: 96 },
    });
  }

  ws.getRow(1).getCell(1).value = "Jobs per Technician";
  ws.getRow(1).getCell(1).font = { name: "Aptos", size: 18 };
  ws.getRow(1).getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  ws.mergeCells(1, 1, 1, mergeEndCol);

  ws.getRow(2).height = 57;

  const infoFont = { name: "Aptos", size: 14 };
  ws.getRow(3).getCell(1).value = `From  ${fromDateStr}  To  ${toDateStr}`;
  ws.getRow(3).getCell(1).font = infoFont;
  ws.mergeCells(3, 1, 3, mergeEndCol);

  const cellStr = (val) => (val == null ? "" : String(val));
  const colWidths = [];
  for (let c = 0; c < colCount; c++) {
    let maxLen = cellStr(headerRow[c]).length;
    for (let r = 0; r < dataRows.length; r++) {
      const len = cellStr(dataRows[r]?.[c]).length;
      if (len > maxLen) maxLen = len;
    }
    colWidths.push(Math.min(50, Math.max(8, maxLen + 1)));
  }
  for (let c = 1; c <= colCount; c++) ws.getColumn(c).width = colWidths[c - 1];

  for (let c = 1; c <= colCount; c++) {
    const headerCell = ws.getRow(headerExcelRow).getCell(c);
    headerCell.value = headerRow[c - 1] ?? "";
    headerCell.font = { name: "Aptos", size: 8, bold: true };
    headerCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
    headerCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  }

  for (let r = 0; r < dataRows.length; r++) {
    const excelRow = ws.getRow(headerExcelRow + 1 + r);
    const arr = dataRows[r];
    for (let c = 0; c < colCount; c++) {
      excelRow.getCell(c + 1).value = arr?.[c] ?? "";
    }
  }

  for (let r = headerExcelRow + 1; r <= lastDataExcelRow; r++) {
    for (let c = 1; c <= colCount; c++) {
      const cell = ws.getCell(r, c);
      cell.font = { name: "Aptos", size: 8 };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export Equipment List grid to Excel with formatting:
 * - Row 1: "Services Done" merged A1:I1, Aptos 18, centred
 * - Row 2: height 57; image top-left 96x96
 * - Rows 3–7: Mine, Shaft, Section, Gang, Equipment Types (row 7 merge A7:ZZ7)
 * - Rows 3–7: Aptos, size 14
 * - Tabular data starts on row 9; font Aptos 11; header bold + yellow; gridlines
 */
export async function exportEquipmentListToExcel(
  rows,
  filename = "equipment_list.xlsx",
  sheetName = "Equipment List",
  filterOptions = {}
) {
  const aoa = Array.isArray(rows) ? rows : [[]];
  if (aoa.length === 0) return;
  const headerRow = aoa[0];
  const dataRows = aoa.slice(1);
  const colCount = Math.max(headerRow?.length || 1, 1);
  const mergeEndCol9 = 9;
  const headerExcelRow = 9;
  const lastDataExcelRow = headerExcelRow + dataRows.length;

  const opts = filterOptions || {};
  const mineLabel = opts.mine ?? "";
  const shaftLabel = opts.shaft ?? "";
  const sectionLabel = opts.section ?? "";
  const gangLabel = opts.gang ?? "";
  const equipmentLabels = Array.isArray(opts.equipmentTypeLabels) ? opts.equipmentTypeLabels : [];
  const equipmentTypesText = equipmentLabels.join(", ");

  const wb = new ExcelJS.Workbook();
  let imageId = null;
  const base64 = await fetchLogoBase64();
  if (base64) {
    try {
      imageId = wb.addImage({ base64, extension: "png" });
    } catch {}
  }
  const ws = wb.addWorksheet(sheetName, { views: [{ rightToLeft: false }] });

  if (imageId != null) {
    ws.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 96, height: 96 },
    });
  }

  ws.getRow(1).getCell(1).value = "Services Done";
  ws.getRow(1).getCell(1).font = { name: "Aptos", size: 18 };
  ws.getRow(1).getCell(1).alignment = { horizontal: "center", vertical: "middle" };
  ws.mergeCells(1, 1, 1, mergeEndCol9);

  ws.getRow(2).height = 57;

  const infoFont = { name: "Aptos", size: 14 };
  ws.getRow(3).getCell(1).value = `Mine: ${mineLabel}`;
  ws.getRow(3).getCell(1).font = infoFont;
  ws.mergeCells(3, 1, 3, mergeEndCol9);

  ws.getRow(4).getCell(1).value = `Shaft: ${shaftLabel}`;
  ws.getRow(4).getCell(1).font = infoFont;
  ws.mergeCells(4, 1, 4, mergeEndCol9);

  ws.getRow(5).getCell(1).value = `Section: ${sectionLabel}`;
  ws.getRow(5).getCell(1).font = infoFont;
  ws.mergeCells(5, 1, 5, mergeEndCol9);

  ws.getRow(6).getCell(1).value = `Gang: ${gangLabel}`;
  ws.getRow(6).getCell(1).font = infoFont;
  ws.mergeCells(6, 1, 6, mergeEndCol9);

  ws.getRow(7).getCell(1).value = `Equipment Types: ${equipmentTypesText}`;
  ws.getRow(7).getCell(1).font = infoFont;
  ws.mergeCells(7, 1, 7, 702);

  const cellStr = (val) => (val == null ? "" : String(val));
  const colWidths = [];
  for (let c = 0; c < colCount; c++) {
    let maxLen = cellStr(headerRow[c]).length;
    for (let r = 0; r < dataRows.length; r++) {
      const len = cellStr(dataRows[r]?.[c]).length;
      if (len > maxLen) maxLen = len;
    }
    colWidths.push(Math.min(50, Math.max(8, maxLen + 1)));
  }
  for (let c = 1; c <= colCount; c++) ws.getColumn(c).width = colWidths[c - 1];

  for (let c = 1; c <= colCount; c++) {
    const headerCell = ws.getRow(headerExcelRow).getCell(c);
    headerCell.value = headerRow[c - 1] ?? "";
    headerCell.font = { name: "Aptos", size: 11, bold: true };
    headerCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
    headerCell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  }

  for (let r = 0; r < dataRows.length; r++) {
    const excelRow = ws.getRow(headerExcelRow + 1 + r);
    const arr = dataRows[r];
    for (let c = 0; c < colCount; c++) {
      excelRow.getCell(c + 1).value = arr?.[c] ?? "";
    }
  }

  for (let r = headerExcelRow + 1; r <= lastDataExcelRow; r++) {
    for (let c = 1; c <= colCount; c++) {
      const cell = ws.getCell(r, c);
      cell.font = { name: "Aptos", size: 11 };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Export service list to Excel with Siyanda.png logo in the top-left corner (same layout as exportToExcelWithTitle).
 * Uses ExcelJS to support embedding the image.
 */
export async function exportServiceListToExcelWithImage(
  data,
  title,
  filename,
  sheetName,
  columnConfig,
  fromDate,
  toDate,
  filterLabels,
  equipmentTypeLabels
) {
  const rows = Array.isArray(data) ? data : [];
  const columns = columnConfig?.orderedKeys?.length > 0
    ? columnConfig.orderedKeys
    : rows.length > 0 ? Object.keys(rows[0]) : [];
  const headerRow = columnConfig?.headerLabels?.length ? columnConfig.headerLabels : columns;
  const colCount = Math.max(columns.length || 1, 1);
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
  const equipmentTypesLine = "Equipment types" + (eqTypes.length ? ", " + eqTypes.join(", ") : "");
  const aoa = useFromDate
    ? [
        [title],
        [],
        [dateLine],
        ["Mine:  " + (labels.mine ?? "")],
        ["Shaft:  " + (labels.shaft ?? "")],
        ["Section:  " + (labels.section ?? "")],
        ["Gang:  " + (labels.gang ?? "")],
        [equipmentTypesLine],
        [], // one blank above table so header is on row 10, data on row 11
        headerRow,
        ...dataRows,
      ]
    : [[title], headerRow, ...dataRows];
  const headerRowIndex = useFromDate ? 9 : 1; // header on Excel row 10, data from row 11
  const tableEndRow = headerRowIndex + dataRows.length;
  const cellStr = (val) => (val == null ? "" : String(val));
  const colWidths = [];
  for (let c = 0; c < colCount; c++) {
    let maxLen = cellStr(headerRow[c]).length;
    if (c === 0) maxLen = Math.max(maxLen, cellStr(title).length);
    for (let r = 0; r < dataRows.length; r++) {
      const len = cellStr(dataRows[r][c]).length;
      if (len > maxLen) maxLen = len;
    }
    colWidths.push(Math.min(50, Math.max(8, maxLen + 1)));
  }

  const wb = new ExcelJS.Workbook();
  let imageId = null;
  const base64 = await fetchLogoBase64();
  if (base64) {
    try {
      imageId = wb.addImage({ base64, extension: "png" });
    } catch {}
  }
  const ws = wb.addWorksheet(sheetName, { views: [{ rightToLeft: false }] });

  for (let c = 1; c <= colCount; c++) ws.getColumn(c).width = colWidths[c - 1];

  ws.getRow(2).height = 57;

  for (let r = 0; r < aoa.length; r++) {
    const row = ws.getRow(r + 1);
    const arr = aoa[r];
    for (let c = 0; c < (arr?.length ?? 0); c++) {
      const cell = row.getCell(c + 1);
      cell.value = arr[c];
    }
  }

  ws.mergeCells(1, 1, 1, Math.max(colCount, 8));
  const a1 = ws.getCell(1, 1);
  a1.font = { name: "Aptos", size: 18 };
  a1.alignment = { horizontal: "center", vertical: "middle" };
  if (useFromDate) {
    ws.mergeCells(3, 1, 3, 7);
    ws.mergeCells(4, 1, 4, 7);
    ws.mergeCells(5, 1, 5, 7);
    ws.mergeCells(6, 1, 6, 7);
    ws.mergeCells(7, 1, 7, 7);
    ws.mergeCells(8, 1, 8, 100);
    for (let r = 2; r <= 8; r++) {
      const cell = ws.getCell(r, 1);
      cell.font = { name: "Aptos", size: 14 };
    }
  }
  const headerExcelRow = headerRowIndex + 1; // 1-based Excel row (header on row 10)
  for (let c = 1; c <= colCount; c++) {
    const cell = ws.getCell(headerExcelRow, c);
    cell.font = { name: "Aptos", size: 11, bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFF00" } };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  }
  const lastDataExcelRow = headerExcelRow + dataRows.length;
  for (let r = headerExcelRow + 1; r <= lastDataExcelRow; r++) {
    for (let c = 1; c <= colCount; c++) {
      const cell = ws.getCell(r, c);
      if (r <= lastDataExcelRow) cell.font = { name: "Aptos", size: 11 };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    }
  }

  if (imageId != null) {
    ws.addImage(imageId, {
      tl: { col: 0, row: 0 },
      ext: { width: 96, height: 96 },
    });
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "Service List.xlsx";
  a.click();
  URL.revokeObjectURL(url);
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
