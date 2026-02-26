"use client";

import { useState, useTransition, useMemo } from "react";
import { DateRangeEquipmentTypeFilter } from "@/components/DateRangeEquipmentTypeFilter";
import { VirtualGrid } from "@/components/VirtualGrid";
import { exportEquipmentAbuseToExcel } from "@/lib/export-utils";

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

const EQUIPMENT_ABUSE_COLUMNS = [
  { id: "mine", header: "Mine", accessorKey: "mine" },
  { id: "shaft", header: "Shaft", accessorKey: "shaft" },
  { id: "section", header: "Section", accessorKey: "section" },
  { id: "gang", header: "Gang", accessorKey: "gang" },
  { id: "type", header: "Type", accessorKey: "type" },
  { id: "serialno", header: "Serial No", accessorKey: "serialno" },
  { id: "jobno", header: "Job No", accessorKey: "jobno" },
  {
    id: "datein",
    header: "Date In",
    accessorKey: "datein",
    accessorFn: (r) => formatDateDdMmmYyyy(r?.datein),
  },
  { id: "technician", header: "Technician", accessorKey: "technician" },
  { id: "stockcode", header: "Stock Code", accessorKey: "stockcode" },
  { id: "part", header: "Part", accessorKey: "part" },
  {
    id: "qty",
    header: "Qty",
    accessorKey: "qty",
    numeric: true,
    accessorFn: (r) => formatNumInt(r?.qty),
  },
  {
    id: "unitcost",
    header: "Unit Cost",
    accessorKey: "unitcost",
    numeric: true,
    accessorFn: (r) => formatNum(r?.unitcost),
  },
  {
    id: "total",
    header: "Total",
    accessorKey: "total",
    numeric: true,
    accessorFn: (r) => formatNum(r?.total),
  },
];

function normalizeRows(data) {
  return (Array.isArray(data) ? data : []).map((row, i) => ({
    ...row,
    id: row.id ?? i,
  }));
}

export function EquipmentAbuseContent({
  equipmentTypes,
  mines,
  fetchShaftsByMineId,
  fetchSectionsByShaftId,
  fetchGangsBySectionId,
  fetchRptWillfulDamage,
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

  const totalSum = useMemo(
    () => (gridData ?? []).reduce((sum, row) => sum + (Number(row?.total) || 0), 0),
    [gridData]
  );

  const handleShowReport = () => {
    if (typeof fetchRptWillfulDamage !== "function") return;
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
      const result = await fetchRptWillfulDamage(
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
              await exportEquipmentAbuseToExcel(
                gridData,
                "equipment_abuse.xlsx",
                "Equipment Abuse",
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
            columns={EQUIPMENT_ABUSE_COLUMNS}
            data={gridData}
            height={500}
            className="w-full"
            tableClassName="text-xs"
          />
          <div className="mt-2 flex w-full justify-end">
            <input
              type="text"
              readOnly
              value={formatNum(totalSum)}
              className="min-w-[10rem] rounded border border-zinc-300 bg-white px-3 py-2 text-right text-sm text-zinc-800 tabular-nums dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
              aria-label="Total"
            />
          </div>
        </div>
      )}
    </>
  );
}
