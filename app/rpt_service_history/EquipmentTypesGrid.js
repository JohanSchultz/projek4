"use client";

import { useState, useCallback } from "react";

const rowClass =
  "border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50";
const thClass =
  "border-b border-zinc-200 bg-zinc-100 px-4 py-3 font-semibold text-left text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
const tdClass = "px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200";

const NUMERIC_COLUMN_ID = "__numeric_value";

function formatValue(value) {
  if (value == null) return "—";
  if (typeof value === "boolean")
    return value ? "Yes" : "No";
  if (value instanceof Date || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value))) {
    try {
      return new Date(value).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return String(value);
    }
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function rowKey(row, index) {
  return row.id != null ? String(row.id) : `row-${index}`;
}

export function EquipmentTypesGrid({ data }) {
  const rows = data ?? [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const [numericValues, setNumericValues] = useState({});

  const setNumericFor = useCallback((key, value) => {
    const next = value === "" ? "" : String(value);
    setNumericValues((prev) => ({ ...prev, [key]: next }));
  }, []);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead>
          <tr>
            {columns.map((key) => (
              <th key={key} className={thClass}>
                {key}
              </th>
            ))}
            <th key={NUMERIC_COLUMN_ID} className={thClass}>
              Value
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const key = rowKey(row, index);
            const numVal = numericValues[key] ?? "";
            return (
              <tr key={key} className={rowClass}>
                {columns.map((colKey) => (
                  <td key={colKey} className={tdClass}>
                    {colKey === "isactive" ? (
                      <span
                        className={
                          row[colKey]
                            ? "rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "rounded-full bg-zinc-200 px-2 py-0.5 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                        }
                      >
                        {row[colKey] ? "Yes" : "No"}
                      </span>
                    ) : (
                      formatValue(row[colKey])
                    )}
                  </td>
                ))}
                <td className={tdClass}>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={numVal}
                    onChange={(e) => setNumericFor(key, e.target.value)}
                    className="w-24 rounded border border-zinc-300 bg-white px-2 py-1.5 text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
                    placeholder="—"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
