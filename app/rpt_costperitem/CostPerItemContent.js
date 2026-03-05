"use client";

import { useState, useTransition } from "react";
import { DateRangeEquipmentTypeFilter } from "@/components/DateRangeEquipmentTypeFilter";
import { VirtualGrid } from "@/components/VirtualGrid";
import { exportCostPerItemToExcel } from "@/lib/export-utils";

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

const COST_PER_ITEM_COLUMNS = [
  { id: "type", header: "Type", accessorKey: "type" },
  { id: "serialno", header: "Serial No", accessorKey: "serialno" },
  { id: "pistonno", header: "Piston No", accessorKey: "pistonno" },
  { id: "mine", header: "Mine", accessorKey: "mine" },
  { id: "shaft", header: "Shaft", accessorKey: "shaft" },
  { id: "section", header: "Section", accessorKey: "section" },
  { id: "gang", header: "Gang", accessorKey: "gang" },
  {
    id: "cost",
    header: "Cost",
    accessorKey: "cost",
    numeric: true,
    accessorFn: (r) => formatNum(r?.cost),
  },
  {
    id: "monthlycost",
    header: "Monthly Cost",
    accessorKey: "monthlycost",
    numeric: true,
    accessorFn: (r) => formatNum(r?.monthlycost),
  },
];

function normalizeRows(data) {
  return (Array.isArray(data) ? data : []).map((row, i) => ({
    ...row,
    id: row.id ?? i,
  }));
}

export function CostPerItemContent({
  equipmentTypes,
  mines,
  fetchShaftsByMineId,
  fetchSectionsByShaftId,
  fetchGangsBySectionId,
  fetchRptCostPerItem,
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

  const handleShowReport = () => {
    if (typeof fetchRptCostPerItem !== "function") return;
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
      const result = await fetchRptCostPerItem(
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
              await exportCostPerItemToExcel(
                gridData,
                "cost_per_item.xlsx",
                "Cost Per Equipment Item",
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
            columns={COST_PER_ITEM_COLUMNS}
            data={gridData}
            height={500}
            className="w-full"
          />
        </div>
      )}
    </>
  );
}
