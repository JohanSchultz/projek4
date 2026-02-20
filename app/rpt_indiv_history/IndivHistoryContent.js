"use client";

import { useState, useTransition } from "react";
import { VirtualGrid } from "@/components/VirtualGrid";
import { exportIndivHistoryToExcel } from "@/lib/export-utils";

const inputClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";
const selectClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";

const INDIV_HISTORY_COLUMNS = [
  { id: "technician", header: "Technician", accessorKey: "technician" },
  { id: "jobno", header: "Job No", accessorKey: "jobno" },
  { id: "stockcode", header: "Stock Code", accessorKey: "stockcode" },
  { id: "part", header: "Part", accessorKey: "part" },
  { id: "isdamaged", header: "Damaged", accessorKey: "isdamaged", accessorFn: (r) => r?.isdamaged ?? r?.is_damaged ?? "" },
  { id: "unitcost", header: "Unit Cost", accessorKey: "unitcost", numeric: true, accessorFn: (r) => r?.unitcost ?? r?.unit_cost ?? "" },
  { id: "qty", header: "Qty", accessorKey: "qty", numeric: true },
  { id: "total", header: "Total", accessorKey: "total", numeric: true },
];

export function IndivHistoryContent({
  equipmentTypes,
  searchEquipmentItemsBySerial,
  getEquipmentItemById,
  fetchIndivHistory,
}) {
  const [typeId, setTypeId] = useState(0);
  const [serialNumber, setSerialNumber] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [gridData, setGridData] = useState([]);
  const [reportError, setReportError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const typesList = Array.isArray(equipmentTypes) ? equipmentTypes : [];

  const handleSearchClick = () => {
    const term = serialNumber.trim();
    if (term.length < 2) return;
    if (typeId === 0) return;
    if (typeof searchEquipmentItemsBySerial !== "function") return;
    searchEquipmentItemsBySerial(term, typeId).then((res) => {
      setSearchResults(Array.isArray(res?.data) ? res.data : []);
      setShowSearchPopup(true);
    });
  };

  const handleSelectSerial = async (row) => {
    setShowSearchPopup(false);
    const id = row?.id;
    if (id == null || typeof getEquipmentItemById !== "function") {
      setSerialNumber(row?.serialno ?? row?.serial_no ?? "");
      setSelectedItemId(null);
      return;
    }
    const res = await getEquipmentItemById(id);
    const record = res?.data;
    if (!record) {
      setSerialNumber(row?.serialno ?? row?.serial_no ?? "");
      setSelectedItemId(null);
      return;
    }
    setSerialNumber(record.serialno ?? record.serial_no ?? "");
    setSelectedItemId(id);
  };

  const formatCellValue = (value) => {
    if (value == null) return "—";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    return String(value);
  };

  const handleExportToExcel = () => {
    if (!gridData.length) return;
    const headers = INDIV_HISTORY_COLUMNS.map((col) => col.header);
    const dataRows = gridData.map((row) =>
      INDIV_HISTORY_COLUMNS.map((col) => {
        const val = col.accessorFn ? col.accessorFn(row) : row[col.accessorKey ?? col.id];
        return formatCellValue(val);
      })
    );
    const rows = [headers, ...dataRows];
    const equipmentTypeLabel = typesList.find((t) => t.id === typeId)?.descr ?? "";
    exportIndivHistoryToExcel(rows, "individual_item_history.xlsx", "Individual Item History", {
      equipmentType: equipmentTypeLabel,
      serialNo: serialNumber,
      fromDate,
      toDate,
    });
  };

  const handleShowReport = () => {
    if (typeof fetchIndivHistory !== "function") return;
    if (!typeId || !selectedItemId) return;
    setReportError(null);
    startTransition(async () => {
      const result = await fetchIndivHistory(
        typeId,
        selectedItemId,
        fromDate || null,
        toDate || null
      );
      if (result?.error) {
        setReportError(result.error);
        setGridData([]);
      } else {
        const data = Array.isArray(result?.data) ? result.data : [];
        setGridData(data.map((row, index) => ({ ...row, id: row.id ?? index })));
      }
    });
  };

  return (
    <>
      {showSearchPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowSearchPopup(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Search serial numbers"
        >
          <div
            className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Select a serial number
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              <span>Serial number</span>
              <span>Equipment type</span>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto p-2">
              {searchResults.length === 0 ? (
                <li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                  No matches found.
                </li>
              ) : (
                searchResults.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectSerial(row)}
                      className="grid w-full grid-cols-[1fr_auto] gap-4 rounded px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      <span className="min-w-0 truncate">
                        {row.serialno ?? row.serial_no ?? "—"}
                      </span>
                      <span className="shrink-0 text-zinc-600 dark:text-zinc-300">
                        {row.equipmenttypes?.descr ?? "—"}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
      <input
        type="text"
        id="item_id"
        name="item_id"
        value={selectedItemId ?? ""}
        readOnly
        aria-hidden="true"
        className="sr-only"
      />
      <div className="mb-6 flex flex-wrap items-end gap-6">
        <div>
          <label
            htmlFor="indiv-equipment-type"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Equipment types
          </label>
          <select
            id="indiv-equipment-type"
            value={typeId == null ? "" : typeId}
            onChange={(e) =>
              setTypeId(e.target.value === "" ? 0 : Number(e.target.value))
            }
            className={selectClass}
          >
            <option value={0}>   -  SELECT  - </option>
            {typesList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.descr ?? t.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="indiv-serial-number"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Serial Number
          </label>
          <div className="flex items-stretch gap-2">
            <input
              type="text"
              id="indiv-serial-number"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className={inputClass + " rounded-r-none"}
              placeholder=""
            />
            <button
              type="button"
              onClick={handleSearchClick}
              disabled={serialNumber.trim().length < 2 || typeId === 0}
              className="rounded border border-l border-zinc-300 bg-white px-2 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Search &gt;&gt;
            </button>
          </div>
        </div>
        <div>
          <label
            htmlFor="indiv-from-date"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            From
          </label>
          <input
            type="date"
            id="indiv-from-date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className={inputClass}
            aria-label="From date"
          />
        </div>
        <div>
          <label
            htmlFor="indiv-to-date"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            To
          </label>
          <input
            type="date"
            id="indiv-to-date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className={inputClass}
            aria-label="To date"
          />
        </div>
        <button
          type="button"
          onClick={handleShowReport}
          disabled={isPending || !typeId || !selectedItemId}
          className="rounded border border-sky-300 bg-sky-200 px-4 py-2 text-sm font-medium text-sky-900 shadow-sm hover:bg-sky-300 disabled:opacity-50 dark:border-sky-600 dark:bg-sky-700 dark:text-sky-100 dark:hover:bg-sky-600"
        >
          {isPending ? "Loading…" : "Show Report"}
        </button>
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
            No data. Select equipment type, search for a serial number, and click &quot;Show Report&quot; to load results.
          </p>
        )}
        {!isPending && !reportError && gridData.length > 0 && (
          <VirtualGrid
            columns={INDIV_HISTORY_COLUMNS}
            data={gridData}
            height={500}
            className="w-full"
          />
        )}
      </div>
    </>
  );
}
