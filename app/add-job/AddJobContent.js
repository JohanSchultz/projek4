"use client";

import { useState, useTransition, useCallback } from "react";
import { PartsPerTypeGrid } from "./PartsPerTypeGrid";

function itemDisplayLabel(item) {
  return item.serial_no ?? item.serialno ?? item.descr ?? item.id ?? "—";
}

function gridRowKey(row, index) {
  return row.id != null ? String(row.id) : `row-${index}`;
}

function numericVal(val) {
  if (val == null || val === "") return 0;
  const n = Number(val);
  return Number.isNaN(n) ? 0 : n;
}

export function AddJobContent({
  equipmentTypes,
  technicians,
  initialPartsData,
  fetchPartsByTypeId,
  fetchItemsPerType,
  insertJob: insertJobAction,
  insertPartsPerJob: insertPartsPerJobAction,
}) {
  const types = equipmentTypes ?? [];
  const techList = technicians ?? [];
  const [selectedId, setSelectedId] = useState(0);
  const [itemsList, setItemsList] = useState([]);
  const [selectedSerialId, setSelectedSerialId] = useState(0);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState(0);
  const [inDate, setInDate] = useState("");
  const [outDate, setOutDate] = useState("");
  const [comments, setComments] = useState("");
  const [gridData, setGridData] = useState([]);
  const [qtyByKey, setQtyByKey] = useState({});
  const [checkedByKey, setCheckedByKey] = useState({});
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [insertJobResult, setInsertJobResult] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [savePending, startSaveTransition] = useTransition();

  const setQty = useCallback((key, value) => {
    const next = value === "" ? "" : String(value);
    setQtyByKey((prev) => ({ ...prev, [key]: next }));
  }, []);
  const setChecked = useCallback((key, value) => {
    setCheckedByKey((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    const id = value === "" ? null : Number(value);
    setSelectedId(id ?? 0);
    setSelectedSerialId(0);
    setError(null);
    if (id == null || id === 0) {
      setGridData([]);
      setItemsList([]);
      setQtyByKey({});
      setCheckedByKey({});
      return;
    }
    startTransition(async () => {
      const [partsResult, itemsResult] = await Promise.all([
        fetchPartsByTypeId(id),
        fetchItemsPerType(id),
      ]);
      if (partsResult?.error) {
        setError(partsResult.error);
        setGridData([]);
      } else {
        setGridData(Array.isArray(partsResult?.data) ? partsResult.data : []);
        setQtyByKey({});
        setCheckedByKey({});
      }
      if (itemsResult?.error) {
        setItemsList([]);
      } else {
        setItemsList(Array.isArray(itemsResult?.data) ? itemsResult.data : []);
      }
    });
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-6">
        <div>
          <label
            htmlFor="equipment-type-select"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Equipment type
          </label>
          <select
            id="equipment-type-select"
            value={selectedId == null ? "" : selectedId}
            onChange={handleChange}
            disabled={types.length === 0}
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400 disabled:opacity-50"
          >
            <option value={0}>  -  SELECT - </option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.descr ?? t.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="serial-no-select"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Serial No.
          </label>
          <select
            id="serial-no-select"
            value={selectedSerialId == null ? "" : selectedSerialId}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedSerialId(value === "" ? 0 : Number(value));
            }}
            disabled={selectedId == null || selectedId === 0 || isPending}
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400 disabled:opacity-50"
          >
            <option value={0}>  -  SELECT - </option>
            {itemsList.map((item) => (
              <option key={item.id} value={item.id}>
                {itemDisplayLabel(item)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="technician-select"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Technician
          </label>
          <select
            id="technician-select"
            value={selectedTechnicianId == null ? "" : selectedTechnicianId}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedTechnicianId(value === "" ? 0 : Number(value));
            }}
            disabled={techList.length === 0}
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400 disabled:opacity-50"
          >
            <option value={0}>  -  SELECT - </option>
            {techList.map((tech) => (
              <option key={tech.id} value={tech.id}>
                {tech.descr ?? tech.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="in-date"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            In Date
          </label>
          <input
            type="date"
            id="in-date"
            value={inDate}
            onChange={(e) => setInDate(e.target.value)}
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
          />
        </div>
        <div>
          <label
            htmlFor="out-date"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Out Date
          </label>
          <input
            type="date"
            id="out-date"
            value={outDate}
            onChange={(e) => setOutDate(e.target.value)}
            className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
          />
        </div>
      </div>

      <h2 className="mb-3 text-base font-semibold text-zinc-800 dark:text-zinc-200">
        Parts per type
      </h2>
      <div className="mb-4">
        <label
          htmlFor="comments"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Comments
        </label>
        <textarea
          id="comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={3}
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400"
          placeholder=""
        />
      </div>
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
        <PartsPerTypeGrid
          data={gridData}
          qtyByKey={qtyByKey}
          setQty={setQty}
          checkedByKey={checkedByKey}
          setChecked={setChecked}
        />
      )}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => {
            setSaveError(null);
            startSaveTransition(async () => {
              const result = await insertJobAction(
                selectedSerialId || null,
                selectedTechnicianId || null,
                inDate || null,
                outDate || null,
                comments ?? ""
              );
              if (result?.error) {
                setSaveError(result.error);
                setInsertJobResult(null);
                return;
              }
              const jobId = result?.insertJob ?? null;
              setInsertJobResult(jobId);
              if (jobId == null) return;
              for (let i = 0; i < gridData.length; i++) {
                const row = gridData[i];
                const key = gridRowKey(row, i);
                const qty = numericVal(qtyByKey[key]);
                if (qty <= 0) continue;
                const partId = row.partid != null ? row.partid : null;
                const unitCost = numericVal(row.costa);
                const isDamaged = !!checkedByKey[key];
                const partResult = await insertPartsPerJobAction(
                  selectedSerialId || null,
                  jobId,
                  partId,
                  Math.floor(qty),
                  unitCost,
                  isDamaged
                );
                if (partResult?.error) {
                  setSaveError(partResult.error);
                  break;
                }
              }
            });
          }}
          disabled={savePending}
          className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          {savePending ? "Saving…" : "Save Job"}
        </button>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={insertJobResult != null ? String(insertJobResult) : ""}
            className="w-32 rounded border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-200"
            placeholder="—"
            aria-label="Insert job result"
          />
        </div>
      </div>
      {saveError && (
        <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
          {saveError}
        </p>
      )}
    </>
  );
}
