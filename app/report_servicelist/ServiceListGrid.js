"use client";

const rowClass =
  "border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50";
const subtotalRowClass =
  "border-b border-zinc-200 bg-zinc-200 font-medium dark:bg-zinc-700 dark:text-zinc-100";
const thClass =
  "border-b border-zinc-200 bg-zinc-100 px-4 py-3 font-semibold text-left text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
const tdClass = "px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200";

const EQUIPMENT_CATEGORY_ID_KEYS = [
  "equipmentcategories_id",
  "equipment_category_id",
  "equipmentcategoryid",
];

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

function findEquipmentCategoryIdKey(orderedKeys) {
  const keySet = new Set(orderedKeys.map((k) => k.toLowerCase().replace(/_/g, "")));
  for (const candidate of EQUIPMENT_CATEGORY_ID_KEYS) {
    const normalized = candidate.toLowerCase().replace(/_/g, "");
    const found = orderedKeys.find((k) => k.toLowerCase().replace(/_/g, "") === normalized);
    if (found) return found;
  }
  const categoryKey = orderedKeys.find(
    (k) => /category/.test(k.toLowerCase()) && /id/.test(k.toLowerCase())
  );
  return categoryKey ?? null;
}

/**
 * Group rows by Equipment category ID and insert subtotal rows after each group.
 * Returns array of items: either a data row (object) or a subtotal placeholder { __subtotal: true, categoryId, count, categoryKey }.
 */
function rowsWithSubtotals(rows, orderedKeys) {
  const categoryKey = findEquipmentCategoryIdKey(orderedKeys);
  if (!categoryKey || rows.length === 0) return rows.map((r, i) => ({ ...r, __index: i }));

  const groups = new Map();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const catId = row[categoryKey] != null ? row[categoryKey] : "__null";
    const key = String(catId);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ ...row, __index: i });
  }

  const result = [];
  const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
    if (a === "__null") return 1;
    if (b === "__null") return -1;
    return String(a).localeCompare(String(b), undefined, { numeric: true });
  });
  for (const key of sortedKeys) {
    const groupRows = groups.get(key);
    groupRows.forEach((row) => result.push(row));
    result.push({
      __subtotal: true,
      categoryId: key === "__null" ? null : key,
      count: groupRows.length,
      categoryKey,
    });
  }
  return result;
}

export function ServiceListGrid({ data, columnConfig }) {
  const rows = Array.isArray(data) ? data : [];
  const orderedKeys =
    columnConfig?.orderedKeys?.length > 0 && rows.length > 0
      ? columnConfig.orderedKeys
      : rows.length > 0
        ? Object.keys(rows[0])
        : [];
  const headerLabels =
    columnConfig?.headerLabels?.length === orderedKeys.length
      ? columnConfig.headerLabels
      : orderedKeys;

  const rowsToRender = rowsWithSubtotals(rows, orderedKeys);

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
      <table className="w-full min-w-[32rem] text-left text-sm">
        <thead>
          <tr>
            {headerLabels.map((label, i) => (
              <th key={orderedKeys[i] ?? i} className={thClass}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowsToRender.map((item, index) => {
            if (item.__subtotal) {
              const categoryKey = item.categoryKey;
              const categoryKeyIndex = orderedKeys.indexOf(categoryKey);
              return (
                <tr key={`subtotal-${item.categoryId ?? "null"}-${index}`} className={subtotalRowClass}>
                  {orderedKeys.map((key, i) => {
                    if (i === 0)
                      return (
                        <td key={key} className={tdClass}>
                          Subtotal ({item.count} {item.count === 1 ? "row" : "rows"})
                        </td>
                      );
                    if (key === categoryKey)
                      return (
                        <td key={key} className={tdClass}>
                          {item.categoryId != null ? String(item.categoryId) : "—"}
                        </td>
                      );
                    return <td key={key} className={tdClass} />;
                  })}
                </tr>
              );
            }
            const row = item;
            return (
              <tr key={row.id ?? row.__index ?? index} className={rowClass}>
                {orderedKeys.map((key) => (
                  <td key={key} className={tdClass}>
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
