"use client";

import { useRef, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

const ROW_HEIGHT = 36;

/**
 * Reusable virtualized data grid using TanStack Table + TanStack Virtual.
 * @param {Object} props
 * @param {Array<{ id: string, header: string, accessorKey?: string, numeric?: boolean }>} props.columns - Column definitions
 * @param {Array<Record<string, unknown>>} props.data - Row data
 * @param {number} [props.height=500] - Fixed height of the scrollable area (px)
 * @param {string} [props.className] - Optional class for the wrapper
 */
export function VirtualGrid({ columns, data, height = 500, className = "" }) {
  const parentRef = useRef(null);

  const columnDefs = useMemo(
    () =>
      columns.map((col) => ({
        id: col.id,
        accessorKey: col.accessorKey ?? col.id,
        header: col.header,
        cell: (info) => {
          const value = info.getValue();
          if (value == null) return "—";
          if (typeof value === "number" && !Number.isNaN(value)) return value;
          return String(value);
        },
        meta: { numeric: col.numeric === true },
      })),
    [columns]
  );

  const table = useReactTable({
    data,
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
  });

  const { rows } = table.getRowModel();

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 15,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const totalSize = virtualizer.getTotalSize();

  return (
    <div
      ref={parentRef}
      className={`overflow-auto border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 ${className}`}
      style={{ height: `${height}px` }}
    >
      <div style={{ height: `${totalSize}px`, position: "relative" }}>
        <table className="w-full border-collapse text-sm table-fixed">
          <thead className="sticky top-0 z-10 bg-zinc-100 dark:bg-zinc-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="border-b border-zinc-200 px-4 py-3 text-left font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {virtualItems.map((virtualRow, i) => {
              const row = rows[virtualRow.index];
              const isEven = virtualRow.index % 2 === 0;
              return (
                <tr
                  key={row.id}
                  className={
                    isEven
                      ? "border-b border-zinc-200 bg-zinc-50/80 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800/30 dark:text-zinc-200"
                      : "border-b border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                  }
                  style={{
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start - i * virtualRow.size}px)`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isNumeric = cell.column.columnDef.meta?.numeric;
                    return (
                      <td
                        key={cell.id}
                        className={`border-b border-zinc-200 px-4 py-2 dark:border-zinc-700 ${
                          isNumeric ? "text-right tabular-nums" : "text-left"
                        }`}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
