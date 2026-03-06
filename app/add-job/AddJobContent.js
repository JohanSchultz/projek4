"use client";

import { useState, useTransition, useCallback, useEffect } from "react";
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

const selectClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400 disabled:opacity-50";
const labelClass =
  "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function AddJobContent({
  equipmentTypes,
  technicians,
  mines,
  fetchShaftsByMineId,
  fetchSectionsByShaftId,
  fetchGangsBySectionId,
  fetchEquipmentItemById,
  initialPartsData,
  fetchPartsByTypeId,
  fetchItemsPerType,
  insertJob: insertJobAction,
  insertPartsPerJob: insertPartsPerJobAction,
}) {
  const types = equipmentTypes ?? [];
  const techList = technicians ?? [];
  const minesList = mines ?? [];
  const [selectedId, setSelectedId] = useState(0);
  const [itemsList, setItemsList] = useState([]);
  const [selectedSerialId, setSelectedSerialId] = useState(0);
  const [selectedMineId, setSelectedMineId] = useState(0);
  const [selectedShaftId, setSelectedShaftId] = useState(0);
  const [selectedSectionId, setSelectedSectionId] = useState(0);
  const [selectedGangId, setSelectedGangId] = useState(0);
  const [shaftsList, setShaftsList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [gangsList, setGangsList] = useState([]);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState(0);
  const [inDate, setInDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [outDate, setOutDate] = useState(() => new Date().toISOString().slice(0, 10));
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
    setSelectedMineId(0);
    setSelectedShaftId(0);
    setSelectedSectionId(0);
    setSelectedGangId(0);
    setShaftsList([]);
    setSectionsList([]);
    setGangsList([]);
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

  const handleMineChange = useCallback(
    (e) => {
      const id = e.target.value === "" ? 0 : Number(e.target.value);
      setSelectedMineId(id);
      setSelectedShaftId(0);
      setSelectedSectionId(0);
      setSelectedGangId(0);
      setSectionsList([]);
      setGangsList([]);
      if (!id) {
        setShaftsList([]);
        return;
      }
      fetchShaftsByMineId(id).then((res) => {
        setShaftsList(Array.isArray(res?.data) ? res.data : []);
      });
    },
    [fetchShaftsByMineId]
  );

  const handleShaftChange = useCallback(
    (e) => {
      const id = e.target.value === "" ? 0 : Number(e.target.value);
      setSelectedShaftId(id);
      setSelectedSectionId(0);
      setSelectedGangId(0);
      setGangsList([]);
      if (!id) {
        setSectionsList([]);
        return;
      }
      fetchSectionsByShaftId(id).then((res) => {
        setSectionsList(Array.isArray(res?.data) ? res.data : []);
      });
    },
    [fetchSectionsByShaftId]
  );

  const handleSectionChange = useCallback(
    (e) => {
      const id = e.target.value === "" ? 0 : Number(e.target.value);
      setSelectedSectionId(id);
      setSelectedGangId(0);
      if (!id) {
        setGangsList([]);
        return;
      }
      fetchGangsBySectionId(id).then((res) => {
        setGangsList(Array.isArray(res?.data) ? res.data : []);
      });
    },
    [fetchGangsBySectionId]
  );

  useEffect(() => {
    if (!selectedSerialId || typeof fetchEquipmentItemById !== "function") {
      return;
    }
    let cancelled = false;
    (async () => {
      const result = await fetchEquipmentItemById(selectedSerialId);
      if (cancelled || result?.error) return;
      const item = result?.data;
      const mineId = item?.mine_id != null ? Number(item.mine_id) : 0;
      const shaftId = item?.shaft_id != null ? Number(item.shaft_id) : 0;
      const sectionId = item?.section_id != null ? Number(item.section_id) : 0;
      const gangId = item?.gang_id != null ? Number(item.gang_id) : 0;
      setSelectedMineId(mineId);
      setSelectedShaftId(shaftId);
      setSelectedSectionId(sectionId);
      setSelectedGangId(gangId);
      const [shaftsRes, sectionsRes, gangsRes] = await Promise.all([
        fetchShaftsByMineId(mineId),
        fetchSectionsByShaftId(shaftId),
        fetchGangsBySectionId(sectionId),
      ]);
      if (cancelled) return;
      setShaftsList(Array.isArray(shaftsRes?.data) ? shaftsRes.data : []);
      setSectionsList(Array.isArray(sectionsRes?.data) ? sectionsRes.data : []);
      setGangsList(Array.isArray(gangsRes?.data) ? gangsRes.data : []);
    })();
    return () => { cancelled = true; };
  }, [
    selectedSerialId,
    fetchEquipmentItemById,
    fetchShaftsByMineId,
    fetchSectionsByShaftId,
    fetchGangsBySectionId,
  ]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start gap-6">
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
              if (value === "") {
                setSelectedMineId(0);
                setSelectedShaftId(0);
                setSelectedSectionId(0);
                setSelectedGangId(0);
                setShaftsList([]);
                setSectionsList([]);
                setGangsList([]);
              }
            }}
            disabled={selectedId == null || selectedId === 0 || isPending}
            className={selectClass}
          >
            <option value={0}>  -  SELECT - </option>
            {itemsList.map((item) => (
              <option key={item.id} value={item.id}>
                {itemDisplayLabel(item)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="mine-select" className={labelClass}>
              Mine
            </label>
            <select
              id="mine-select"
              value={selectedMineId == null ? "" : selectedMineId}
              onChange={handleMineChange}
              className={selectClass}
            >
              <option value={0}>  -  SELECT - </option>
              {minesList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.descr ?? m.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="shaft-select" className={labelClass}>
              Shaft
            </label>
            <select
              id="shaft-select"
              value={selectedShaftId == null ? "" : selectedShaftId}
              onChange={handleShaftChange}
              className={selectClass}
            >
              <option value={0}>  -  SELECT - </option>
              {shaftsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.descr ?? s.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="section-select" className={labelClass}>
              Section
            </label>
            <select
              id="section-select"
              value={selectedSectionId == null ? "" : selectedSectionId}
              onChange={handleSectionChange}
              className={selectClass}
            >
              <option value={0}>  -  SELECT - </option>
              {sectionsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.descr ?? s.id}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="gang-select" className={labelClass}>
              Gang
            </label>
            <select
              id="gang-select"
              value={selectedGangId == null ? "" : selectedGangId}
              onChange={(e) => setSelectedGangId(e.target.value === "" ? 0 : Number(e.target.value))}
              className={selectClass}
            >
              <option value={0}>  -  SELECT - </option>
              {gangsList.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.descr ?? g.id}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="technician-select"
            className={labelClass}
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
            className={selectClass}
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

      {selectedSerialId && (
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
                  comments ?? "",
                  selectedMineId || null,
                  selectedShaftId || null,
                  selectedSectionId || null,
                  selectedGangId || null
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
                setSelectedId(0);
                setItemsList([]);
                setSelectedSerialId(0);
                setSelectedMineId(0);
                setSelectedShaftId(0);
                setSelectedSectionId(0);
                setSelectedGangId(0);
                setShaftsList([]);
                setSectionsList([]);
                setGangsList([]);
                setSelectedTechnicianId(0);
                setInDate(new Date().toISOString().slice(0, 10));
                setOutDate(new Date().toISOString().slice(0, 10));
                setComments("");
                setGridData([]);
                setQtyByKey({});
                setCheckedByKey({});
                setError(null);
                setSaveError(null);
                setInsertJobResult(null);
              });
            }}
            disabled={savePending}
            className="rounded border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50"
          >
            {savePending ? "Saving…" : "Save Job"}
          </button>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={insertJobResult != null ? String(insertJobResult) : ""}
              className="invisible w-0 max-w-0 h-0 overflow-hidden p-0 border-0"
              placeholder="—"
              aria-label="Insert job result"
            />
          </div>
        </div>
      )}
      {saveError && (
        <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
          {saveError}
        </p>
      )}
    </>
  );
}
