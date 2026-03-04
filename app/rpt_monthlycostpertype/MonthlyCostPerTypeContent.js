"use client";

import { useState, useTransition, useMemo } from "react";
import { DateRangeEquipmentTypeFilter } from "@/components/DateRangeEquipmentTypeFilter";
import { VirtualGrid } from "@/components/VirtualGrid";
import { exportMonthlyCostPerTypeToExcel } from "@/lib/export-utils";

function formatNum(value) {
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

function formatNumInt(value) {
  if (value == null || value === "") return "";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  const intVal = Math.round(n);
  const intPart = String(intVal);
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

const MONTHLY_COST_PER_TYPE_COLUMNS = [
  { id: "equipmentcategory", header: "Equipment Category", accessorKey: "equipmentcategory" },
  { id: "equipmenttype", header: "Equipment Type", accessorKey: "equipmenttype" },
  {
    id: "numberofjobs",
    header: "Number of Jobs",
    accessorKey: "numberofjobs",
    numeric: true,
    accessorFn: (r) => formatNumInt(r?.numberofjobs),
  },
  {
    id: "totalcost",
    header: "Total Cost",
    accessorKey: "totalcost",
    numeric: true,
    accessorFn: (r) => formatNum(r?.totalcost),
  },
  {
    id: "avgcostperitem",
    header: "Avg Cost Per Item",
    accessorKey: "avgcostperitem",
    numeric: true,
    accessorFn: (r) => formatNum(r?.avgcostperitem),
  },
  {
    id: "avgcostperitempermonth",
    header: "Avg Cost Per Item Per Month",
    accessorKey: "avgcostperitempermonth",
    numeric: true,
    accessorFn: (r) => formatNum(r?.avgcostperitempermonth),
  },
];

function normalizeRows(data) {
  return (Array.isArray(data) ? data : []).map((row, i) => ({
    ...row,
    id: row.id ?? i,
  }));
}

export function MonthlyCostPerTypeContent({
  equipmentTypes,
  mines,
  fetchShaftsByMineId,
  fetchSectionsByShaftId,
  fetchGangsBySectionId,
  fetchRptMonthlyCostPerType,
}) {
  const [filterParams, setFilterParams] = useState({
    fromDate: "",
    toDate: "",
    selectedMineId: 0,
    selectedShaftId: 0,
    selectedSectionId: 0,
    selectedGangId: 0,
    selectedIds: [],
  });
  const [gridData, setGridData] = useState([]);
  const [reportError, setReportError] = useState(null);
  const [reportFilterOptions, setReportFilterOptions] = useState({});
  const [hasFetched, setHasFetched] = useState(false);
  const [isPending, startTransition] = useTransition();

  const grandTotal = useMemo(
    () => (gridData ?? []).reduce((sum, row) => sum + (Number(row?.totalcost) || 0), 0),
    [gridData]
  );

  const handleShowReport = () => {
    if (typeof fetchRptMonthlyCostPerType !== "function") return;
    setReportError(null);
    setReportFilterOptions({
      fromDate: filterParams.fromDate ?? null,
      toDate: filterParams.toDate ?? null,
      mine: filterParams.mineLabel ?? "",
      shaft: filterParams.shaftLabel ?? "",
      section: filterParams.sectionLabel ?? "",
      gang: filterParams.gangLabel ?? "",
      equipmentTypeLabels: Array.isArray(filterParams.equipmentTypeLabels) ? filterParams.equipmentTypeLabels : [],
    });
    const ids = Array.isArray(filterParams.selectedIds)
      ? filterParams.selectedIds
      : [];
    startTransition(async () => {
      const result = await fetchRptMonthlyCostPerType(
        filterParams.selectedMineId ?? 0,
        filterParams.selectedShaftId ?? 0,
        filterParams.selectedSectionId ?? 0,
        filterParams.selectedGangId ?? 0,
        ids,
        filterParams.fromDate || null,
        filterParams.toDate || null
      );
      setHasFetched(true);
      if (result?.error) {
        setReportError(result.error);
        setGridData([]);
      } else {
        setGridData(normalizeRows(result?.data ?? []));
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
          onChange={setFilterParams}
        />
      </div>
      <div className="mb-4 flex w-full justify-end">
        <button
          type="button"
          onClick={handleShowReport}
          disabled={isPending}
          className="rounded border border-sky-300 bg-sky-200 px-4 py-2 text-sm font-medium text-sky-900 shadow-sm hover:bg-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-70 dark:border-sky-600 dark:bg-sky-700 dark:text-sky-100 dark:hover:bg-sky-600"
        >
          Show Report
        </button>
      </div>
      <hr className="my-4 border-zinc-200 dark:border-zinc-700" />
      {gridData.length > 0 && (
        <div className="mb-4 flex w-full justify-start">
          <button
            type="button"
            onClick={async () => {
              await exportMonthlyCostPerTypeToExcel(
                gridData,
                "monthly_cost_per_type.xlsx",
                "Monthly Cost Per Equipment Type",
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
      {!isPending && !reportError && hasFetched && gridData.length === 0 && (
        <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
          No data.
        </p>
      )}
      {!isPending && !reportError && gridData.length > 0 && (
        <div className="w-full">
          <VirtualGrid
            columns={MONTHLY_COST_PER_TYPE_COLUMNS}
            data={gridData}
            height={500}
            className="w-full"
          />
          <div className="mt-2 grid w-full grid-cols-6 gap-0 border border-zinc-200 bg-white px-0 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Grand Total
            </div>
            <div className="col-span-2" />
            <div className="flex items-center justify-end px-4 py-2">
              <input
                type="text"
                id="grand-total-monthly-cost"
                readOnly
                value={formatNum(grandTotal)}
                className="w-full min-w-0 max-w-[12rem] rounded border border-zinc-300 bg-white px-3 py-2 text-right text-sm text-zinc-800 tabular-nums dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                aria-label="Grand Total"
              />
            </div>
            <div className="col-span-2" />
          </div>
        </div>
      )}
    </>
  );
}
