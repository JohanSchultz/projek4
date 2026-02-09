"use client";

import { useMemo } from "react";

const rowClass =
  "border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50";
const catCellClass =
  "border-b border-zinc-200 bg-zinc-100 font-medium align-top dark:border-zinc-700 dark:bg-zinc-800";

export function ServiceHistoryGrid({ data }) {
  const rows = data ?? [];

  // Precompute category row spans (data is ordered by cat)
  const catSpans = useMemo(() => {
    const result = [];
    let i = 0;
    while (i < rows.length) {
      const cat = rows[i].cat;
      let start = i;
      while (i < rows.length && rows[i].cat === cat) i++;
      const span = i - start;
      for (let j = start; j < i; j++) {
        result[j] = { isFirst: j === start, rowSpan: j === start ? span : 0 };
      }
    }
    return result;
  }, [rows]);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
            <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
              Category
            </th>
            <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
              Type
            </th>
            <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
              Active
            </th>
            <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
              Created
            </th>
            <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300">
              Equipment category ID
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className={rowClass}>
              {catSpans[index].isFirst ? (
                <td
                  rowSpan={catSpans[index].rowSpan}
                  className={`px-4 py-3 text-zinc-800 dark:text-zinc-200 ${catCellClass}`}
                >
                  {row.cat ?? "—"}
                </td>
              ) : null}
              <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200">
                {row.typ ?? "—"}
              </td>
              <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200">
                <span
                  className={
                    row.isactive
                      ? "rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "rounded-full bg-zinc-200 px-2 py-0.5 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                  }
                >
                  {row.isactive ? "Yes" : "No"}
                </span>
              </td>
              <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200">
                {row.created_at
                  ? new Date(row.created_at).toLocaleString(undefined, {
                      dateStyle: "short",
                      timeStyle: "short",
                    })
                  : "—"}
              </td>
              <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200">
                {row.equipmentcategories_id != null
                  ? String(row.equipmentcategories_id)
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
