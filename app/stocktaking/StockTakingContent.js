"use client";

import { useState, useEffect } from "react";

const inputClass =
  "w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";
const invisibleColClass =
  "w-0 max-w-0 p-0 overflow-hidden invisible border-0";
const gridThClass =
  "border-b border-zinc-200 bg-zinc-100 px-4 py-3 font-semibold text-left text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
const gridTdClass =
  "border-b border-zinc-200 px-4 py-3 text-sm text-zinc-800 dark:border-zinc-700 dark:text-zinc-200";

const COLUMNS = [
  { key: "id", header: "Id", visible: false },
  { key: "stockcode", header: "Part No.", visible: true },
  { key: "part", header: "Description", visible: true },
  { key: "stocklevel", header: "Current Qty", visible: true },
  { key: "newQty", header: "New Qty", visible: true, isInput: true },
];

function applyFetchedData(data, setGridData, setNewQtyValues) {
  setGridData(data);
  const initialNewQty = data.reduce((acc, row) => {
    const level = row.stocklevel;
    acc[row.id] =
      level != null && level !== ""
        ? String(Math.floor(Number(level)))
        : "";
    return acc;
  }, {});
  setNewQtyValues(initialNewQty);
}

export function StockTakingContent({
  fetchPartsForStockTaking,
  updatePartsStockLevels,
}) {
  const [gridData, setGridData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newQtyValues, setNewQtyValues] = useState({});
  const [savePending, setSavePending] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (typeof fetchPartsForStockTaking !== "function") {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchPartsForStockTaking().then((res) => {
      if (res?.error) {
        setError(res.error);
        setGridData([]);
      } else {
        const data = Array.isArray(res?.data) ? res.data : [];
        applyFetchedData(data, setGridData, setNewQtyValues);
      }
      setLoading(false);
    });
  }, [fetchPartsForStockTaking]);

  const handleNewQtyChange = (partId, value) => {
    if (value === "" || /^\d*$/.test(value)) {
      setNewQtyValues((prev) => ({ ...prev, [partId]: value }));
    }
  };

  const handleReset = () => {
    const initialNewQty = gridData.reduce((acc, row) => {
      const level = row.stocklevel;
      acc[row.id] =
        level != null && level !== ""
          ? String(Math.floor(Number(level)))
          : "";
      return acc;
    }, {});
    setNewQtyValues(initialNewQty);
  };

  const handleSave = async () => {
    setSaveError(null);
    const updates = [];
    for (const row of gridData) {
      const currentQty =
        row.stocklevel != null && row.stocklevel !== ""
          ? Math.floor(Number(row.stocklevel))
          : 0;
      const newVal = newQtyValues[row.id];
      const newQtyNum =
        newVal !== "" && newVal != null ? Math.floor(Number(newVal)) : 0;
      if (currentQty !== newQtyNum) {
        updates.push({ id: row.id, stocklevel: newVal != null ? newVal : "" });
      }
    }
    if (updates.length === 0) {
      return;
    }
    setSavePending(true);
    const res = await (updatePartsStockLevels ?? (() => Promise.resolve({ error: null })))(updates);
    if (res?.error) {
      setSaveError(res.error);
      setSavePending(false);
      return;
    }
    const fetchRes = await fetchPartsForStockTaking();
    if (fetchRes?.error) {
      setSaveError(fetchRes.error);
      setSavePending(false);
      return;
    }
    const data = Array.isArray(fetchRes?.data) ? fetchRes.data : [];
    applyFetchedData(data, setGridData, setNewQtyValues);
    setSavePending(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full items-center justify-between">
        <button
          type="button"
          onClick={handleSave}
          disabled={savePending}
          className="rounded border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50"
        >
          {savePending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Reset
        </button>
      </div>

      {saveError && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          {saveError}
        </p>
      )}

      <hr className="border-zinc-200 dark:border-zinc-700" />

      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
        {loading ? (
          <p className="px-4 py-6 text-sm text-zinc-500 dark:text-zinc-400">
            Loading…
          </p>
        ) : error ? (
          <p className="px-4 py-6 text-sm text-amber-600 dark:text-amber-400">
            {error}
          </p>
        ) : (
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    className={
                      !col.visible
                        ? `${gridThClass} ${invisibleColClass}`
                        : gridThClass
                    }
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gridData.length === 0 ? (
                <tr>
                  <td
                    colSpan={COLUMNS.length}
                    className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400"
                  >
                    No data
                  </td>
                </tr>
              ) : (
                gridData.map((row, index) => (
                  <tr
                    key={row.id ?? index}
                    className="bg-zinc-50 dark:bg-zinc-800/50 even:bg-white dark:even:bg-zinc-800/30"
                  >
                    {COLUMNS.map((col) => {
                      if (col.key === "newQty" && col.isInput) {
                        return (
                          <td key={col.key} className={gridTdClass}>
                            <input
                              type="text"
                              inputMode="numeric"
                              className={inputClass}
                              value={newQtyValues[row.id] ?? ""}
                              onChange={(e) =>
                                handleNewQtyChange(row.id, e.target.value)
                              }
                              aria-label={`New Qty for ${row.stockcode ?? row.id}`}
                            />
                          </td>
                        );
                      }
                      const visible = col.visible;
                      const value =
                        col.key === "id"
                          ? row.id
                          : row[col.key];
                      const displayValue =
                        value != null && col.key !== "id"
                          ? String(value)
                          : "—";
                      return (
                        <td
                          key={col.key}
                          className={
                            !visible
                              ? `${gridTdClass} ${invisibleColClass}`
                              : gridTdClass
                          }
                        >
                          {displayValue}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
