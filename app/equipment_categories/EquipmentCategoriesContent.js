"use client";

import { useState, useTransition, useEffect } from "react";
import { EquipmentcategoriesGrid } from "./EquipmentcategoriesGrid";

const inputClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";
const checkboxClass =
  "h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-zinc-400";

export function EquipmentCategoriesContent({
  insertEquipmentCategory,
  updateEquipmentCategory,
  fetchAllEquipmentCategories,
}) {
  const [descr, setDescr] = useState("");
  const [isactive, setIsactive] = useState(true);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [gridData, setGridData] = useState([]);
  const [saveError, setSaveError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const loadGrid = () => {
    if (typeof fetchAllEquipmentCategories !== "function") return;
    fetchAllEquipmentCategories().then((res) => {
      setGridData(Array.isArray(res?.data) ? res.data : []);
    });
  };

  useEffect(() => {
    loadGrid();
  }, []);

  const handleSave = () => {
    setSaveError(null);
    const trimmedDescr = descr.trim();
    if (!trimmedDescr) {
      setSaveError("Equipment category is required.");
      return;
    }
    startTransition(async () => {
      const result = await insertEquipmentCategory(trimmedDescr, isactive);
      if (result?.error) {
        setSaveError(result.error);
        return;
      }
      setDescr("");
      setIsactive(true);
      loadGrid();
    });
  };

  const handleRowClick = (row) => {
    setSaveError(null);
    setSelectedRowId(row.id ?? null);
    setDescr(row.descr ?? "");
    setIsactive(row.isactive ?? false);
  };

  const handleNew = () => {
    setSaveError(null);
    setSelectedRowId(null);
    setDescr("");
    setIsactive(true);
  };

  const handleChange = () => {
    if (selectedRowId == null) return;
    setSaveError(null);
    const trimmedDescr = descr.trim();
    if (!trimmedDescr) {
      setSaveError("Equipment category is required.");
      return;
    }
    startTransition(async () => {
      const result = await updateEquipmentCategory(
        selectedRowId,
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
      const result = await updateEquipmentCategory(
        selectedRowId,
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
            htmlFor="equipment-categories-descr"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Equipment category
          </label>
          <input
            type="text"
            id="equipment-categories-descr"
            value={descr}
            onChange={(e) => setDescr(e.target.value)}
            className={inputClass}
            placeholder=""
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="equipment-category-active"
            checked={isactive}
            onChange={(e) => setIsactive(e.target.checked)}
            className={checkboxClass}
          />
          <label
            htmlFor="equipment-category-active"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Active
          </label>
        </div>
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
      <div>
        <EquipmentcategoriesGrid data={gridData} onRowClick={handleRowClick} />
      </div>
    </>
  );
}
