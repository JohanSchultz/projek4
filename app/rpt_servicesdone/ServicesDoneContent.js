"use client";

import { useState, useTransition } from "react";
import { DateRangeEquipmentTypeFilter } from "@/components/DateRangeEquipmentTypeFilter";
import { exportServicesDoneToExcel } from "@/lib/export-utils";

const gridRowClass =
  "border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50";
const gridThClass =
  "border-b border-zinc-200 bg-zinc-100 px-4 py-3 font-semibold text-left text-[0.625rem] text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
const gridTdClass = "px-4 py-3 text-[0.625rem] text-zinc-800 dark:text-zinc-200";

const gridColumnHeaders = {
  serialno: "Serial No",
  jobno: "Job No",
  stockcode: "Stock Code",
  unitcost: "Unit Cost",
  isdamaged: "Abuse",
  cost: "Total",
};

function getGridColumnHeader(key) {
  const normalized = key.toLowerCase().replace(/_/g, "");
  return gridColumnHeaders[normalized] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const sortGroupKeys = (a, b) => {
  if (a === "__null") return 1;
  if (b === "__null") return -1;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
};

function findMineKey(orderedKeys) {
  const normalized = orderedKeys.map((k) => [k.toLowerCase().replace(/_/g, ""), k]);
  const match = normalized.find(([n]) => n === "mine");
  return match ? match[1] : orderedKeys.find((k) => /mine/.test(k.toLowerCase())) ?? null;
}

function findShaftKey(orderedKeys) {
  const normalized = orderedKeys.map((k) => [k.toLowerCase().replace(/_/g, ""), k]);
  const match = normalized.find(([n]) => n === "shaft");
  return match ? match[1] : orderedKeys.find((k) => /shaft/.test(k.toLowerCase())) ?? null;
}

function findSectionKey(orderedKeys) {
  const normalized = orderedKeys.map((k) => [k.toLowerCase().replace(/_/g, ""), k]);
  const match = normalized.find(([n]) => n === "section");
  return match ? match[1] : orderedKeys.find((k) => /section/.test(k.toLowerCase())) ?? null;
}

function findTypeKey(orderedKeys) {
  const normalized = orderedKeys.map((k) => [k.toLowerCase().replace(/_/g, ""), k]);
  const match = normalized.find(([n]) => n === "type" || n === "equipmenttype");
  return match ? match[1] : orderedKeys.find((k) => k.toLowerCase().replace(/_/g, "") === "type") ?? null;
}

function findSerialNoKey(orderedKeys) {
  const normalized = orderedKeys.map((k) => [k.toLowerCase().replace(/_/g, ""), k]);
  const match = normalized.find(([n]) => n === "serialno" || n === "serialnumber");
  return match ? match[1] : orderedKeys.find((k) => /serial/.test(k.toLowerCase())) ?? null;
}

function findJobNoKey(orderedKeys) {
  const normalized = orderedKeys.map((k) => [k.toLowerCase().replace(/_/g, ""), k]);
  const match = normalized.find(([n]) => n === "jobno" || n === "jobnumber");
  return match ? match[1] : orderedKeys.find((k) => /job/.test(k.toLowerCase())) ?? null;
}

function findTotalKey(orderedKeys) {
  const normalized = orderedKeys.map((k) => [k.toLowerCase().replace(/_/g, ""), k]);
  const match = normalized.find(([n]) => n === "cost" || n === "total");
  return match ? match[1] : orderedKeys.find((k) => /total|cost/.test(k.toLowerCase().replace(/_/g, ""))) ?? null;
}

function findPartKey(orderedKeys) {
  const normalized = orderedKeys.map((k) => [k.toLowerCase().replace(/_/g, ""), k]);
  const match = normalized.find(([n]) => n === "part");
  return match ? match[1] : orderedKeys.find((k) => /^part$/.test(k.toLowerCase().replace(/_/g, ""))) ?? null;
}

function numericTotal(row, totalKey) {
  if (!totalKey || row[totalKey] == null) return 0;
  const n = Number(row[totalKey]);
  return Number.isNaN(n) ? 0 : n;
}

/** Group by Mine → Shaft → Section → Type; don't repeat values; add type, section, shaft, and mine subtotal rows with Total sum. */
function rowsWithMineShaftSectionGrouping(rows, orderedKeys) {
  const mineKey = findMineKey(orderedKeys);
  const shaftKey = findShaftKey(orderedKeys);
  const sectionKey = findSectionKey(orderedKeys);
  const typeKey = findTypeKey(orderedKeys);
  const totalKey = findTotalKey(orderedKeys);
  const serialKey = findSerialNoKey(orderedKeys);
  const jobNoKey = findJobNoKey(orderedKeys);
  if (!mineKey || rows.length === 0) {
    return rows.map((r, i) => ({ ...r, __index: i, __showMine: true, __showShaft: true, __showSection: true, __showType: true, __showSerial: true, __showJobNoInSerial: true, __groupKeys: [] }));
  }
  const LEVEL_NAMES = ["mine", "shaft", "section", "type", "serial", "job"];
  const LEVEL_DEPTH = { mine: 1, shaft: 2, section: 3, type: 4, serial: 5, job_in_serial: 6 };
  function buildGroupKey(levelIndex, path) {
    const parts = LEVEL_NAMES.slice(0, levelIndex + 1).map((n) => path[n] ?? "__null");
    return `${LEVEL_NAMES[levelIndex]}:${parts.join(":")}`;
  }
  function buildGroupKeys(path, depth) {
    return Array.from({ length: depth }, (_, i) => buildGroupKey(i, path));
  }
  const byMine = new Map();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const mineVal = row[mineKey] != null ? row[mineKey] : "__null";
    const k = String(mineVal);
    if (!byMine.has(k)) byMine.set(k, []);
    byMine.get(k).push({ ...row, __index: i });
  }
  const result = [];
  const mineKeysSorted = Array.from(byMine.keys()).sort(sortGroupKeys);
  for (const mineKeyVal of mineKeysSorted) {
    const mineRows = byMine.get(mineKeyVal);
    if (!shaftKey) {
      const path = { mine: mineKeyVal, shaft: null, section: null, type: null, serial: null, job: null };
      const depth = 1;
      let firstMine = true;
      for (const row of mineRows) {
        result.push({ ...row, __showMine: firstMine, __showShaft: true, __showSection: true, __showType: true, __showSerial: true, __path: path, __groupKeys: buildGroupKeys(path, depth) });
        firstMine = false;
      }
      result.push({
        __subtotal: true,
        level: "mine",
        mineValue: mineKeyVal === "__null" ? null : mineKeyVal,
        shaftValue: null,
        sectionValue: null,
        typeValue: null,
        serialValue: null,
        totalSum: totalKey ? mineRows.reduce((acc, r) => acc + numericTotal(r, totalKey), 0) : 0,
        count: mineRows.length,
        mineKey,
        shaftKey: null,
        sectionKey: null,
        typeKey: null,
        serialKey: null,
        totalKey,
        __path: path,
        __groupKeys: buildGroupKeys(path, depth),
      });
      continue;
    }
    const byShaft = new Map();
    for (const row of mineRows) {
      const shaftVal = row[shaftKey] != null ? row[shaftKey] : "__null";
      const k = String(shaftVal);
      if (!byShaft.has(k)) byShaft.set(k, []);
      byShaft.get(k).push(row);
    }
    const shaftKeysSorted = Array.from(byShaft.keys()).sort(sortGroupKeys);
    for (const shaftKeyVal of shaftKeysSorted) {
      const shaftRows = byShaft.get(shaftKeyVal);
      if (!sectionKey) {
        const path = { mine: mineKeyVal, shaft: shaftKeyVal, section: null, type: null, serial: null, job: null };
        const depth = 2;
        let firstMine = true;
        let firstShaft = true;
        for (const row of shaftRows) {
          result.push({ ...row, __showMine: firstMine, __showShaft: firstShaft, __showSection: true, __showType: true, __showSerial: true, __path: path, __groupKeys: buildGroupKeys(path, depth) });
          firstShaft = false;
          firstMine = false;
        }
        result.push({
          __subtotal: true,
          level: "shaft",
          mineValue: mineKeyVal === "__null" ? null : mineKeyVal,
          shaftValue: shaftKeyVal === "__null" ? null : shaftKeyVal,
          sectionValue: null,
          typeValue: null,
          serialValue: null,
          totalSum: totalKey ? shaftRows.reduce((acc, r) => acc + numericTotal(r, totalKey), 0) : 0,
          count: shaftRows.length,
          mineKey,
          shaftKey,
          sectionKey: null,
          typeKey: null,
          serialKey: null,
          totalKey,
          __path: path,
          __groupKeys: buildGroupKeys(path, depth),
        });
        continue;
      }
      const bySection = new Map();
      for (const row of shaftRows) {
        const sectionVal = row[sectionKey] != null ? row[sectionKey] : "__null";
        const k = String(sectionVal);
        if (!bySection.has(k)) bySection.set(k, []);
        bySection.get(k).push(row);
      }
      const sectionKeysSorted = Array.from(bySection.keys()).sort(sortGroupKeys);
      let firstMine = true;
      let firstShaft = true;
      for (const sectionKeyVal of sectionKeysSorted) {
        const sectionRows = bySection.get(sectionKeyVal);
        if (!typeKey) {
          const path = { mine: mineKeyVal, shaft: shaftKeyVal, section: sectionKeyVal, type: null, serial: null, job: null };
          const depth = 3;
          let firstSection = true;
          for (const row of sectionRows) {
            result.push({ ...row, __showMine: firstMine, __showShaft: firstShaft, __showSection: firstSection, __showType: true, __showSerial: true, __path: path, __groupKeys: buildGroupKeys(path, depth) });
            firstSection = false;
            firstShaft = false;
            firstMine = false;
          }
          result.push({
            __subtotal: true,
            level: "section",
            mineValue: mineKeyVal === "__null" ? null : mineKeyVal,
            shaftValue: shaftKeyVal === "__null" ? null : shaftKeyVal,
            sectionValue: sectionKeyVal === "__null" ? null : sectionKeyVal,
            typeValue: null,
            serialValue: null,
            totalSum: totalKey ? sectionRows.reduce((acc, r) => acc + numericTotal(r, totalKey), 0) : 0,
            count: sectionRows.length,
            mineKey,
            shaftKey,
            sectionKey,
            typeKey: null,
            serialKey: null,
            totalKey,
            __path: path,
            __groupKeys: buildGroupKeys(path, depth),
          });
          continue;
        }
        const byType = new Map();
        for (const row of sectionRows) {
          const typeVal = row[typeKey] != null ? row[typeKey] : "__null";
          const k = String(typeVal);
          if (!byType.has(k)) byType.set(k, []);
          byType.get(k).push(row);
        }
        const typeKeysSorted = Array.from(byType.keys()).sort(sortGroupKeys);
        for (const typeKeyVal of typeKeysSorted) {
          const typeRows = byType.get(typeKeyVal);
          if (!serialKey) {
            const path = { mine: mineKeyVal, shaft: shaftKeyVal, section: sectionKeyVal, type: typeKeyVal, serial: null, job: null };
            const depth = 4;
            let firstSection = true;
            let firstType = true;
            for (const row of typeRows) {
              result.push({ ...row, __showMine: firstMine, __showShaft: firstShaft, __showSection: firstSection, __showType: firstType, __showSerial: true, __path: path, __groupKeys: buildGroupKeys(path, depth) });
              firstType = false;
              firstSection = false;
              firstShaft = false;
              firstMine = false;
            }
            result.push({
              __subtotal: true,
              level: "type",
              mineValue: mineKeyVal === "__null" ? null : mineKeyVal,
              shaftValue: shaftKeyVal === "__null" ? null : shaftKeyVal,
              sectionValue: sectionKeyVal === "__null" ? null : sectionKeyVal,
              typeValue: typeKeyVal === "__null" ? null : typeKeyVal,
              serialValue: null,
              totalSum: totalKey ? typeRows.reduce((acc, r) => acc + numericTotal(r, totalKey), 0) : 0,
              count: typeRows.length,
              mineKey,
              shaftKey,
              sectionKey,
              typeKey,
              serialKey: null,
              totalKey,
              __path: path,
              __groupKeys: buildGroupKeys(path, depth),
            });
            continue;
          }
          const bySerial = new Map();
          for (const row of typeRows) {
            const serialVal = row[serialKey] != null ? row[serialKey] : "__null";
            const k = String(serialVal);
            if (!bySerial.has(k)) bySerial.set(k, []);
            bySerial.get(k).push(row);
          }
          const serialKeysSorted = Array.from(bySerial.keys()).sort(sortGroupKeys);
          for (const serialKeyVal of serialKeysSorted) {
            const serialRows = bySerial.get(serialKeyVal);
            if (!jobNoKey) {
              const path = { mine: mineKeyVal, shaft: shaftKeyVal, section: sectionKeyVal, type: typeKeyVal, serial: serialKeyVal, job: null };
              const depth = 5;
              let firstSection = true;
              let firstType = true;
              let firstSerial = true;
              for (const row of serialRows) {
                result.push({ ...row, __showMine: firstMine, __showShaft: firstShaft, __showSection: firstSection, __showType: firstType, __showSerial: firstSerial, __path: path, __groupKeys: buildGroupKeys(path, depth) });
                firstSerial = false;
                firstType = false;
                firstSection = false;
                firstShaft = false;
                firstMine = false;
              }
              result.push({
                __subtotal: true,
                level: "serial",
                mineValue: mineKeyVal === "__null" ? null : mineKeyVal,
                shaftValue: shaftKeyVal === "__null" ? null : shaftKeyVal,
                sectionValue: sectionKeyVal === "__null" ? null : sectionKeyVal,
                typeValue: typeKeyVal === "__null" ? null : typeKeyVal,
                serialValue: serialKeyVal === "__null" ? null : serialKeyVal,
                jobNoValue: null,
                totalSum: totalKey ? serialRows.reduce((acc, r) => acc + numericTotal(r, totalKey), 0) : 0,
                count: serialRows.length,
                mineKey,
                shaftKey,
                sectionKey,
                typeKey,
                serialKey,
                jobNoKey: null,
                totalKey,
                __path: path,
                __groupKeys: buildGroupKeys(path, depth),
              });
              continue;
            }
            const byJobNoInSerial = new Map();
            for (const row of serialRows) {
              const jobVal = row[jobNoKey] != null ? row[jobNoKey] : "__null";
              const k = String(jobVal);
              if (!byJobNoInSerial.has(k)) byJobNoInSerial.set(k, []);
              byJobNoInSerial.get(k).push(row);
            }
            const jobNoInSerialKeysSorted = Array.from(byJobNoInSerial.keys()).sort(sortGroupKeys);
            const pathSerial = { mine: mineKeyVal, shaft: shaftKeyVal, section: sectionKeyVal, type: typeKeyVal, serial: serialKeyVal, job: null };
            for (const jobNoKeyVal of jobNoInSerialKeysSorted) {
              const jobNoRows = byJobNoInSerial.get(jobNoKeyVal);
              let firstSection = true;
              let firstType = true;
              let firstSerial = true;
              let firstJobNoInSerial = true;
              for (const row of jobNoRows) {
                const pathJob = { ...pathSerial, job: row[jobNoKey] != null ? row[jobNoKey] : "__null" };
                const depthJob = 6;
                result.push({ ...row, __showMine: firstMine, __showShaft: firstShaft, __showSection: firstSection, __showType: firstType, __showSerial: firstSerial, __showJobNoInSerial: firstJobNoInSerial, __path: pathJob, __groupKeys: buildGroupKeys(pathJob, depthJob) });
                firstJobNoInSerial = false;
                firstSerial = false;
                firstType = false;
                firstSection = false;
                firstShaft = false;
                firstMine = false;
              }
              const pathJob = { ...pathSerial, job: jobNoKeyVal };
              const depthJob = 6;
              result.push({
                __subtotal: true,
                level: "job_in_serial",
                mineValue: mineKeyVal === "__null" ? null : mineKeyVal,
                shaftValue: shaftKeyVal === "__null" ? null : shaftKeyVal,
                sectionValue: sectionKeyVal === "__null" ? null : sectionKeyVal,
                typeValue: typeKeyVal === "__null" ? null : typeKeyVal,
                serialValue: serialKeyVal === "__null" ? null : serialKeyVal,
                jobNoValue: jobNoKeyVal === "__null" ? null : jobNoKeyVal,
                totalSum: totalKey ? jobNoRows.reduce((acc, r) => acc + numericTotal(r, totalKey), 0) : 0,
                count: jobNoRows.length,
                mineKey,
                shaftKey,
                sectionKey,
                typeKey,
                serialKey,
                jobNoKey,
                totalKey,
                __path: pathJob,
                __groupKeys: buildGroupKeys(pathJob, depthJob),
              });
            }
            const depthSerial = 5;
            result.push({
              __subtotal: true,
              level: "serial",
              mineValue: mineKeyVal === "__null" ? null : mineKeyVal,
              shaftValue: shaftKeyVal === "__null" ? null : shaftKeyVal,
              sectionValue: sectionKeyVal === "__null" ? null : sectionKeyVal,
              typeValue: typeKeyVal === "__null" ? null : typeKeyVal,
              serialValue: serialKeyVal === "__null" ? null : serialKeyVal,
              jobNoValue: null,
              totalSum: totalKey ? serialRows.reduce((acc, r) => acc + numericTotal(r, totalKey), 0) : 0,
              count: serialRows.length,
              mineKey,
              shaftKey,
              sectionKey,
              typeKey,
              serialKey,
              jobNoKey: null,
              totalKey,
              __path: pathSerial,
              __groupKeys: buildGroupKeys(pathSerial, depthSerial),
            });
          }
          const pathType = { mine: mineKeyVal, shaft: shaftKeyVal, section: sectionKeyVal, type: typeKeyVal, serial: null, job: null };
          const depthType = 4;
          result.push({
            __subtotal: true,
            level: "type",
            mineValue: mineKeyVal === "__null" ? null : mineKeyVal,
            shaftValue: shaftKeyVal === "__null" ? null : shaftKeyVal,
            sectionValue: sectionKeyVal === "__null" ? null : sectionKeyVal,
            typeValue: typeKeyVal === "__null" ? null : typeKeyVal,
            serialValue: null,
            totalSum: totalKey ? typeRows.reduce((acc, r) => acc + numericTotal(r, totalKey), 0) : 0,
            count: typeRows.length,
            mineKey,
            shaftKey,
            sectionKey,
            typeKey,
            serialKey: null,
            totalKey,
            __path: pathType,
            __groupKeys: buildGroupKeys(pathType, depthType),
          });
        }
        const pathSection = { mine: mineKeyVal, shaft: shaftKeyVal, section: sectionKeyVal, type: null, serial: null, job: null };
        const depthSection = 3;
        result.push({
          __subtotal: true,
          level: "section",
          mineValue: mineKeyVal === "__null" ? null : mineKeyVal,
          shaftValue: shaftKeyVal === "__null" ? null : shaftKeyVal,
          sectionValue: sectionKeyVal === "__null" ? null : sectionKeyVal,
          typeValue: null,
          serialValue: null,
          totalSum: totalKey ? sectionRows.reduce((acc, r) => acc + numericTotal(r, totalKey), 0) : 0,
          count: sectionRows.length,
          mineKey,
          shaftKey,
          sectionKey,
          typeKey: null,
          serialKey: null,
          totalKey,
          __path: pathSection,
          __groupKeys: buildGroupKeys(pathSection, depthSection),
        });
      }
      const pathShaft = { mine: mineKeyVal, shaft: shaftKeyVal, section: null, type: null, serial: null, job: null };
      const depthShaft = 2;
      result.push({
        __subtotal: true,
        level: "shaft",
        mineValue: mineKeyVal === "__null" ? null : mineKeyVal,
        shaftValue: shaftKeyVal === "__null" ? null : shaftKeyVal,
        sectionValue: null,
        typeValue: null,
        serialValue: null,
        totalSum: totalKey ? shaftRows.reduce((acc, r) => acc + numericTotal(r, totalKey), 0) : 0,
        count: shaftRows.length,
        mineKey,
        shaftKey,
        sectionKey: null,
        typeKey: null,
        serialKey: null,
        totalKey,
        __path: pathShaft,
        __groupKeys: buildGroupKeys(pathShaft, depthShaft),
      });
    }
    const pathMine = { mine: mineKeyVal, shaft: null, section: null, type: null, serial: null, job: null };
    const depthMine = 1;
    result.push({
      __subtotal: true,
      level: "mine",
      mineValue: mineKeyVal === "__null" ? null : mineKeyVal,
      shaftValue: null,
      sectionValue: null,
      typeValue: null,
      serialValue: null,
      totalSum: totalKey ? mineRows.reduce((acc, r) => acc + numericTotal(r, totalKey), 0) : 0,
      count: mineRows.length,
      mineKey,
      shaftKey: null,
      sectionKey: null,
      typeKey: null,
      serialKey: null,
      totalKey,
      __path: pathMine,
      __groupKeys: buildGroupKeys(pathMine, depthMine),
    });
  }
  return result;
}

