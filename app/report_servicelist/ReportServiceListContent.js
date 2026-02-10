"use client";

import { useState, useTransition } from "react";
import { DateRangeEquipmentTypeFilter } from "@/components/DateRangeEquipmentTypeFilter";
import { ServiceListGrid } from "./ServiceListGrid";

export function ReportServiceListContent({
  equipmentTypes,
  mines,
  fetchShaftsByMineId,
  fetchSectionsByShaftId,
  fetchGangsBySectionId,
  fetchServiceListData,
}) {
  const [gridData, setGridData] = useState(null);
  const [reportError, setReportError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleShowReport = (params) => {
    setReportError(null);
    startTransition(async () => {
      const result = await fetchServiceListData(
        params.selectedIds ?? [],
        params.selectedMineId ?? 0,
        params.selectedShaftId ?? 0,
        params.selectedSectionId ?? 0,
        params.fromDate || null,
        params.toDate || null
      );
      if (result?.error) {
        setReportError(result.error);
        setGridData(null);
      } else {
        setGridData(Array.isArray(result?.data) ? result.data : []);
      }
    });
  };

  return (
    <>
      <div className="mb-6">
        <DateRangeEquipmentTypeFilter
          equipmentTypes={equipmentTypes}
          mines={mines}
          fetchShaftsByMineId={fetchShaftsByMineId}
          fetchSectionsByShaftId={fetchSectionsByShaftId}
          fetchGangsBySectionId={fetchGangsBySectionId}
          onShowReport={handleShowReport}
        />
      </div>
      {isPending && (
        <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
          Loading report…
        </p>
      )}
      {reportError && (
        <p className="mb-2 text-sm text-amber-600 dark:text-amber-400">
          {reportError}
        </p>
      )}
      {!isPending && gridData && gridData.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No data.
        </p>
      )}
      {!isPending && gridData && gridData.length > 0 && (
        <ServiceListGrid data={gridData} />
      )}
    </>
  );
}
