"use client";

import { useState, useTransition, useCallback } from "react";
import { PartsPerTypeGrid } from "@/app/add-job/PartsPerTypeGrid";

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

const HIDDEN_COLS = new Set(["id", "equipmenttypes_id", "dateout", "comments", "technician_id"]);

function formatDateForInput(value) {
  if (value == null || value === "") return "";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function formatCellValue(value) {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function EditJobContent({
  equipmentTypes,
  technicians,
  initialPartsData,
  fetchPartsByTypeId,
  fetchItemsPerType,
  fetchJobListPerItem,
  fetchPartsPerJob,
  updateJob: updateJobAction,
  deletePartsPerJob: deletePartsPerJobAction,
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
  const [saveError, setSaveError] = useState(null);
  const [savePending, startSaveTransition] = useTransition();
  const [jobId, setJobId] = useState("");
  const [showJobPopup, setShowJobPopup] = useState(false);
  const [jobListData, setJobListData] = useState([]);
  const [jobListPending, setJobListPending] = useState(false);

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
    setJobId("");
    setShowJobPopup(false);
    setJobListData([]);
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

  const handleSerialChange = (e) => {
    const value = e.target.value;
    const id = value === "" ? 0 : Number(value);
    setSelectedSerialId(id ?? 0);
    setJobId("");
    setInDate("");
    setOutDate("");
    setComments("");
    setSelectedTechnicianId(0);
    if (id == null || id === 0) {
      setShowJobPopup(false);
      setJobListData([]);
      return;
    }
    if (typeof fetchJobListPerItem !== "function") return;
    setJobListPending(true);
    setShowJobPopup(true);
    setJobListData([]);
    fetchJobListPerItem(id).then((res) => {
      setJobListPending(false);
      if (res?.error) {
        setJobListData([]);
      } else {
        setJobListData(Array.isArray(res?.data) ? res.data : []);
      }
    });
  };

  const handleSelectJob = async (row) => {
    setShowJobPopup(false);
    const id = row?.id;
    setJobId(id != null ? String(id) : "");
    setInDate(formatDateForInput(row?.datein ?? row?.date_in));
    setOutDate(formatDateForInput(row?.dateout ?? row?.date_out));
    setComments(row?.comments ?? "");
    const techId = row?.technician_id ?? 0;
    setSelectedTechnicianId(Number(techId) || 0);

    if (id != null && typeof fetchPartsPerJob === "function") {
      const res = await fetchPartsPerJob(id);
      const parts = Array.isArray(res?.data) ? res.data : [];
      const newQtyByKey = {};
      const newCheckedByKey = {};
      for (let i = 0; i < gridData.length; i++) {
        const gRow = gridData[i];
        const partId = gRow?.partid ?? gRow?.part_id;
        const match = parts.find((p) => (p?.part_id ?? p?.partid) === partId);
        if (match) {
          const key = gridRowKey(gRow, i);
          newQtyByKey[key] = match?.qty != null ? String(match.qty) : "";
          newCheckedByKey[key] = !!(match?.isdamaged ?? match?.is_damaged);
        }
      }
      setQtyByKey(newQtyByKey);
      setCheckedByKey(newCheckedByKey);
    }
  };

  const visibleColumns = useCallback((rows) => {
    if (!rows.length) return [];
    const keys = Object.keys(rows[0]);
    return keys.filter((k) => !HIDDEN_COLS.has(k));
  }, []);

  return (
    <>
      {showJobPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowJobPopup(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Select job"
        >
          <div
            className="max-h-[80vh] w-full max-w-4xl overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Select a job
            </div>
            <div className="overflow-auto max-h-[60vh]">
              {jobListPending ? (
                <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400">
                  Loading…
                </p>
              ) : jobListData.length === 0 ? (
                <p className="p-4 text-sm text-zinc-500 dark:text-zinc-400">
                  No jobs found.
                </p>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-zinc-100 dark:bg-zinc-800">
                    <tr>
                      {visibleColumns(jobListData).map((key) => (
                        <th
                          key={key}
                          className="border-b border-zinc-200 px-4 py-3 font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
                        >
                          {key.replace(/_/g, " ")}
                        </th>
                      ))}
                      <th className="border-b border-zinc-200 px-4 py-3 font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobListData.map((row, idx) => (
                      <tr
                        key={row.id ?? idx}
                        className="border-b border-zinc-200 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800 cursor-pointer"
                        onClick={() => handleSelectJob(row)}
                      >
                        {visibleColumns(jobListData).map((key) => (
                          <td
                            key={key}
                            className="px-4 py-2 text-zinc-800 dark:text-zinc-200"
                          >
                            {formatCellValue(row[key])}
                          </td>
                        ))}
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectJob(row);
                            }}
                            className="text-sky-600 hover:underline dark:text-sky-400"
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      <input
        type="text"
        id="job_id"
        name="job_id"
        value={jobId}
        readOnly
        aria-hidden="true"
        className="invisible w-0 max-w-0 h-0 overflow-hidden p-0 border-0"
      />

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
            onChange={handleSerialChange}
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

      {jobId && (
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={() => {
              setSaveError(null);
              startSaveTransition(async () => {
                if (!jobId || typeof updateJobAction !== "function") {
                  setSaveError("Please select a job first.");
                  return;
                }
                const result = await updateJobAction(
                  jobId,
                  selectedTechnicianId || null,
                  inDate || null,
                  outDate || null,
                  comments ?? ""
                );
                if (result?.error) {
                  setSaveError(result.error);
                  return;
                }
                if (typeof deletePartsPerJobAction === "function") {
                  const deleteResult = await deletePartsPerJobAction(jobId);
                  if (deleteResult?.error) {
                    setSaveError(deleteResult.error);
                    return;
                  }
                }
                if (typeof insertPartsPerJobAction === "function") {
                  for (let i = 0; i < gridData.length; i++) {
                    const row = gridData[i];
                    const key = gridRowKey(row, i);
                    const qty = numericVal(qtyByKey[key]);
                    if (qty <= 0) continue;
                    const partId = row?.partid ?? row?.parts_id ?? row?.part_id ?? null;
                    const unitCost = numericVal(row?.costa);
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
                      return;
                    }
                  }
                }
                setSelectedId(0);
                setItemsList([]);
                setSelectedSerialId(0);
                setSelectedTechnicianId(0);
                setInDate("");
                setOutDate("");
                setComments("");
                setGridData([]);
                setQtyByKey({});
                setCheckedByKey({});
                setJobId("");
                setShowJobPopup(false);
                setJobListData([]);
                setError(null);
                setSaveError(null);
              });
            }}
            disabled={savePending}
            className="rounded border border-orange-300 bg-orange-200 px-4 py-2 text-sm font-medium text-zinc-900 shadow-sm hover:bg-orange-300 disabled:opacity-50 dark:border-orange-600 dark:bg-orange-700 dark:text-zinc-100 dark:hover:bg-orange-600"
          >
            {savePending ? "Saving…" : "Save Changes"}
          </button>
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
