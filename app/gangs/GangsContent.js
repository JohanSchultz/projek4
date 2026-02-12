"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { AllgangsGrid } from "./AllgangsGrid";

const inputClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";
const selectClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";
const checkboxClass =
  "h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-zinc-400";

export function GangsContent({
  mines,
  fetchShaftsByMineId,
  fetchSectionsByShaftId,
  insertGang,
  updateGang,
  fetchAllGangs,
}) {
  const mineList = mines ?? [];
  const [mineId, setMineId] = useState(0);
  const [shaftId, setShaftId] = useState(0);
  const [sectionId, setSectionId] = useState(0);
  const [descr, setDescr] = useState("");
  const [isactive, setIsactive] = useState(true);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [gridData, setGridData] = useState([]);
  const [shaftsList, setShaftsList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [pendingShaftId, setPendingShaftId] = useState(null);
  const [pendingSectionId, setPendingSectionId] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const mineSelectRef = useRef(null);
  const shaftSelectRef = useRef(null);
  const sectionSelectRef = useRef(null);

  const loadGrid = () => {
    if (typeof fetchAllGangs !== "function") return;
    fetchAllGangs().then((res) => {
      setGridData(Array.isArray(res?.data) ? res.data : []);
    });
  };

  useEffect(() => {
    loadGrid();
  }, []);

  useEffect(() => {
    if (typeof fetchShaftsByMineId !== "function") {
      setShaftsList([]);
      return;
    }
    let cancelled = false;
    fetchShaftsByMineId(mineId).then((res) => {
      if (!cancelled && res?.data) setShaftsList(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [mineId, fetchShaftsByMineId]);

  useEffect(() => {
    if (typeof fetchSectionsByShaftId !== "function") {
      setSectionsList([]);
      return;
    }
    let cancelled = false;
    fetchSectionsByShaftId(shaftId).then((res) => {
      if (!cancelled && res?.data) setSectionsList(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, [shaftId, fetchSectionsByShaftId]);

  useEffect(() => {
    setShaftId(0);
  }, [mineId]);

  useEffect(() => {
    setSectionId(0);
  }, [shaftId]);

  useEffect(() => {
    if (pendingShaftId != null && shaftsList.some((s) => s.id === pendingShaftId)) {
      setShaftId(pendingShaftId);
      setPendingShaftId(null);
    }
  }, [shaftsList, pendingShaftId]);

  useEffect(() => {
    if (pendingSectionId != null && sectionsList.some((s) => s.id === pendingSectionId)) {
      setSectionId(pendingSectionId);
      setPendingSectionId(null);
    }
  }, [sectionsList, pendingSectionId]);

  useEffect(() => {
    if (selectedRowId == null || mineSelectRef.current == null) return;
    const sel = mineSelectRef.current;
    const option = sel.options[sel.selectedIndex];
    if (option) option.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedRowId, mineId]);

  useEffect(() => {
    if (selectedRowId == null || shaftSelectRef.current == null) return;
    const sel = shaftSelectRef.current;
    const option = sel.options[sel.selectedIndex];
    if (option) option.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedRowId, shaftId]);

  useEffect(() => {
    if (selectedRowId == null || sectionSelectRef.current == null) return;
    const sel = sectionSelectRef.current;
    const option = sel.options[sel.selectedIndex];
    if (option) option.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedRowId, sectionId]);

  const handleSave = () => {
    setSaveError(null);
    const sid = sectionId === 0 ? null : sectionId;
    if (sid == null) {
      setSaveError("Please select a section.");
      return;
    }
    const trimmedDescr = descr.trim();
    if (!trimmedDescr) {
      setSaveError("Gang is required.");
      return;
    }
    startTransition(async () => {
      const result = await insertGang(sid, trimmedDescr, isactive);
      if (result?.error) {
        setSaveError(result.error);
        return;
      }
      setDescr("");
      loadGrid();
    });
  };

  const handleRowClick = (row) => {
    setSaveError(null);
    setSelectedRowId(row.id ?? null);
    setMineId(row.mine_id ?? 0);
    setPendingShaftId(row.shaft_id ?? 0);
    setPendingSectionId(row.section_id ?? 0);
    setDescr(row.descr ?? row.gang ?? "");
    setIsactive(row.isactive ?? false);
  };

  const handleNew = () => {
    setSaveError(null);
    setSelectedRowId(null);
    setMineId(0);
    setShaftId(0);
    setSectionId(0);
    setPendingShaftId(null);
    setPendingSectionId(null);
    setDescr("");
    setIsactive(true);
  };

  const handleChange = () => {
    if (selectedRowId == null) return;
    setSaveError(null);
    const sid = sectionId === 0 ? null : sectionId;
    if (sid == null) {
      setSaveError("Please select a section.");
      return;
    }
    const trimmedDescr = descr.trim();
    if (!trimmedDescr) {
      setSaveError("Gang is required.");
      return;
    }
    startTransition(async () => {
      const result = await updateGang(
        selectedRowId,
        sid,
        trimmedDescr,
        isactive
      );
      if (result?.error) {
        setSaveError(result.error);
        return;
      }
      loadGrid();
      handleNew();
    });
  };

  const handleDeactivate = () => {
    if (selectedRowId == null) return;
    setSaveError(null);
    startTransition(async () => {
      const result = await updateGang(
        selectedRowId,
        null,
        null,
        false
      );
      if (result?.error) {
        setSaveError(result.error);
        return;
      }
      loadGrid();
      handleNew();
    });
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end gap-6">
        <div>
          <label
            htmlFor="gang-mine"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Mine
          </label>
          <select
            ref={mineSelectRef}
            id="gang-mine"
            value={mineId == null ? "" : mineId}
            onChange={(e) =>
              setMineId(e.target.value === "" ? 0 : Number(e.target.value))
            }
            className={selectClass}
          >
            <option value={0}>   -  SELECT  - </option>
            {mineList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.descr ?? m.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="gang-shaft"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Shaft
          </label>
          <select
            ref={shaftSelectRef}
            id="gang-shaft"
            value={shaftId == null ? "" : shaftId}
            onChange={(e) =>
              setShaftId(e.target.value === "" ? 0 : Number(e.target.value))
            }
            className={selectClass}
          >
            <option value={0}>   -  SELECT  - </option>
            {shaftsList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.descr ?? s.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="gang-section"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Section
          </label>
          <select
            ref={sectionSelectRef}
            id="gang-section"
            value={sectionId == null ? "" : sectionId}
            onChange={(e) =>
              setSectionId(e.target.value === "" ? 0 : Number(e.target.value))
            }
            className={selectClass}
          >
            <option value={0}>   -  SELECT  - </option>
            {sectionsList.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.descr ?? sec.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="gang-descr"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Gang
          </label>
          <input
            type="text"
            id="gang-descr"
            value={descr}
            onChange={(e) => setDescr(e.target.value)}
            className={inputClass}
            placeholder=""
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="gang-active"
            checked={isactive}
            onChange={(e) => setIsactive(e.target.checked)}
            className={checkboxClass}
          />
          <label
            htmlFor="gang-active"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Active
          </label>
        </div>
        <div className="hidden">
          <input
            type="text"
            readOnly
            value={selectedRowId != null ? String(selectedRowId) : ""}
            className="w-20 rounded border border-zinc-300 bg-zinc-50 px-2 py-2 text-sm text-zinc-800 dark:border-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-200"
            placeholder="—"
            aria-label="Selected ID"
          />
        </div>
      </div>
      <hr className="my-4 border-zinc-200 dark:border-zinc-700" />
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className={
            selectedRowId != null
              ? "hidden"
              : "rounded border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50"
          }
        >
          {isPending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={handleNew}
          className={
            selectedRowId == null
              ? "hidden"
              : "rounded border border-sky-300 bg-sky-100 px-4 py-2 text-sm font-medium text-sky-800 shadow-sm hover:bg-sky-200 dark:border-sky-500 dark:bg-sky-900/40 dark:text-sky-200 dark:hover:bg-sky-800/50"
          }
        >
          New
        </button>
        <button
          type="button"
          onClick={handleChange}
          disabled={isPending}
          className={
            selectedRowId == null
              ? "hidden"
              : "rounded border border-amber-300 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800 shadow-sm hover:bg-amber-200 disabled:opacity-50 dark:border-amber-600 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-800/50"
          }
        >
          Change
        </button>
        <button
          type="button"
          onClick={handleDeactivate}
          disabled={isPending}
          className={
            selectedRowId == null
              ? "hidden"
              : "rounded border border-red-300 bg-red-100 px-4 py-2 text-sm font-medium text-red-800 shadow-sm hover:bg-red-200 disabled:opacity-50 dark:border-red-600 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-800/50"
          }
        >
          Deactivate
        </button>
      </div>
      {saveError && (
        <p className="mb-2 text-sm text-amber-600 dark:text-amber-400">
          {saveError}
        </p>
      )}
      <hr className="my-4 border-zinc-200 dark:border-zinc-700" />
      <div>
        <AllgangsGrid data={gridData} onRowClick={handleRowClick} />
      </div>
    </>
  );
}
