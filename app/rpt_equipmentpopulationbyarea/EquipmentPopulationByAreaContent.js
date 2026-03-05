"use client";

import { useState, useTransition } from "react";
import { DateRangeEquipmentTypeFilter } from "@/components/DateRangeEquipmentTypeFilter";
import { VirtualGrid } from "@/components/VirtualGrid";
import { exportEquipmentPopulationByAreaToExcel } from "@/lib/export-utils";

function formatNumInt(value) {
  if (value == null || value === "") return "";
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  const intVal = Math.round(n);
  const intPart = String(intVal);
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

const EQUIPMENT_POPULATION_COLUMNS = [
  { id: "category", header: "Category", accessorKey: "category" },
  { id: "type", header: "Type", accessorKey: "type" },
  {
    id: "count",
    header: "Count",
    accessorKey: "count",
    numeric: true,
    accessorFn: (r) => formatNumInt(r?.count),
  },
];

function normalizeRows(data) {
  return (Array.isArray(data) ? data : []).map((row, i) => ({
    ...row,
    id: row.id ?? i,
  }));
}

export function EquipmentPopulationByAreaContent({
  equipmentTypes,
  mines,
  fetchShaftsByMineId,
  fetchSectionsByShaftId,
  fetchGangsBySectionId,
  fetchRptEquipmentPopulationByArea,
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
    if (typeof fetchRptEquipmentPopulationByArea !== "function") return;
    setReportError(null);
    setReportFilterOptions({
      mine: filterParams.mineLabel ?? "",
      shaft: filterParams.shaftLabel ?? "",
      section: filterParams.sectionLabel ?? "",
      gang: filterParams.gangLabel ?? "",
      equipmentTypeLabels: Array.isArray(filterParams.equipmentTypeLabels)
        ? filterParams.equipmentTypeLabels
        : [],
    });
    const { selectedMineId, selectedShaftId, selectedSectionId, selectedGangId, selectedIds } =
      filterParams;
    startTransition(async () => {
      const result = await fetchRptEquipmentPopulationByArea(
        selectedMineId,
        selectedShaftId,
        selectedSectionId,
        selectedGangId,
        selectedIds ?? []
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
          hideDateRange={true}
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
              await exportEquipmentPopulationByAreaToExcel(
                gridData,
                "equipment_population_by_area.xlsx",
                "Equipment Population By Area",
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
            columns={EQUIPMENT_POPULATION_COLUMNS}
            data={gridData}
            height={500}
            className="w-full"
          />
        </div>
      )}
    </>
  );
}
