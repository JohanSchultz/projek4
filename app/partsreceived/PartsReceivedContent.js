"use client";

import { useState, useEffect } from "react";
import { formatDateDdMmmYyyy } from "@/lib/export-utils";

const inputClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";
const selectClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";
const labelClass =
  "mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300";
const narrowButtonClass =
  "rounded border border-zinc-300 bg-zinc-100 px-2 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600";
const invisibleInputClass =
  "w-0 max-w-0 h-0 p-0 overflow-hidden invisible border-0";
const invisibleColClass =
  "w-0 max-w-0 p-0 overflow-hidden invisible border-0";
const gridThClass =
  "border-b border-zinc-200 bg-zinc-100 px-4 py-3 font-semibold text-left text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
const gridTdClass = "border-b border-zinc-200 px-4 py-3 text-sm text-zinc-800 dark:border-zinc-700 dark:text-zinc-200";

function formatGridValue(value) {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value))) {
    try {
      return new Date(value).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
    } catch {
      return String(value);
    }
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function columnHeader(key) {
  const labels = {
    part_id: "Part Id",
    stockcode: "Part No.",
    matcatno: "Alt. Part No.",
    waybillno: "Waybill No.",
    unitcost: "Unit Cost",
    part: "Description",
    datein: "Date In",
  };
  return labels[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PartsReceivedContent({
  suppliers = [],
  fetchPartsByStockCodePrefix,
  fetchPartsByPartPrefix,
  fetchPartsTakeOn,
  insertPartTakeOn,
  deletePartStockInRecord,
  decrementPartStockLevel,
}) {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [partNo, setPartNo] = useState("");
  const [description, setDescription] = useState("");
  const [partId, setPartId] = useState("");
  const [selectedRowId, setSelectedRowId] = useState("");
  const [alternativeNo, setAlternativeNo] = useState("");
  const [waybillNo, setWaybillNo] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [quantity, setQuantity] = useState("");
  const [dateIn, setDateIn] = useState(() => new Date().toISOString().slice(0, 10));
  const [supplierId, setSupplierId] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupRows, setPopupRows] = useState([]);
  const [popupLoading, setPopupLoading] = useState(false);
  const [gridData, setGridData] = useState([]);
  const [gridLoading, setGridLoading] = useState(false);
  const [gridError, setGridError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [savePending, setSavePending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);

  const handleUnitCostChange = (e) => {
    const v = e.target.value;
    if (v === "" || /^\d*\.?\d{0,2}$/.test(v)) setUnitCost(v);
  };

  const handleQuantityChange = (e) => {
    const v = e.target.value;
    if (v === "" || /^\d*$/.test(v)) setQuantity(v);
  };

  const handlePartNoLookup = () => {
    setPopupLoading(true);
    setShowPopup(true);
    setPopupRows([]);
    (fetchPartsByStockCodePrefix ?? (() => Promise.resolve({ data: [] })))(partNo).then((res) => {
      setPopupRows(Array.isArray(res?.data) ? res.data : []);
      setPopupLoading(false);
    });
  };

  const handleDescriptionLookup = () => {
    setPopupLoading(true);
    setShowPopup(true);
    setPopupRows([]);
    (fetchPartsByPartPrefix ?? (() => Promise.resolve({ data: [] })))(description).then((res) => {
      setPopupRows(Array.isArray(res?.data) ? res.data : []);
      setPopupLoading(false);
    });
  };

  const handlePopupSelect = (row) => {
    setPartNo(row?.stockcode ?? "");
    setDescription(row?.part ?? "");
    setPartId(row?.id != null ? String(row.id) : "");
    setShowPopup(false);
  };

  const suppliersList = Array.isArray(suppliers) ? suppliers : [];

  const loadGrid = () => {
    if (typeof fetchPartsTakeOn !== "function") return;
    setGridLoading(true);
    setGridError(null);
    const dateVal = month ? `${month}-01` : null;
    fetchPartsTakeOn(dateVal ?? month).then((res) => {
      if (res?.error) {
        setGridError(res.error);
        setGridData([]);
      } else {
        setGridData(Array.isArray(res?.data) ? res.data : []);
      }
      setGridLoading(false);
    });
  };

  useEffect(() => {
    loadGrid();
  }, [month, fetchPartsTakeOn]);

  const handleNew = () => {
    setPartNo("");
    setDescription("");
    setPartId("");
    setSelectedRowId("");
    setAlternativeNo("");
    setWaybillNo("");
    setUnitCost("");
    setQuantity("");
    setMonth(new Date().toISOString().slice(0, 7));
    setDateIn(new Date().toISOString().slice(0, 10));
    setSupplierId(0);
    setShowDelete(false);
    setSaveError(null);
  };

  const handleGridRowSelect = (row) => {
    if (!row) return;
    setPartNo(row.stockcode ?? "");
    setDescription(row.part ?? "");
    setPartId(row.part_id != null ? String(row.part_id) : "");
    setSelectedRowId(row.id != null ? String(row.id) : "");
    setAlternativeNo(row.matcatno ?? "");
    setWaybillNo(row.waybillno ?? "");
    setUnitCost(row.unitcost != null ? String(row.unitcost) : "");
    setQuantity(row.qty != null ? String(row.qty) : "");
    const supplierVal = row.supplier_id ?? row.suppliers_id ?? row.supplierid;
    setSupplierId(supplierVal != null ? Number(supplierVal) : 0);
    const d = row.datein;
    if (d != null) {
      try {
        const dateObj = typeof d === "string" ? new Date(d) : d;
        setDateIn(dateObj.toISOString().slice(0, 10));
      } catch {
        setDateIn(new Date().toISOString().slice(0, 10));
      }
    } else {
      setDateIn(new Date().toISOString().slice(0, 10));
    }
    setShowDelete(true);
  };

  const handleDelete = () => {
    setSaveError(null);
    if (!selectedRowId) return;
    setDeletePending(true);
    const doDelete = async () => {
      const delRes = await (deletePartStockInRecord ?? (() => Promise.resolve({ error: null })))(selectedRowId);
      if (delRes?.error) {
        setSaveError(delRes.error);
        setDeletePending(false);
        return;
      }
      const decRes = await (decrementPartStockLevel ?? (() => Promise.resolve({ error: null })))(partId, quantity);
      if (decRes?.error) {
        setSaveError(decRes.error);
        setDeletePending(false);
        return;
      }
      setDeletePending(false);
      handleNew();
      loadGrid();
    };
    doDelete();
  };

  const handleSave = () => {
    setSaveError(null);

    const partIdNum = partId != null && partId !== "" ? Number(partId) : 0;
    if (!partId || partIdNum === 0) {
      setSaveError("Please select a part (Part No / Description).");
      return;
    }
    if (!waybillNo || String(waybillNo).trim() === "") {
      setSaveError("Waybill No is required.");
      return;
    }
    const qtyNum = quantity != null && quantity !== "" ? Number(quantity) : 0;
    if (quantity === "" || quantity == null || qtyNum === 0) {
      setSaveError("Quantity must be a non-zero value.");
      return;
    }

    setSavePending(true);
    (insertPartTakeOn ?? (() => Promise.resolve({ error: null })))(
      partId || null,
      dateIn || null,
      waybillNo || null,
      supplierId || null,
      unitCost || null,
      quantity || null
    ).then((res) => {
      setSavePending(false);
      if (res?.error) {
        setSaveError(res.error);
      } else {
        loadGrid();
      }
    });
  };

  return (
    <div className="mb-6 flex flex-col gap-6">
      {/* Invisible part_id textbox */}
      <input
        type="text"
        id="partsreceived-partid"
        value={partId}
        readOnly
        aria-hidden
        className={invisibleInputClass}
        tabIndex={-1}
      />
      {/* Invisible id textbox (selected grid row id) */}
      <input
        type="text"
        id="partsreceived-id"
        value={selectedRowId}
        readOnly
        aria-hidden
        className={invisibleInputClass}
        tabIndex={-1}
      />

      {/* Row 1: Month only */}
      <div>
        <label htmlFor="partsreceived-month" className={labelClass}>
          Month
        </label>
        <input
          type="month"
          id="partsreceived-month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Row 2: Part No, Alternative No, Waybill No, Unit Cost */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="partsreceived-partno" className={labelClass}>
            Part No
          </label>
          <div className="flex items-center gap-0.5">
            <input
              type="text"
              id="partsreceived-partno"
              value={partNo}
              onChange={(e) => setPartNo(e.target.value)}
              className={inputClass}
              placeholder=""
            />
            <button
              type="button"
              onClick={handlePartNoLookup}
              className={narrowButtonClass}
              aria-label="Part No lookup"
            >
              &gt;&gt;
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="partsreceived-alternativeno" className={labelClass}>
            Alternative No
          </label>
          <input
            type="text"
            id="partsreceived-alternativeno"
            value={alternativeNo}
            onChange={(e) => setAlternativeNo(e.target.value)}
            className={inputClass}
            placeholder=""
          />
        </div>
        <div>
          <label htmlFor="partsreceived-waybillno" className={labelClass}>
            Waybill No
          </label>
          <input
            type="text"
            id="partsreceived-waybillno"
            value={waybillNo}
            onChange={(e) => setWaybillNo(e.target.value)}
            className={inputClass}
            placeholder=""
          />
        </div>
        <div>
          <label htmlFor="partsreceived-unitcost" className={labelClass}>
            Unit Cost
          </label>
          <input
            type="text"
            inputMode="decimal"
            id="partsreceived-unitcost"
            value={unitCost}
            onChange={handleUnitCostChange}
            className={inputClass}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Row 3: Description, Supplier, Date In, Quantity */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="partsreceived-description" className={labelClass}>
            Description
          </label>
          <div className="flex items-center gap-0.5">
            <input
              type="text"
              id="partsreceived-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
              placeholder=""
            />
            <button
              type="button"
              onClick={handleDescriptionLookup}
              className={narrowButtonClass}
              aria-label="Description lookup"
            >
              &gt;&gt;
            </button>
          </div>
        </div>
        <div>
          <label htmlFor="partsreceived-supplier" className={labelClass}>
            Supplier
          </label>
          <select
            id="partsreceived-supplier"
            value={supplierId == null ? "" : supplierId}
            onChange={(e) => setSupplierId(e.target.value === "" ? 0 : Number(e.target.value))}
            className={selectClass}
          >
            <option value={0}>  -  SELECT - </option>
            {suppliersList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.descr ?? s.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="partsreceived-datein" className={labelClass}>
            Date In
          </label>
          <input
            type="date"
            id="partsreceived-datein"
            value={dateIn}
            onChange={(e) => setDateIn(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="partsreceived-quantity" className={labelClass}>
            Quantity
          </label>
          <input
            type="text"
            inputMode="numeric"
            id="partsreceived-quantity"
            value={quantity}
            onChange={handleQuantityChange}
            className={inputClass}
            placeholder="0"
          />
        </div>
      </div>

      {/* New, Save, Delete buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleNew}
          className="rounded border border-sky-300 bg-sky-200 px-4 py-2 text-sm font-medium text-sky-900 shadow-sm hover:bg-sky-300 dark:border-sky-600 dark:bg-sky-700 dark:text-sky-100 dark:hover:bg-sky-600"
        >
          New
        </button>
        {!showDelete && (
          <button
            type="button"
            onClick={handleSave}
            disabled={savePending}
            className="rounded border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50"
          >
            {savePending ? "Saving…" : "Save"}
          </button>
        )}
        {showDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deletePending}
            className="rounded border border-red-300 bg-red-200 px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-red-300 disabled:opacity-50 dark:border-red-600 dark:bg-red-700 dark:text-zinc-100 dark:hover:bg-red-600"
          >
            {deletePending ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>
      {saveError && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          {saveError}
        </p>
      )}

      <hr className="my-4 border-zinc-200 dark:border-zinc-700" />

      {/* Parts lookup popup */}
      {showPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="parts-popup-title"
        >
          <div className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
              <h2 id="parts-popup-title" className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Select part
              </h2>
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="rounded border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-200 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
              >
                Close
              </button>
            </div>
            <div className="max-h-[60vh] overflow-auto p-2">
              {popupLoading ? (
                <p className="py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  Loading…
                </p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800">
                      <th className="w-0 max-w-0 p-0 overflow-hidden border-0 invisible" />
                      <th className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-300">
                        Stock Code
                      </th>
                      <th className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-300">
                        Part
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {popupRows.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-center text-zinc-500 dark:text-zinc-400">
                          No matching parts
                        </td>
                      </tr>
                    ) : (
                      popupRows.map((row) => (
                        <tr
                          key={row.id}
                          className="cursor-pointer border-b border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:hover:bg-zinc-700/50"
                          onClick={() => handlePopupSelect(row)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handlePopupSelect(row);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <td className="w-0 max-w-0 p-0 overflow-hidden border-0 invisible">
                            {row.id}
                          </td>
                          <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">
                            {row.stockcode ?? "—"}
                          </td>
                          <td className="px-3 py-2 text-zinc-800 dark:text-zinc-200">
                            {row.part ?? "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
        {gridLoading ? (
          <p className="px-4 py-6 text-sm text-zinc-500 dark:text-zinc-400">
            Loading…
          </p>
        ) : gridError ? (
          <p className="px-4 py-6 text-sm text-amber-600 dark:text-amber-400">
            {gridError}
          </p>
        ) : (
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr>
                {gridData.length > 0
                  ? Object.keys(gridData[0]).map((key) => (
                      <th
                        key={key}
                        className={
                          key === "id" || key === "part_id"
                            ? `${gridThClass} ${invisibleColClass}`
                            : gridThClass
                        }
                      >
                        {columnHeader(key)}
                      </th>
                    ))
                  : <th className={gridThClass}>—</th>}
              </tr>
            </thead>
            <tbody>
              {gridData.length === 0 ? (
                <tr>
                  <td colSpan={gridData[0] ? Object.keys(gridData[0]).length : 1} className="px-4 py-6 text-center text-zinc-500 dark:text-zinc-400">
                    No data
                  </td>
                </tr>
              ) : (
                gridData.map((row, index) => (
                  <tr
                    key={row.id ?? index}
                    onClick={() => handleGridRowSelect(row)}
                    className={`cursor-pointer bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 ${selectedRowId && String(row.id) === String(selectedRowId) ? "ring-1 ring-inset ring-zinc-400 dark:ring-zinc-500" : ""}`}
                  >
                    {Object.keys(gridData[0]).map((key) => (
                      <td
                        key={key}
                        className={
                          key === "id" || key === "part_id"
                            ? `${gridTdClass} ${invisibleColClass}`
                            : gridTdClass
                        }
                      >
                        {key === "isactive" ? (
                          <span
                            className={
                              row[key]
                                ? "rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                                : "rounded-full bg-zinc-200 px-2 py-0.5 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                            }
                          >
                            {row[key] ? "Yes" : "No"}
                          </span>
                        ) : key === "datein" ? (
                          formatDateDdMmmYyyy(row[key])
                        ) : (
                          formatGridValue(row[key])
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
