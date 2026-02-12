"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { AllsectionsGrid } from "./AllsectionsGrid";

const inputClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";
const selectClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";
const checkboxClass =
  "h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-zinc-400";

export function SectionsContent({
  mines,
  fetchShaftsByMineId,
  insertSection,
  updateSection,
  fetchAllSections,
}) {
  const mineList = mines ?? [];
  const [mineId, setMineId] = useState(0);
  const [shaftId, setShaftId] = useState(0);
  const [descr, setDescr] = useState("");
  const [costcode, setCostcode] = useState("");
  const [isactive, setIsactive] = useState(true);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [gridData, setGridData] = useState([]);
  const [shaftsList, setShaftsList] = useState([]);
  const [pendingShaftId, setPendingShaftId] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const mineSelectRef = useRef(null);
  const shaftSelectRef = useRef(null);

  const loadGrid = () => {
    if (typeof fetchAllSections !== "function") return;
    fetchAllSections().then((res) => {
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
    setShaftId(0);
  }, [mineId]);

  useEffect(() => {
    if (pendingShaftId != null && shaftsList.some((s) => s.id === pendingShaftId)) {
      setShaftId(pendingShaftId);
      setPendingShaftId(null);
    }
  }, [shaftsList, pendingShaftId]);

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

  const handleSave = () => {
    setSaveError(null);
    const sid = shaftId === 0 ? null : shaftId;
    if (sid == null) {
      setSaveError("Please select a shaft.");
      return;
    }
    const trimmedDescr = descr.trim();
    if (!trimmedDescr) {
      setSaveError("Section is required.");
      return;
    }
    startTransition(async () => {
      const result = await insertSection(
        sid,
        trimmedDescr,
        costcode.trim(),
        isactive
      );
      if (result?.error) {
        setSaveError(result.error);
        return;
      }
      setDescr("");
      setCostcode("");
      loadGrid();
    });
  };

  const handleRowClick = (row) => {
    setSaveError(null);
    setSelectedRowId(row.id ?? null);
    setMineId(row.mine_id ?? 0);
    setPendingShaftId(row.shaft_id ?? 0);
    setDescr(row.descr ?? row.section ?? "");
    setCostcode(row.costcode ?? "");
    setIsactive(row.isactive ?? false);
  };

  const handleNew = () => {
    setSaveError(null);
    setSelectedRowId(null);
    setMineId(0);
    setShaftId(0);
    setPendingShaftId(null);
    setDescr("");
    setCostcode("");
    setIsactive(true);
  };

  const handleChange = () => {
    if (selectedRowId == null) return;
    setSaveError(null);
    const sid = shaftId === 0 ? null : shaftId;
    if (sid == null) {
      setSaveError("Please select a shaft.");
      return;
    }
    const trimmedDescr = descr.trim();
    if (!trimmedDescr) {
      setSaveError("Section is required.");
      return;
    }
    startTransition(async () => {
      const result = await updateSection(
        selectedRowId,
        sid,
        trimmedDescr,
        costcode.trim(),
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
      const result = await updateSection(
        selectedRowId,
        null,
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
            htmlFor="section-mine"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Mine
          </label>
          <select
            ref={mineSelectRef}
            id="section-mine"
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
            htmlFor="section-shaft"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Shaft
          </label>
          <select
            ref={shaftSelectRef}
            id="section-shaft"
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
            htmlFor="section-descr"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Section
          </label>
          <input
            type="text"
            id="section-descr"
            value={descr}
            onChange={(e) => setDescr(e.target.value)}
            className={inputClass}
            placeholder=""
          />
        </div>
        <div>
          <label
            htmlFor="section-costcode"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Cost Code
          </label>
          <input
            type="text"
            id="section-costcode"
            value={costcode}
            onChange={(e) => setCostcode(e.target.value)}
            className={inputClass}
            placeholder=""
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="section-active"
            checked={isactive}
            onChange={(e) => setIsactive(e.target.checked)}
            className={checkboxClass}
          />
          <label
            htmlFor="section-active"
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
        <AllsectionsGrid data={gridData} onRowClick={handleRowClick} />
      </div>
    </>
  );
}
