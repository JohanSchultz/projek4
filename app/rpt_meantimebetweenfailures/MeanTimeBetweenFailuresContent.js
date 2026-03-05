"use client";

import { useState, useTransition } from "react";
import { DateRangeEquipmentTypeFilter } from "@/components/DateRangeEquipmentTypeFilter";
import { VirtualGrid } from "@/components/VirtualGrid";
import { exportMeanTimeBetweenFailuresToExcel } from "@/lib/export-utils";

function formatNumInt(value) {
  if (value == null || value === "") return "";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  const intVal = Math.round(n);
  const intPart = String(intVal);
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

const MEAN_TIME_COLUMNS = [
  { id: "type", header: "Type", accessorKey: "type" },
  { id: "serialno", header: "Serial No", accessorKey: "serialno" },
  { id: "mine", header: "Mine", accessorKey: "mine" },
  { id: "shaft", header: "Shaft", accessorKey: "shaft" },
  { id: "section", header: "Section", accessorKey: "section" },
  { id: "gang", header: "Gang", accessorKey: "gang" },
  {
    id: "days",
    header: "Days",
    accessorKey: "days",
    numeric: true,
    accessorFn: (r) => formatNumInt(r?.days),
  },
  {
    id: "failures",
    header: "Failures",
    accessorKey: "failures",
    numeric: true,
    accessorFn: (r) => formatNumInt(r?.failures),
  },
  {
    id: "meandaysbetweenfailures",
    header: "Mean Days Between Failures",
    accessorKey: "meandaysbetweenfailures",
    numeric: true,
    accessorFn: (r) => formatNumInt(r?.meandaysbetweenfailures),
  },
];

function normalizeRows(data) {
  return (Array.isArray(data) ? data : []).map((row, i) => ({
    ...row,
    id: row.id ?? i,
  }));
}

export function MeanTimeBetweenFailuresContent({
  equipmentTypes,
  mines,
  fetchShaftsByMineId,
  fetchSectionsByShaftId,
  fetchGangsBySectionId,
  fetchRptMeanTimeBetweenFailures,
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
    if (typeof fetchRptMeanTimeBetweenFailures !== "function") return;
    setReportError(null);
    setReportFilterOptions({
      fromDate: filterParams.fromDate ?? null,
      toDate: filterParams.toDate ?? null,
      mine: filterParams.mineLabel ?? "",
      shaft: filterParams.shaftLabel ?? "",
      section: filterParams.sectionLabel ?? "",
      gang: filterParams.gangLabel ?? "",
      equipmentTypeLabels: Array.isArray(filterParams.equipmentTypeLabels)
        ? filterParams.equipmentTypeLabels
        : [],
    });
    const {
      selectedMineId,
      selectedShaftId,
      selectedSectionId,
      selectedGangId,
      selectedIds,
      fromDate,
      toDate,
    } = filterParams;
    startTransition(async () => {
      const result = await fetchRptMeanTimeBetweenFailures(
        selectedMineId ?? 0,
        selectedShaftId ?? 0,
        selectedSectionId ?? 0,
        selectedGangId ?? 0,
        selectedIds ?? [],
        fromDate || null,
        toDate || null
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
              await exportMeanTimeBetweenFailuresToExcel(
                gridData,
                "mean_time_between_failures.xlsx",
                "Mean Time Between Failures",
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
            columns={MEAN_TIME_COLUMNS}
            data={gridData}
            height={500}
            className="w-full"
          />
        </div>
      )}
    </>
  );
}
