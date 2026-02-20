"use client";

import { useState, useTransition } from "react";
import { DateRangeEquipmentTypeFilter } from "@/components/DateRangeEquipmentTypeFilter";
import { VirtualGrid } from "@/components/VirtualGrid";
import { exportNoRecentJobsToExcel, formatDateDdMmmYyyy } from "@/lib/export-utils";

const NO_RECENT_JOBS_COLUMNS = [
  { id: "type", header: "Type", accessorKey: "type" },
  { id: "serialno", header: "Serial No", accessorKey: "serialno", accessorFn: (r) => r?.serialno ?? r?.serial_no ?? "" },
  { id: "datein", header: "Date In", accessorKey: "datein", accessorFn: (r) => formatDateDdMmmYyyy(r?.datein ?? r?.date_in ?? "") },
  { id: "daysago", header: "Days Ago", accessorKey: "daysago", numeric: true, accessorFn: (r) => r?.daysago ?? r?.days_ago ?? "" },
];

export function NoRecentJobsContent({
  equipmentTypes,
  mines,
  fetchShaftsByMineId,
  fetchSectionsByShaftId,
  fetchGangsBySectionId,
  fetchNoRecentJobs,
}) {
  const [gridData, setGridData] = useState([]);
  const [reportError, setReportError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [lastFilterForExport, setLastFilterForExport] = useState(null);

  const handleShowReport = (params) => {
    if (typeof fetchNoRecentJobs !== "function") return;
    setReportError(null);
    startTransition(async () => {
      const result = await fetchNoRecentJobs(
        params.selectedMineId ?? 0,
        params.selectedShaftId ?? 0,
        params.selectedSectionId ?? 0,
        params.selectedGangId ?? 0,
        params.selectedIds ?? [],
        params.daysSinceLastJob ?? 180
      );
      if (result?.error) {
        setReportError(result.error);
        setGridData([]);
        setLastFilterForExport(null);
      } else {
        const data = Array.isArray(result?.data) ? result.data : [];
        setGridData(data.map((row, index) => ({ ...row, id: row.id ?? index })));
        setLastFilterForExport(params);
      }
    });
  };

  const handleExportToExcel = () => {
    const params = lastFilterForExport ?? {};
    const headerRow = NO_RECENT_JOBS_COLUMNS.map((col) => col.header);
    const getVal = (row, col) => {
      const fn = col.accessorFn ?? ((r) => r?.[col.accessorKey] ?? "");
      return fn(row);
    };
    const dataRows = gridData.map((row) =>
      NO_RECENT_JOBS_COLUMNS.map((col) => getVal(row, col))
    );
    const rows = [headerRow, ...dataRows];
    exportNoRecentJobsToExcel(rows, "no_recent_jobs.xlsx", "No Recent Jobs", {
      daysSinceLastJob: params.daysSinceLastJob ?? "",
      mine: params.mineLabel ?? "",
      shaft: params.shaftLabel ?? "",
      section: params.sectionLabel ?? "",
      gang: params.gangLabel ?? "",
      equipmentTypeLabels: params.equipmentTypeLabels ?? [],
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
          hideDateRange={true}
          showDaysSinceLastJobInput={true}
          onShowReport={handleShowReport}
        />
      </div>
      <hr className="my-4 border-zinc-200 dark:border-zinc-700" />
      {!isPending && !reportError && gridData.length > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={handleExportToExcel}
            className="rounded bg-green-200 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-green-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:bg-green-700 dark:text-zinc-100 dark:hover:bg-green-600"
          >
            Export to Excel
          </button>
        </div>
      )}
      <div className="w-full">
        {isPending && (
          <p className="py-4 text-sm text-zinc-500 dark:text-zinc-400">
            Loading…
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
        {!isPending && !reportError && gridData.length > 0 && (
          <VirtualGrid
            columns={NO_RECENT_JOBS_COLUMNS}
            data={gridData}
            height={500}
            className="w-full"
          />
        )}
      </div>
    </>
  );
}
