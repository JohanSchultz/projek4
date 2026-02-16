"use client";

import {
  useReactTable,
  getCoreRowModel,
  getGroupedRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
  aggregationFns,
} from "@tanstack/react-table";
import { useMemo, useState, useEffect } from "react";

const rowClass =
  "border-b border-sky-200 bg-sky-50/80 dark:border-sky-800 dark:bg-sky-950/50";
const groupRowClass =
  "border-b border-sky-200 bg-sky-200 font-medium dark:border-sky-800 dark:bg-sky-800 dark:text-sky-100";
const thClass =
  "border-b border-sky-200 bg-sky-100 px-4 py-3 font-semibold text-left text-sm text-sky-800 dark:border-sky-800 dark:bg-sky-900 dark:text-sky-200";
const tdClass = "px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200";

function normalizeKey(k) {
  return k.toLowerCase().replace(/_/g, "");
}

function findTypeKey(keys) {
  const normalized = keys.map((k) => [normalizeKey(k), k]);
  const match = normalized.find(([n]) => n === "type" || n === "equipmenttype");
  return match ? match[1] : keys.find((k) => /type/.test(normalizeKey(k))) ?? null;
}

function findRepairMinsKey(keys) {
  const normalized = keys.map((k) => [normalizeKey(k), k]);
  const match = normalized.find(
    ([n]) => n === "repairmins" || n === "repair_mins" || n === "repairminsum"
  );
  return match
    ? match[1]
    : keys.find((k) => /repair/.test(normalizeKey(k)) && /min/.test(normalizeKey(k))) ?? null;
}

function formatValue(value) {
  if (value == null) return "—";
  if (typeof value === "number") return Number.isFinite(value) ? value : "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function MinsPerTypeGrid({ data }) {
  const rows = Array.isArray(data) ? data : [];
  const [expandedState, setExpandedState] = useState({});

  const { columns, typeKey } = useMemo(() => {
    const keys = rows.length > 0 ? Object.keys(rows[0]) : [];
    const typeKey = findTypeKey(keys);
    const repairMinsKey = findRepairMinsKey(keys);

    const columnHelper = createColumnHelper();
    const colDefs = keys.map((key) => {
      const isType = key === typeKey;
      const isRepairMins = key === repairMinsKey;
      return columnHelper.accessor(key, {
        id: key,
        header: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        enableGrouping: isType,
        aggregationFn: isRepairMins ? "sum" : undefined,
        cell: ({ getValue }) => {
          const value = getValue();
          return formatValue(value);
        },
      });
    });

    return { columns: colDefs, typeKey };
  }, [rows]);

  const grouping = useMemo(() => (typeKey ? [typeKey] : []), [typeKey]);

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      grouping,
      expanded: expandedState,
    },
    onExpandedChange: setExpandedState,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    aggregationFns: {
      ...aggregationFns,
    },
  });

  const rowModel = table.getRowModel();
  const groupRowIds = useMemo(
    () => rowModel.rows.filter((r) => r.getIsGrouped()).map((r) => r.id),
    [rowModel.rows]
  );

  useEffect(() => {
    if (groupRowIds.length > 0) {
      setExpandedState((prev) => {
        const next = groupRowIds.reduce((acc, id) => ({ ...acc, [id]: true }), {});
        return Object.keys(prev).length === 0 ? next : prev;
      });
    }
  }, [groupRowIds.join(",")]);

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-zinc-600 dark:border-sky-700 dark:bg-sky-950/80 dark:text-zinc-400">
        No data.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-sky-200 bg-sky-50 dark:border-sky-700 dark:bg-sky-950/80">
      <table className="w-full min-w-[24rem] text-left text-sm">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className={thClass}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {rowModel.rows.map((row) => {
            const isGroup = row.getIsGrouped();
            return (
              <tr
                key={row.id}
                className={isGroup ? groupRowClass : rowClass}
                style={isGroup ? {} : { paddingLeft: 0 }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={tdClass}
                    style={
                      isGroup && cell.column.getIsGrouped()
                        ? { paddingLeft: `${row.depth * 1.5}rem` }
                        : undefined
                    }
                  >
                    {cell.getIsGrouped() ? (
                      <button
                        type="button"
                        onClick={row.getToggleExpandedHandler()}
                        className="flex items-center gap-1 font-medium"
                      >
                        {row.getIsExpanded() ? "▼" : "▶"}{" "}
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </button>
                    ) : (
                      flexRender(cell.column.columnDef.cell, cell.getContext())
                    )}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
