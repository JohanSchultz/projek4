"use client";

import { useState, useTransition } from "react";
import { PartsPerTypeGrid } from "./PartsPerTypeGrid";

function itemDisplayLabel(item) {
  return item.serial_no ?? item.serialno ?? item.descr ?? item.id ?? "—";
}

export function AddJobContent({
  equipmentTypes,
  technicians,
  initialPartsData,
  fetchPartsByTypeId,
  fetchItemsPerType,
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
  const [error, setError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e) => {
    const value = e.target.value;
    const id = value === "" ? null : Number(value);
    setSelectedId(id ?? 0);
    setSelectedSerialId(0);
    setError(null);
    if (id == null || id === 0) {
      setGridData([]);
      setItemsList([]);
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
        <PartsPerTypeGrid data={gridData} />
      )}
    </>
  );
}