/** Format numeric Total column as ### ### ##0.00 (space-separated thousands, 2 decimals). */
function formatTotalValue(value) {
  if (value == null || value === "") return "0.00";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  const fixed = n.toFixed(2);
  const [intPart, decPart] = fixed.split(".");
  const withSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return decPart != null ? `${withSpaces}.${decPart}` : withSpaces;
}

function formatGridValue(value) {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (
    value instanceof Date ||
    (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value))
  ) {
    try {
      return new Date(value).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return String(value);
    }
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function ServicesDoneContent({
  equipmentTypes,
  mines,
  fetchShaftsByMineId,
  fetchSectionsByShaftId,
  fetchGangsBySectionId,
  fetchJobsWithParts,
}) {
  const [gridData, setGridData] = useState([]);
  const [reportError, setReportError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [lastFilterForExport, setLastFilterForExport] = useState(null);

  const handleExportToExcel = () => {
    if (!gridData.length) return;
    const orderedKeys = Object.keys(gridData[0]);
    const totalKey = findTotalKey(orderedKeys);
    const headers = orderedKeys.map((k) => getGridColumnHeader(k));
    const rows = [headers, ...gridData.map((row) =>
      orderedKeys.map((key) =>
        key === totalKey ? formatTotalValue(row[key]) : formatGridValue(row[key])
      )
    )];
    const filterOpts = lastFilterForExport
      ? {
          fromDate: lastFilterForExport.fromDate,
          toDate: lastFilterForExport.toDate,
          mine: lastFilterForExport.mineLabel ?? "",
          shaft: lastFilterForExport.shaftLabel ?? "",
          section: lastFilterForExport.sectionLabel ?? "",
          gang: lastFilterForExport.gangLabel ?? "",
          equipmentTypeLabels: lastFilterForExport.equipmentTypeLabels ?? [],
        }
      : {};
    exportServicesDoneToExcel(rows, "services_done.xlsx", "Services Done", filterOpts);
  };

  const handleShowReport = (params) => {
    setReportError(null);
    if (typeof fetchJobsWithParts !== "function") return;
    startTransition(async () => {
      const result = await fetchJobsWithParts(
        params.selectedMineId ?? 0,
        params.selectedShaftId ?? 0,
        params.selectedSectionId ?? 0,
        params.selectedGangId ?? 0,
        params.selectedIds ?? [],
        params.fromDate || null,
        params.toDate || null
      );
      if (result?.error) {
        setReportError(result.error);
        setGridData([]);
      } else {
        setGridData(Array.isArray(result?.data) ? result.data : []);
        setLastFilterForExport(params);
      }
    });
  };

  return (
    <>
      <div className="mb-6">
        <DateRangeEquipmentTypeFilter
          equipmentTypes={equipmentTypes ?? []}
          mines={mines ?? []}
          fetchShaftsByMineId={fetchShaftsByMineId}
          fetchSectionsByShaftId={fetchSectionsByShaftId}
          fetchGangsBySectionId={fetchGangsBySectionId}
          onShowReport={handleShowReport}
        />
      </div>
      <hr className="my-4 border-zinc-200 dark:border-zinc-700" />
      <div className="w-full overflow-auto">
        {isPending && (
          <p className="py-4 text-sm text-zinc-500 dark:text-zinc-400">
            Loading report…
          </p>
        )}
        {!isPending && reportError && (
          <p className="py-4 text-sm text-amber-600 dark:text-amber-400">
            {reportError}
          </p>
        )}
        {!isPending && !reportError && gridData.length === 0 && (
          <p className="py-4 text-sm text-zinc-500 dark:text-zinc-400">
            No data. Use the filter above and click &quot;Show Report&quot; to load results.
          </p>
        )}
        {!isPending && !reportError && gridData.length > 0 && (() => {
          const orderedKeys = Object.keys(gridData[0]);
          const rowsToRender = gridData;
          const totalKey = findTotalKey(orderedKeys);
          const partKey = findPartKey(orderedKeys);
          const getThClass = (key) =>
            gridThClass +
            (key === totalKey ? " text-right" : "") +
            (key === partKey ? " max-w-0 truncate" : "");
          const getTdClass = (key) =>
            gridTdClass +
            (key === totalKey ? " text-right tabular-nums" : "") +
            (key === partKey ? " max-w-0 truncate" : "");
          return (
            <>
              <div className="mb-3">
                <button
                  type="button"
                  onClick={handleExportToExcel}
                  className="rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:bg-green-700 dark:hover:bg-green-600"
                >
                  Export to Excel
                </button>
              </div>
              <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
              <table className="w-full min-w-[32rem] table-fixed text-left text-xs">
                <thead>
                  <tr>
                    {orderedKeys.map((key) => (
                      <th key={key} className={getThClass(key)}>
                        {getGridColumnHeader(key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowsToRender.map((row, index) => {
                    return (
                      <tr key={row.id ?? row.__index ?? index} className={gridRowClass}>
                        {orderedKeys.map((key) => (
                          <td key={key} className={getTdClass(key)}>
                            {key === totalKey
                              ? formatTotalValue(row[key])
                              : formatGridValue(row[key])}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
          );
        })()}
      </div>
    </>
  );
}
