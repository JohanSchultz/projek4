"use client";

import { useState, useTransition, useEffect } from "react";
import { DateRangeEquipmentTypeFilter } from "@/components/DateRangeEquipmentTypeFilter";
import {
  exportServiceListToExcelWithImage,
  exportToPdfTable,
  getServiceListColumnConfig,
} from "@/lib/export-utils";
import { ServiceListGrid } from "./ServiceListGrid";
import { MinsPerTypeGrid } from "./MinsPerTypeGrid";

export function ReportServiceListContent({
  equipmentTypes,
  mines,
  fetchShaftsByMineId,
  fetchSectionsByShaftId,
  fetchGangsBySectionId,
  fetchServiceListData,
  getMinsPerType,
}) {
  const [gridData, setGridData] = useState(null);
  const [minsPerTypeData, setMinsPerTypeData] = useState(null);
  const [minsPerTypeError, setMinsPerTypeError] = useState(null);
  const [reportFromDate, setReportFromDate] = useState(null);
  const [reportToDate, setReportToDate] = useState(null);
  const [reportFilterLabels, setReportFilterLabels] = useState(null);
  const [reportEquipmentTypeLabels, setReportEquipmentTypeLabels] = useState([]);
  const [reportError, setReportError] = useState(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof getMinsPerType !== "function") return;
    let cancelled = false;
    getMinsPerType().then((result) => {
      if (cancelled) return;
      if (result?.error) {
        setMinsPerTypeError(result.error);
        setMinsPerTypeData(null);
      } else {
        setMinsPerTypeError(null);
        setMinsPerTypeData(Array.isArray(result?.data) ? result.data : []);
      }
    });
    return () => { cancelled = true; };
  }, [getMinsPerType]);

  const handleShowReport = (params) => {
    setReportError(null);
    setReportFromDate(params.fromDate ?? null);
    setReportToDate(params.toDate ?? null);
    setReportFilterLabels({
      mine: params.mineLabel ?? "",
      shaft: params.shaftLabel ?? "",
      section: params.sectionLabel ?? "",
      gang: params.gangLabel ?? "",
    });
    setReportEquipmentTypeLabels(Array.isArray(params.equipmentTypeLabels) ? params.equipmentTypeLabels : []);
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
        <h2 className="mb-3 text-base font-semibold text-zinc-800 dark:text-zinc-200">
          Minutes per type
        </h2>
        {minsPerTypeError && (
          <p className="mb-2 text-sm text-amber-600 dark:text-amber-400">
            {minsPerTypeError}
          </p>
        )}
        {minsPerTypeData && (
          <div className="mb-6">
            <MinsPerTypeGrid data={minsPerTypeData} />
          </div>
        )}
      </div>
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
        <div className="invisible absolute h-0 w-0 overflow-hidden">
          <hr className="mb-4 border-zinc-300 dark:border-zinc-600" />
          <div className="mb-2 flex justify-between">
            <button
              type="button"
              onClick={async () => {
                await exportServiceListToExcelWithImage(
                  gridData,
                  "Service List",
                  "servicelist.xlsx",
                  "Service list",
                  gridData?.length > 0 ? getServiceListColumnConfig(gridData[0]) : undefined,
                  reportFromDate,
                  reportToDate,
                  reportFilterLabels ?? undefined,
                  reportEquipmentTypeLabels
                );
              }}
              className="rounded border border-green-300 bg-green-100 px-4 py-2 text-sm font-medium text-green-800 shadow-sm hover:bg-green-200 dark:border-green-600 dark:bg-green-900/30 dark:text-green-200 dark:hover:bg-green-800/40"
            >
              Export to Excel
            </button>
            <button
              type="button"
              onClick={() => exportToPdfTable(gridData, "servicelist.pdf", "Service List")}
              className="rounded border border-red-300 bg-red-100 px-4 py-2 text-sm font-medium text-red-800 shadow-sm hover:bg-red-200 dark:border-red-600 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-800/40"
            >
              Export to PDF
            </button>
          </div>
          <ServiceListGrid
            data={gridData}
            columnConfig={
              gridData?.length > 0 ? getServiceListColumnConfig(gridData[0]) : undefined
            }
          />
        </div>
      )}
    </>
  );
}
