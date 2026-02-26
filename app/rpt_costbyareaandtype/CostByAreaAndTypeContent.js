"use client";

import { useState, useTransition, useMemo } from "react";
import { DateRangeEquipmentTypeFilter } from "@/components/DateRangeEquipmentTypeFilter";
import { VirtualGrid } from "@/components/VirtualGrid";
import { exportCostByAreaAndTypeToExcel } from "@/lib/export-utils";

const COST_COL = "cost";

function formatCost(value) {
  if (value == null || value === "") return "";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  const fixed = n.toFixed(2);
  const parts = fixed.split(".");
  const intPart = parts[0] ?? "0";
  const decPart = parts[1] ?? "00";
  const withSpaces = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${withSpaces}.${decPart}`;
}

function groupDataByMineShaftAndSection(rawData) {
  if (!Array.isArray(rawData) || rawData.length === 0) return [];
  const sorted = [...rawData].sort((a, b) => {
    const ma = a.mine ?? "";
    const mb = b.mine ?? "";
    if (ma !== mb) return String(ma).localeCompare(String(mb));
    const sa = a.shaft ?? "";
    const sb = b.shaft ?? "";
    if (sa !== sb) return String(sa).localeCompare(String(sb));
    const secA = a.section ?? "";
    const secB = b.section ?? "";
    return String(secA).localeCompare(String(secB));
  });
  const out = [];
  let prevMine = null;
  let prevShaft = null;
  let prevSection = null;
  let sectionCost = 0;
  let shaftCost = 0;
  for (let i = 0; i < sorted.length; i++) {
    const row = sorted[i];
    const mineVal = row.mine ?? "";
    const shaftVal = row.shaft ?? "";
    const sectionVal = row.section ?? "";
    const showMine = prevMine !== mineVal;
    const showShaft = showMine || prevShaft !== shaftVal;
    const showSection = showShaft || prevSection !== sectionVal;
    if (showSection && prevSection !== null) {
      out.push({
        id: out.length,
        mine: "",
        shaft: "",
        section: "Subtotal",
        gang: "",
        equipmenttype: "",
        cost: sectionCost,
        isSubtotal: true,
      });
      sectionCost = 0;
    }
    if (showShaft && prevShaft !== null) {
      out.push({
        id: out.length,
        mine: "",
        shaft: "Subtotal",
        section: "",
        gang: "",
        equipmenttype: "",
        cost: shaftCost,
        isSubtotal: true,
      });
      shaftCost = 0;
    }
    if (showMine) prevMine = mineVal;
    if (showShaft) prevShaft = shaftVal;
    if (showSection) prevSection = sectionVal;
    const cost = Number(row[COST_COL]) || 0;
    sectionCost += cost;
    shaftCost += cost;
    out.push({
      id: out.length,
      mine: showMine ? mineVal : "",
      shaft: showShaft ? shaftVal : "",
      section: showSection ? sectionVal : "",
      gang: row.gang ?? "",
      equipmenttype: row.equipmenttype ?? "",
      cost,
      isSubtotal: false,
    });
  }
  if (prevSection !== null) {
    out.push({
      id: out.length,
      mine: "",
      shaft: "",
      section: "Subtotal",
      gang: "",
      equipmenttype: "",
      cost: sectionCost,
      isSubtotal: true,
    });
  }
  if (prevShaft !== null) {
    out.push({
      id: out.length,
      mine: "",
      shaft: "Subtotal",
      section: "",
      gang: "",
      equipmenttype: "",
      cost: shaftCost,
      isSubtotal: true,
    });
  }
  return out;
}

const COST_BY_AREA_COLUMNS = [
  { id: "mine", header: "Mine", accessorKey: "mine" },
  { id: "shaft", header: "Shaft", accessorKey: "shaft" },
  { id: "section", header: "Section", accessorKey: "section" },
  { id: "gang", header: "Gang", accessorKey: "gang" },
  { id: "equipmenttype", header: "Equipment Type", accessorKey: "equipmenttype" },
  { id: "cost", header: "Cost", accessorKey: "cost", numeric: true, accessorFn: (r) => formatCost(r?.cost) },
];

export function CostByAreaAndTypeContent({
  equipmentTypes,
  mines,
  fetchShaftsByMineId,
  fetchSectionsByShaftId,
  fetchGangsBySectionId,
  fetchRptCostByAreaAndType,
}) {
  const [gridData, setGridData] = useState([]);
  const [reportError, setReportError] = useState(null);
  const [reportFilterOptions, setReportFilterOptions] = useState({});
  const [isPending, startTransition] = useTransition();

  const handleShowReport = (params) => {
    if (typeof fetchRptCostByAreaAndType !== "function") return;
    setReportError(null);
    setReportFilterOptions({
      fromDate: params.fromDate ?? null,
      toDate: params.toDate ?? null,
      mine: params.mineLabel ?? "",
      shaft: params.shaftLabel ?? "",
      section: params.sectionLabel ?? "",
      gang: params.gangLabel ?? "",
      equipmentTypeLabels: Array.isArray(params.equipmentTypeLabels) ? params.equipmentTypeLabels : [],
    });
    startTransition(async () => {
      const result = await fetchRptCostByAreaAndType(
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
        const data = Array.isArray(result?.data) ? result.data : [];
        setGridData(data);
      }
    });
  };

  const groupedRows = useMemo(
    () => groupDataByMineShaftAndSection(gridData),
    [gridData]
  );

  const grandTotal = useMemo(
    () => (gridData ?? []).reduce((sum, row) => sum + (Number(row?.[COST_COL]) || 0), 0),
    [gridData]
  );

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
          showReportNextToSelectAll={true}
        />
      </div>
      <hr className="my-4 border-zinc-200 dark:border-zinc-700" />
      {groupedRows.length > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={async () => {
              await exportCostByAreaAndTypeToExcel(
                groupedRows,
                "cost_by_area_and_type.xlsx",
                "Cost by Area and Type",
                reportFilterOptions
              );
            }}
            className="rounded border border-green-300 bg-green-200 px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:border-green-600 dark:bg-green-700 dark:text-zinc-100 dark:hover:bg-green-600"
          >
            Export to Excel
          </button>
        </div>
      )}
      {isPending && (
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          Loading…
        </p>
      )}
      {!isPending && reportError && (
        <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">
          {reportError}
        </p>
      )}
      {!isPending && !reportError && groupedRows.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No data. Use the filter above and click &quot;Show Report&quot; to load results.
        </p>
      )}
      {!isPending && !reportError && groupedRows.length > 0 && (
        <div className="w-full">
          <VirtualGrid
            columns={COST_BY_AREA_COLUMNS}
            data={groupedRows}
            height={500}
            className="w-full"
          />
          <div className="mt-2 flex w-full justify-end">
            <label htmlFor="grand-total" className="mr-2 self-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Grand Total
            </label>
            <input
              type="text"
              id="grand-total"
              readOnly
              value={formatCost(grandTotal)}
              className="min-w-[10rem] rounded border border-zinc-300 bg-white px-3 py-2 text-right text-sm text-zinc-800 tabular-nums dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
              aria-label="Grand Total"
            />
          </div>
        </div>
      )}
    </>
  );
}
