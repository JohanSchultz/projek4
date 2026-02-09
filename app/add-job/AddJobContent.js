"use client";

import { useState, useTransition } from "react";
import { PartsPerTypeGrid } from "./PartsPerTypeGrid";

export function AddJobContent({
  equipmentTypes,
  initialPartsData,
  fetchPartsByTypeId,
}) {
  const types = equipmentTypes ?? [];
  const firstId = types.length > 0 ? types[0].id : null;
  const [selectedId, setSelectedId] = useState(firstId);
  const [gridData, setGridData] = useState(initialPartsData ?? []);
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    const value = e.target.value;
    const id = value === "" ? null : Number(value);
    setSelectedId(id);
    setError(null);
    if (id == null) {
      setGridData([]);
      return;
    }
    startTransition(async () => {
      const result = await fetchPartsByTypeId(id);
      if (result?.error) {
        setError(result.error);
        setGridData([]);
      } else {
        setGridData(Array.isArray(result?.data) ? result.data : []);
      }
    });
  };

  return (
    <>
      <div className="mb-4">
        <label
          htmlFor="equipment-type-select"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Equipment type
        </label>
        <select
          id="equipment-type-select"
          value={selectedId ?? ""}
          onChange={handleChange}
          disabled={types.length === 0}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400 disabled:opacity-50"
        >
          {types.length === 0 && (
            <option value="">No equipment types</option>
          )}
          {types.map((t) => (
            <option key={t.id} value={t.id}>
              {t.descr ?? t.id}
            </option>
          ))}
        </select>
      </div>

      <h2 className="mb-3 text-base font-semibold text-zinc-800 dark:text-zinc-200">
        Parts per type
      </h2>
      {error && (
        <p className="mb-2 text-sm text-amber-600 dark:text-amber-400">
          {error}
        </p>
      )}
      {isPending && (
        <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
          Loading…
        </p>
      )}
      {!error && !isPending && gridData.length === 0 && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">No data.</p>
      )}
      {!error && !isPending && gridData.length > 0 && (
        <PartsPerTypeGrid data={gridData} />
      )}
    </>
  );
}
