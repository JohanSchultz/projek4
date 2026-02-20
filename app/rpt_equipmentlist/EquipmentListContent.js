"use client";

import { useState, useTransition } from "react";
import { DateRangeEquipmentTypeFilter } from "@/components/DateRangeEquipmentTypeFilter";
import { VirtualGrid } from "@/components/VirtualGrid";
import { exportEquipmentListToExcel } from "@/lib/export-utils";

const EQUIPMENT_LIST_COLUMNS = [
  { id: "equipmentcategory", header: "Equipment Category", accessorKey: "equipmentcategory", accessorFn: (r) => r?.equipmentcategory ?? r?.equipment_category },
  { id: "equipmenttype", header: "Equipment Type", accessorKey: "equipmenttype", accessorFn: (r) => r?.equipmenttype ?? r?.equipment_type },
  { id: "serialno", header: "Serial No", accessorKey: "serialno", accessorFn: (r) => r?.serialno ?? r?.serial_no },
  { id: "pistonno", header: "Piston No", accessorKey: "pistonno", numeric: true, accessorFn: (r) => r?.pistonno ?? r?.piston_no },
  { id: "mine", header: "Mine", accessorKey: "mine" },
  { id: "shaft", header: "Shaft", accessorKey: "shaft" },
  { id: "section", header: "Section", accessorKey: "section" },
  { id: "gang", header: "Gang", accessorKey: "gang" },
  { id: "isactive", header: "Active", accessorKey: "isactive", accessorFn: (r) => r?.isactive ?? r?.is_active },
];

export function EquipmentListContent({
  equipmentTypes,
  mines,
  fetchShaftsByMineId,
  fetchSectionsByShaftId,
  fetchGangsBySectionId,
  fetchAllEquipmentItems,
}) {
  const [gridData, setGridData] = useState([]);
  const [reportError, setReportError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [lastFilterForExport, setLastFilterForExport] = useState(null);

  const formatCellValue = (value) => {
    if (value == null) return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
  };

  const handleExportToExcel = () => {
    if (!gridData.length) return;
    const headers = EQUIPMENT_LIST_COLUMNS.map((col) => col.header);
    const dataRows = gridData.map((row) =>
      EQUIPMENT_LIST_COLUMNS.map((col) => {
        const val = col.accessorFn ? col.accessorFn(row) : row[col.accessorKey ?? col.id];
        return formatCellValue(val);
      })
    );
    const rows = [headers, ...dataRows];
    const filterOpts = lastFilterForExport
      ? {
          mine: lastFilterForExport.mineLabel ?? "",
          shaft: lastFilterForExport.shaftLabel ?? "",
          section: lastFilterForExport.sectionLabel ?? "",
          gang: lastFilterForExport.gangLabel ?? "",
          equipmentTypeLabels: lastFilterForExport.equipmentTypeLabels ?? [],
        }
      : {};
    exportEquipmentListToExcel(rows, "equipment_list.xlsx", "Equipment List", filterOpts);
  };

  const handleShowReport = (params) => {
    if (typeof fetchAllEquipmentItems !== "function") return;
    setReportError(null);
    startTransition(async () => {
      const result = await fetchAllEquipmentItems(
        params.selectedMineId ?? 0,
        params.selectedShaftId ?? 0,
        params.selectedSectionId ?? 0,
        params.selectedGangId ?? 0,
        params.selectedIds ?? []
      );
      if (result?.error) {
        setReportError(result.error);
        setGridData([]);
      } else {
        const data = Array.isArray(result?.data) ? result.data : [];
        setGridData(
          data.map((row, index) => ({ ...row, id: row.id ?? index }))
        );
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
          hideDateRange={true}
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
            columns={EQUIPMENT_LIST_COLUMNS}
            data={gridData}
            height={500}
            className="w-full"
          />
        )}
      </div>
    </>
  );
}
