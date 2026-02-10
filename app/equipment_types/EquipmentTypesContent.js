"use client";

import { useState, useTransition, useEffect } from "react";
import { AllequipmenttypesGrid } from "./AllequipmenttypesGrid";

const inputClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";
const selectClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";
const checkboxClass =
  "h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-zinc-400";

export function EquipmentTypesContent({
  categories,
  insertEquipmentType,
  fetchAllequipmenttypes,
}) {
  const categoryList = categories ?? [];
  const [categoryId, setCategoryId] = useState(0);
  const [descr, setDescr] = useState("");
  const [isactive, setIsactive] = useState(true);
  const [gridData, setGridData] = useState([]);
  const [saveError, setSaveError] = useState(null);
  const [isPending, startTransition] = useTransition();

  const loadGrid = () => {
    if (typeof fetchAllequipmenttypes !== "function") return;
    fetchAllequipmenttypes().then((res) => {
      setGridData(Array.isArray(res?.data) ? res.data : []);
    });
  };

  useEffect(() => {
    loadGrid();
  }, []);

  const handleSave = () => {
    setSaveError(null);
    const equipmentcategories_id = categoryId === 0 ? null : categoryId;
    if (equipmentcategories_id == null) {
      setSaveError("Please select an equipment category.");
      return;
    }
    startTransition(async () => {
      const result = await insertEquipmentType(
        equipmentcategories_id,
        descr.trim(),
        isactive
      );
      if (result?.error) {
        setSaveError(result.error);
        return;
      }
      setDescr("");
      loadGrid();
    });
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end gap-6">
        <div>
          <label
            htmlFor="equipment-category"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Equipment categories
          </label>
          <select
            id="equipment-category"
            value={categoryId == null ? "" : categoryId}
            onChange={(e) =>
              setCategoryId(e.target.value === "" ? 0 : Number(e.target.value))
            }
            className={selectClass}
          >
            <option value={0}>   -  SELECT  - </option>
            {categoryList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.descr ?? c.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="equipment-type-descr"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Equipment type
          </label>
          <input
            type="text"
            id="equipment-type-descr"
            value={descr}
            onChange={(e) => setDescr(e.target.value)}
            className={inputClass}
            placeholder=""
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="equipment-type-active"
            checked={isactive}
            onChange={(e) => setIsactive(e.target.checked)}
            className={checkboxClass}
          />
          <label
            htmlFor="equipment-type-active"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Active
          </label>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      </div>
      {saveError && (
        <p className="mb-2 text-sm text-amber-600 dark:text-amber-400">
          {saveError}
        </p>
      )}
      <div>
        <AllequipmenttypesGrid data={gridData} />
      </div>
    </>
  );
}
