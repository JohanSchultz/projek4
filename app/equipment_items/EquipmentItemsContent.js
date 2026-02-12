"use client";

import { useState, useTransition, useEffect, useRef } from "react";

const inputClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";
const selectClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";
const checkboxClass =
  "h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-zinc-400";

export function EquipmentItemsContent({
  categories,
  types,
  mines,
  fetchShaftsByMineId,
  fetchSectionsByShaftId,
  fetchGangsBySectionId,
  insertEquipmentItem,
  updateEquipmentItem,
  searchEquipmentItemsBySerial,
  getEquipmentItemById,
}) {
  const categoryList = categories ?? [];
  const typeList = types ?? [];
  const minesList = mines ?? [];
  const [categoryId, setCategoryId] = useState(0);
  const [typeId, setTypeId] = useState(0);
  const [mineId, setMineId] = useState(0);
  const [shaftId, setShaftId] = useState(0);
  const [sectionId, setSectionId] = useState(0);
  const [gangId, setGangId] = useState(0);
  const [shaftsList, setShaftsList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [gangsList, setGangsList] = useState([]);
  const [serialNumber, setSerialNumber] = useState("");
  const [pistonno, setPistonno] = useState("");
  const [isactive, setIsactive] = useState(true);
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const categorySelectRef = useRef(null);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchPopup, setShowSearchPopup] = useState(false);

  const typesForCategory =
    categoryId === 0
      ? typeList
      : typeList.filter(
          (t) => Number(t.equipmentcategories_id) === Number(categoryId)
        );

  useEffect(() => {
    if (selectedRowId == null || categorySelectRef.current == null) return;
    const sel = categorySelectRef.current;
    const option = sel.options[sel.selectedIndex];
    if (option) option.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedRowId, categoryId]);

  useEffect(() => {
    if (typeof fetchShaftsByMineId !== "function") {
      setShaftsList([]);
      return;
    }
    let cancelled = false;
    fetchShaftsByMineId(mineId).then((res) => {
      if (!cancelled && res?.data) setShaftsList(res.data);
    });
    return () => { cancelled = true; };
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
    return () => { cancelled = true; };
  }, [shaftId, fetchSectionsByShaftId]);

  useEffect(() => {
    if (typeof fetchGangsBySectionId !== "function") {
      setGangsList([]);
      return;
    }
    let cancelled = false;
    fetchGangsBySectionId(sectionId).then((res) => {
      if (!cancelled && res?.data) setGangsList(res.data);
    });
    return () => { cancelled = true; };
  }, [sectionId, fetchGangsBySectionId]);

  const handleSave = () => {
    setSaveError(null);
    const equipmenttypes_id = typeId === 0 ? null : typeId;
    if (equipmenttypes_id == null) {
      setSaveError("Please select an equipment type.");
      return;
    }
    if (mineId === 0) {
      setSaveError("Please select a Mine.");
      return;
    }
    if (shaftId === 0) {
      setSaveError("Please select a Shaft.");
      return;
    }
    if (sectionId === 0) {
      setSaveError("Please select a Section.");
      return;
    }
    if (!serialNumber.trim()) {
      setSaveError("Serial Number is required.");
      return;
    }
    startTransition(async () => {
      const result = await insertEquipmentItem(
        equipmenttypes_id,
        mineId === 0 ? null : mineId,
        shaftId === 0 ? null : shaftId,
        sectionId === 0 ? null : sectionId,
        gangId === 0 ? null : gangId,
        serialNumber.trim(),
        pistonno,
        isactive
      );
      if (result?.error) {
        setSaveError(result.error);
        return;
      }
      setSerialNumber("");
      setTypeId(0);
      setCategoryId(0);
      setMineId(0);
      setShaftId(0);
      setSectionId(0);
      setGangId(0);
      setIsactive(true);
    });
  };

  const handleSearchClick = () => {
    const term = serialNumber.trim();
    if (term.length < 2) return;
    if (typeof searchEquipmentItemsBySerial !== "function") return;
    searchEquipmentItemsBySerial(term).then((res) => {
      setSearchResults(Array.isArray(res?.data) ? res.data : []);
      setShowSearchPopup(true);
    });
  };

  const handleSelectSerial = async (row) => {
    setShowSearchPopup(false);
    const id = row?.id;
    if (id == null || typeof getEquipmentItemById !== "function") {
      setSerialNumber(row?.serialno ?? row?.serial_no ?? "");
      setPistonno("");
      return;
    }
    const res = await getEquipmentItemById(id);
    const record = res?.data;
    if (!record) {
      setSerialNumber(row?.serialno ?? row?.serial_no ?? "");
      setPistonno("");
      return;
    }
    const tid = record.equipmenttypes_id ?? 0;
    setTypeId(tid);
    const typeRow = typeList.find((t) => Number(t.id) === Number(tid));
    setCategoryId(typeRow?.equipmentcategories_id ?? 0);
    setMineId(record.mine_id ?? 0);
    setShaftId(record.shaft_id ?? 0);
    setSectionId(record.section_id ?? 0);
    setGangId(record.gang_id ?? 0);
    setSerialNumber(record.serialno ?? record.serial_number ?? "");
    setPistonno(record.pistonno ?? "");
    setIsactive(record.isactive ?? false);
    setSelectedRowId(record.id ?? null);
  };

  const handleNew = () => {
    setSaveError(null);
    setSelectedRowId(null);
    setCategoryId(0);
    setTypeId(0);
    setMineId(0);
    setShaftId(0);
    setSectionId(0);
    setGangId(0);
    setSerialNumber("");
    setPistonno("");
    setIsactive(true);
  };

  const handleChange = () => {
    if (selectedRowId == null) return;
    setSaveError(null);
    const equipmenttypes_id = typeId === 0 ? null : typeId;
    if (equipmenttypes_id == null) {
      setSaveError("Please select an equipment type.");
      return;
    }
    if (mineId === 0) {
      setSaveError("Please select a Mine.");
      return;
    }
    if (shaftId === 0) {
      setSaveError("Please select a Shaft.");
      return;
    }
    if (sectionId === 0) {
      setSaveError("Please select a Section.");
      return;
    }
    if (!serialNumber.trim()) {
      setSaveError("Serial Number is required.");
      return;
    }
    startTransition(async () => {
      const result = await updateEquipmentItem(
        selectedRowId,
        equipmenttypes_id,
        mineId === 0 ? null : mineId,
        shaftId === 0 ? null : shaftId,
        sectionId === 0 ? null : sectionId,
        gangId === 0 ? null : gangId,
        serialNumber.trim(),
        pistonno,
        isactive
      );
      if (result?.error) {
        setSaveError(result.error);
        return;
      }
      handleNew();
    });
  };

  const handleDeactivate = () => {
    if (selectedRowId == null) return;
    setSaveError(null);
    startTransition(async () => {
      const result = await updateEquipmentItem(
        selectedRowId,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        false
      );
      if (result?.error) {
        setSaveError(result.error);
        return;
      }
      handleNew();
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
          aria-label="Search serial numbers"
        >
          <div
            className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Select a serial number
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-4 border-b border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              <span>Serial number</span>
              <span>Equipment type</span>
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
                      onClick={() => handleSelectSerial(row)}
                      className="grid w-full grid-cols-[1fr_auto] gap-4 rounded px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      <span className="min-w-0 truncate">
                        {row.serialno ?? row.serial_no ?? "—"}
                      </span>
                      <span className="shrink-0 text-zinc-600 dark:text-zinc-300">
                        {row.equipmenttypes?.descr ?? "—"}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      )}
      <div className="mb-6 flex flex-wrap items-end gap-6">
        <div>
          <label
            htmlFor="equipment-category"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Equipment categories
          </label>
          <select
            ref={categorySelectRef}
            id="equipment-category"
            value={categoryId == null ? "" : categoryId}
            onChange={(e) => {
              const v = e.target.value === "" ? 0 : Number(e.target.value);
              setCategoryId(v);
              setTypeId(0);
            }}
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
            htmlFor="equipment-type"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Equipment types
          </label>
          <select
            id="equipment-type"
            value={typeId == null ? "" : typeId}
            onChange={(e) =>
              setTypeId(e.target.value === "" ? 0 : Number(e.target.value))
            }
            className={selectClass}
          >
            <option value={0}>   -  SELECT  - </option>
            {typesForCategory.map((t) => (
              <option key={t.id} value={t.id}>
                {t.descr ?? t.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="equipment-item-mine"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Mine
          </label>
          <select
            id="equipment-item-mine"
            value={mineId == null ? "" : mineId}
            onChange={(e) => {
              const v = e.target.value === "" ? 0 : Number(e.target.value);
              setMineId(v);
              setShaftId(0);
              setSectionId(0);
              setGangId(0);
            }}
            className={selectClass}
          >
            <option value={0}>   -  SELECT  - </option>
            {minesList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.descr ?? m.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="equipment-item-shaft"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Shaft
          </label>
          <select
            id="equipment-item-shaft"
            value={shaftId == null ? "" : shaftId}
            onChange={(e) => {
              const v = e.target.value === "" ? 0 : Number(e.target.value);
              setShaftId(v);
              setSectionId(0);
              setGangId(0);
            }}
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
            htmlFor="equipment-item-section"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Section
          </label>
          <select
            id="equipment-item-section"
            value={sectionId == null ? "" : sectionId}
            onChange={(e) => {
              const v = e.target.value === "" ? 0 : Number(e.target.value);
              setSectionId(v);
              setGangId(0);
            }}
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
            htmlFor="equipment-item-gang"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Gang
          </label>
          <select
            id="equipment-item-gang"
            value={gangId == null ? "" : gangId}
            onChange={(e) =>
              setGangId(e.target.value === "" ? 0 : Number(e.target.value))
            }
            className={selectClass}
          >
            <option value={0}>   -  SELECT  - </option>
            {gangsList.map((g) => (
              <option key={g.id} value={g.id}>
                {g.descr ?? g.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="serial-number"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Serial Number
          </label>
          <input
            type="text"
            id="serial-number"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            className={inputClass}
            placeholder=""
          />
        </div>
        <div className="flex items-end gap-1">
          <button
            type="button"
            onClick={handleSearchClick}
            disabled={serialNumber.trim().length < 2}
            className="rounded border border-zinc-300 bg-white px-2 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            Search &gt;&gt;
          </button>
        </div>
        <div>
          <label
            htmlFor="pistonno"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Piston Number
          </label>
          <input
            type="text"
            id="pistonno"
            value={pistonno}
            onChange={(e) => setPistonno(e.target.value)}
            className={inputClass}
            placeholder=""
          />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="equipment-item-active"
            checked={isactive}
            onChange={(e) => setIsactive(e.target.checked)}
            className={checkboxClass}
          />
          <label
            htmlFor="equipment-item-active"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Active
          </label>
        </div>
        <div className="hidden">
          <label htmlFor="equipment-item-id">id</label>
          <input
            type="text"
            id="equipment-item-id"
            readOnly
            value={selectedRowId != null ? String(selectedRowId) : ""}
            aria-label="id"
          />
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
    </>
  );
}
