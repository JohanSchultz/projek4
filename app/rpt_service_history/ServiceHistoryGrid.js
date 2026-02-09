"use client";

import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";

export function ServiceHistoryGrid({ data }) {
  const columns = useMemo(
    () => [
      {
        id: "cat",
        accessorKey: "cat",
        header: "Category",
        cell: ({ getValue }) => getValue() ?? "—",
      },
      {
        id: "typ",
        accessorKey: "typ",
        header: "Type",
        cell: ({ getValue }) => getValue() ?? "—",
      },
      {
        id: "isactive",
        accessorKey: "isactive",
        header: "Active",
        cell: ({ row }) => {
          const active = row.original.isactive;
          return (
            <span
              className={
                active
                  ? "rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "rounded-full bg-zinc-200 px-2 py-0.5 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
              }
            >
              {active ? "Yes" : "No"}
            </span>
          );
        },
      },
      {
        id: "created_at",
        accessorKey: "created_at",
        header: "Created",
        cell: ({ row }) => {
          const val = row.original.created_at;
          return val
            ? new Date(val).toLocaleString(undefined, {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "—";
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: data ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const rows = table.getRowModel().rows;

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr
              key={hg.id}
              className="border-b border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800"
            >
              {hg.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id}
              className={`border-b border-zinc-200 dark:border-zinc-700 ${
                index % 2 === 0
                  ? "bg-white dark:bg-zinc-900"
                  : "bg-zinc-50 dark:bg-zinc-800/50"
              }`}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-4 py-3 text-zinc-800 dark:text-zinc-200"
                >
                  {flexRender(
                    cell.column.columnDef.cell,
                    cell.getContext()
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
