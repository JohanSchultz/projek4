"use client";

import { useState, useCallback } from "react";

const rowClass =
  "border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50";
const thClass =
  "border-b border-zinc-200 bg-zinc-100 px-4 py-3 font-semibold text-left text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
const tdClass = "px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200";

const invisibleColClass =
  "w-0 max-w-0 p-0 overflow-hidden invisible border-0";

const inputClass =
  "w-20 rounded border border-zinc-300 bg-white px-2 py-1.5 text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";

function formatValue(value) {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (
    value instanceof Date ||
    (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value))
  ) {
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

function numericValue(val) {
  if (val == null || val === "") return 0;
  const n = Number(val);
  return Number.isNaN(n) ? 0 : n;
}

function rowKey(row, index) {
  return row.id != null ? String(row.id) : `row-${index}`;
}

const COLUMN_HEADINGS = {
  stockcode: "Stock Code",
  part: "Part Description",
  costa: "Unit Cost",
};

function columnHeading(key) {
  return COLUMN_HEADINGS[key] ?? key;
}

export function PartsPerTypeGrid({ data }) {
  const rows = Array.isArray(data) ? data : [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  const [qtyByKey, setQtyByKey] = useState({});
  const [checkedByKey, setCheckedByKey] = useState({});

  const setQty = useCallback((key, value) => {
    const next = value === "" ? "" : String(value);
    setQtyByKey((prev) => ({ ...prev, [key]: next }));
  }, []);

  const setChecked = useCallback((key, value) => {
    setCheckedByKey((prev) => ({ ...prev, [key]: value }));
  }, []);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead>
          <tr>
            <th className={thClass}>Qty</th>
            {columns.map((key) => (
              <th
                key={key}
                className={
                  key === "partid"
                    ? `${thClass} ${invisibleColClass}`
                    : thClass
                }
              >
                {columnHeading(key)}
              </th>
            ))}
            <th className={thClass}>Total</th>
            <th className={thClass}>Abuse</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const key = rowKey(row, index);
            const qtyStr = qtyByKey[key] ?? "";
            const costa = numericValue(row.costa);
            const qtyNum = numericValue(qtyStr);
            const total = qtyNum * costa;
            return (
              <tr key={key} className={rowClass}>
                <td className={tdClass}>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={qtyStr}
                    onChange={(e) => setQty(key, e.target.value)}
                    className={inputClass}
                    placeholder="0"
                  />
                </td>
                {columns.map((colKey) => (
                  <td
                    key={colKey}
                    className={
                      colKey === "partid"
                        ? `${tdClass} ${invisibleColClass}`
                        : tdClass
                    }
                  >
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
                  {qtyStr === "" ? "—" : total}
                </td>
                <td className={tdClass}>
                  <input
                    type="checkbox"
                    checked={!!checkedByKey[key]}
                    onChange={(e) => setChecked(key, e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-zinc-400"
                    aria-label={`Select row ${index + 1}`}
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
