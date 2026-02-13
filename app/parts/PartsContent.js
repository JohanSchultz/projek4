"use client";

import { useState, useTransition } from "react";

const inputClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";

const labelClass =
  "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";

const searchBtnClass =
  "shrink-0 rounded-r border border-l-0 border-zinc-300 bg-white px-2 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700";

const checkboxClass =
  "h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-zinc-400";

const twoDecimalPattern = /^\d*\.?\d{0,2}$/;
const integerPattern = /^\d*$/;

function handleDecimalChange(value, setter) {
  if (value === "" || twoDecimalPattern.test(value)) setter(value);
}

function handleIntegerChange(value, setter) {
  if (value === "" || integerPattern.test(value)) setter(value);
}

export function PartsContent({ equipmentTypes = [], insertPart, insertPartsPerType, deletePartsPerTypeByPartId, updatePart, searchPartsByStockCode, searchPartsByDescription, getPartsPerTypeByPartId }) {
  const typeList = equipmentTypes ?? [];
  const [stockCode, setStockCode] = useState("");
  const [description, setDescription] = useState("");
  const [matCatNumber, setMatCatNumber] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [resellingPrice, setResellingPrice] = useState("");
  const [binNumber, setBinNumber] = useState("");
  const [stockLevel, setStockLevel] = useState("");
  const [reorderLevel, setReorderLevel] = useState("");
  const [isactive, setIsactive] = useState(true);
  const [selectedTypeIds, setSelectedTypeIds] = useState(() => new Set());
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSearchPnClick = () => {
    const prefix = stockCode.trim();
    if (prefix.length < 2) return;
    setSaveError(null);
    if (typeof searchPartsByStockCode !== "function") return;
    searchPartsByStockCode(prefix).then((res) => {
      setSearchResults(Array.isArray(res?.data) ? res.data : []);
      setShowSearchPopup(true);
    });
  };

  const handleSearchdClick = () => {
    const prefix = description.trim();
    if (prefix.length < 3) return;
    setSaveError(null);
    if (typeof searchPartsByDescription !== "function") return;
    searchPartsByDescription(prefix).then((res) => {
      setSearchResults(Array.isArray(res?.data) ? res.data : []);
      setShowSearchPopup(true);
    });
  };

  const handleSelectPart = (row) => {
    setShowSearchPopup(false);
    const partId = row.id ?? null;
    setSelectedRowId(partId);
    setStockCode(row.stockcode != null ? String(row.stockcode) : "");
    setDescription(row.part != null ? String(row.part) : "");
    setMatCatNumber(row.matcatno != null ? String(row.matcatno) : "");
    const pp = row.lastpurchaseprice;
    setPurchasePrice(pp != null && pp !== "" ? (typeof pp === "number" ? pp.toFixed(2) : String(pp)) : "");
    const cp = row.costa;
    setResellingPrice(cp != null && cp !== "" ? (typeof cp === "number" ? cp.toFixed(2) : String(cp)) : "");
    setBinNumber(row.binno != null ? String(row.binno) : "");
    const sl = row.stocklevel;
    setStockLevel(sl != null && sl !== "" ? String(Math.floor(Number(sl)) || "") : "");
    const rl = row.reorder;
    setReorderLevel(rl != null && rl !== "" ? String(Math.floor(Number(rl)) || "") : "");
    setIsactive(row.isactive ?? false);
    if (partId != null && typeof getPartsPerTypeByPartId === "function") {
      getPartsPerTypeByPartId(partId).then((res) => {
        const list = Array.isArray(res?.data) ? res.data : [];
        const typeIdValues = list.map((r) => r.typeid).filter((id) => id != null);
        setSelectedTypeIds(new Set(typeIdValues));
      });
    } else {
      setSelectedTypeIds(new Set());
    }
  };

  const handleSave = () => {
    setSaveError(null);
    if (!stockCode.trim()) {
      setSaveError("Stock Code is required.");
      return;
    }
    if (!description.trim()) {
      setSaveError("Description is required.");
      return;
    }
    startTransition(async () => {
      if (typeof insertPart !== "function") return;
      const result = await insertPart(
        stockCode,
        description,
        matCatNumber,
        purchasePrice,
        resellingPrice,
        binNumber,
        stockLevel,
        reorderLevel,
        isactive
      );
      if (result?.error) {
        setSaveError(result.error);
        return;
      }
      const newPartId = result?.data?.id;
      if (newPartId != null && selectedTypeIds.size > 0 && typeof insertPartsPerType === "function") {
        const typeIdArray = Array.from(selectedTypeIds);
        const partsPerTypeResult = await insertPartsPerType(newPartId, typeIdArray);
        if (partsPerTypeResult?.error) {
          setSaveError(partsPerTypeResult.error);
          return;
        }
      }
      setStockCode("");
      setDescription("");
      setMatCatNumber("");
      setPurchasePrice("");
      setResellingPrice("");
      setBinNumber("");
      setStockLevel("");
      setReorderLevel("");
      setSelectedTypeIds(new Set());
    });
  };

  const handleNew = () => {
    setSaveError(null);
    setSelectedRowId(null);
    setStockCode("");
    setDescription("");
    setMatCatNumber("");
    setPurchasePrice("");
    setResellingPrice("");
    setBinNumber("");
    setStockLevel("");
    setReorderLevel("");
    setIsactive(true);
    setSelectedTypeIds(new Set());
  };

  const handleChange = () => {
    if (selectedRowId == null) return;
    setSaveError(null);
    if (!stockCode.trim()) {
      setSaveError("Stock Code is required.");
      return;
    }
    if (!description.trim()) {
      setSaveError("Description is required.");
      return;
    }
    startTransition(async () => {
      if (typeof updatePart !== "function") return;
      const result = await updatePart(
        selectedRowId,
        stockCode,
        description,
        matCatNumber,
        purchasePrice,
        resellingPrice,
        binNumber,
        stockLevel,
        reorderLevel,
        isactive
      );
      if (result?.error) {
        setSaveError(result.error);
        return;
      }
      const partId = selectedRowId;
      if (partId != null && typeof deletePartsPerTypeByPartId === "function") {
        const deleteResult = await deletePartsPerTypeByPartId(partId);
        if (deleteResult?.error) {
          setSaveError(deleteResult.error);
          return;
        }
      }
      if (partId != null && selectedTypeIds.size > 0 && typeof insertPartsPerType === "function") {
        const typeIdArray = Array.from(selectedTypeIds);
        const partsPerTypeResult = await insertPartsPerType(partId, typeIdArray);
        if (partsPerTypeResult?.error) {
          setSaveError(partsPerTypeResult.error);
          return;
        }
      }
      handleNew();
    });
  };

  const handleDeactivate = () => {
    if (selectedRowId == null) return;
    setSaveError(null);
    startTransition(async () => {
      if (typeof updatePart !== "function") return;
      const result = await updatePart(
        selectedRowId,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        false
      );
      if (result?.error) {
        setSaveError(result.error);
        return;
      }
      handleNew();
    });
  };

  const toggleEquipmentType = (id) => {
    setSelectedTypeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
    {showSearchPopup && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        onClick={() => setShowSearchPopup(false)}
        role="dialog"
        aria-modal="true"
        aria-label="Search parts by stock code"
      >
        <div
          className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="border-b border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            Select a part
          </div>
          <div className="grid grid-cols-[1fr_1fr] gap-4 border-b border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            <span>Stock code</span>
            <span>Part</span>
          </div>
          <ul className="max-h-[60vh] overflow-y-auto p-2">
            {searchResults.length === 0 ? (
              <li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                No matches found.
              </li>
            ) : (
              searchResults.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectPart(row)}
                    className="grid w-full grid-cols-[1fr_1fr] gap-4 rounded px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    <span className="min-w-0 truncate">
                      {row.stockcode ?? "—"}
                    </span>
                    <span className="min-w-0 truncate text-zinc-600 dark:text-zinc-300">
                      {row.part ?? "—"}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    )}
    <div className="flex gap-6 items-start">
    <div className="flex-[2] flex flex-wrap items-end gap-6">
      <div>
        <label htmlFor="parts-stock-code" className={labelClass}>
          Stock Code
        </label>
        <div className="flex items-center gap-0">
          <input
            type="text"
            id="parts-stock-code"
            value={stockCode}
            onChange={(e) => setStockCode(e.target.value)}
            className={inputClass + " rounded-r-none"}
            placeholder=""
          />
          <button
            type="button"
            onClick={handleSearchPnClick}
            disabled={stockCode.trim().length < 2}
            className={searchBtnClass + " disabled:opacity-50"}
            aria-label="Search by part number"
          >
            Search &gt;&gt;
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="parts-description" className={labelClass}>
          Description
        </label>
        <div className="flex items-center gap-0">
          <input
            type="text"
            id="parts-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass + " rounded-r-none"}
            placeholder=""
          />
          <button
            type="button"
            onClick={handleSearchdClick}
            disabled={description.trim().length < 3}
            className={searchBtnClass + " disabled:opacity-50"}
            aria-label="Search by description"
          >
            Search &gt;&gt;
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="parts-mat-cat-number" className={labelClass}>
          Mat Cat Number
        </label>
        <input
          type="text"
          id="parts-mat-cat-number"
          value={matCatNumber}
          onChange={(e) => setMatCatNumber(e.target.value)}
          className={inputClass}
          placeholder=""
        />
      </div>
      <div>
        <label htmlFor="parts-purchase-price" className={labelClass}>
          Purchase Price
        </label>
        <input
          type="text"
          id="parts-purchase-price"
          value={purchasePrice}
            onChange={(e) => handleDecimalChange(e.target.value, setPurchasePrice)}
          className={inputClass}
          placeholder=""
        />
      </div>
      <div>
        <label htmlFor="parts-reselling-price" className={labelClass}>
          Reselling Price
        </label>
        <input
          type="text"
          id="parts-reselling-price"
          value={resellingPrice}
            onChange={(e) => handleDecimalChange(e.target.value, setResellingPrice)}
          className={inputClass}
          placeholder=""
        />
      </div>
      <div>
        <label htmlFor="parts-bin-number" className={labelClass}>
          Bin Number
        </label>
        <input
          type="text"
          id="parts-bin-number"
          value={binNumber}
          onChange={(e) => setBinNumber(e.target.value)}
          className={inputClass}
          placeholder=""
        />
      </div>
      <div>
        <label htmlFor="parts-stock-level" className={labelClass}>
          Stock level
        </label>
        <input
          type="text"
          id="parts-stock-level"
          value={stockLevel}
            onChange={(e) => handleIntegerChange(e.target.value, setStockLevel)}
          className={inputClass}
          placeholder=""
        />
      </div>
      <div>
        <label htmlFor="parts-reorder-level" className={labelClass}>
          Reorder Level
        </label>
        <input
          type="text"
          id="parts-reorder-level"
          value={reorderLevel}
            onChange={(e) => handleIntegerChange(e.target.value, setReorderLevel)}
          className={inputClass}
          placeholder=""
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="parts-active"
          checked={isactive}
          onChange={(e) => setIsactive(e.target.checked)}
          className={checkboxClass}
        />
        <label
          htmlFor="parts-active"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Active
        </label>
      </div>
      <div className="hidden">
        <label htmlFor="parts-id" className={labelClass}>
          id
        </label>
        <input
          type="text"
          id="parts-id"
          readOnly
          value={selectedRowId != null ? String(selectedRowId) : ""}
          className={inputClass + " bg-zinc-50 dark:bg-zinc-800/50"}
          placeholder="—"
          aria-label="Selected part id"
        />
      </div>
    </div>
    <div className="flex-1 min-w-0 shrink-0 rounded border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
      <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Equipment types
      </p>
      <ul className="flex flex-col gap-y-2">
        {typeList.map((et) => (
          <li key={et.id} className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`parts-et-${et.id}`}
              checked={selectedTypeIds.has(et.id)}
              onChange={() => toggleEquipmentType(et.id)}
              className={checkboxClass}
            />
            <label
              htmlFor={`parts-et-${et.id}`}
              className="cursor-pointer text-sm text-zinc-800 dark:text-zinc-200"
            >
              {et.descr ?? et.id}
            </label>
          </li>
        ))}
      </ul>
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
      <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
        {saveError}
      </p>
    )}
    </>
  );
}
