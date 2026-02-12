"use client";

const rowClass =
  "border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50";
const thClass =
  "border-b border-zinc-200 bg-zinc-100 px-4 py-3 font-semibold text-left text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
const tdClass = "px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200";
const invisibleColClass =
  "w-0 max-w-0 p-0 overflow-hidden invisible border-0";

const columnHeaders = {
  shaft: "Shaft",
  descr: "Shaft",
  mine_id: "Mine",
  mine: "Mine",
  mine_descr: "Mine",
  isactive: "Active",
};

function getColumnHeader(key) {
  return columnHeaders[key] ?? key;
}

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

export function AllshaftsGrid({ data, onRowClick }) {
  const rows = Array.isArray(data) ? data : [];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead>
          <tr>
            {columns.map((key) => (
              <th
                key={key}
                className={
                  key === "id" || key === "mine_id"
                    ? `${thClass} ${invisibleColClass}`
                    : thClass
                }
              >
                {getColumnHeader(key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={row.id ?? index}
              className={onRowClick ? `${rowClass} cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50` : rowClass}
              onClick={() => typeof onRowClick === "function" && onRowClick(row)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onRowClick(row);
                }
              }}
            >
              {columns.map((key) => (
                <td
                  key={key}
                  className={
                    key === "id" || key === "mine_id"
                      ? `${tdClass} ${invisibleColClass}`
                      : tdClass
                  }
                >
                  {key === "isactive" ? (
                    <span
                      className={
                        row[key]
                          ? "rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "rounded-full bg-zinc-200 px-2 py-0.5 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                      }
                    >
                      {row[key] ? "Yes" : "No"}
                    </span>
                  ) : (
                    formatValue(row[key])
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
