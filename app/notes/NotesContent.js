"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";
const selectClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";
const checkboxClass =
  "h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-zinc-400";

const gridRowClass =
  "border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/50";
const gridThClass =
  "border-b border-zinc-200 bg-zinc-100 px-4 py-3 font-semibold text-left text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
const gridTdClass = "px-4 py-3 text-sm text-zinc-800 dark:text-zinc-200";
const gridInvisibleColClass =
  "w-0 max-w-0 p-0 overflow-hidden invisible border-0";

function getNotesColumnHeader(key) {
  const headers = {
    description: "Note",
    isfinalised: "Finalised",
    serialno: "Serial No",
    equipmenttype: "Equipment Type",
    technician: "Technician",
  };
  return headers[key] ?? key;
}

/** Column order: Equipment Type first (left), then the rest in original order. */
function getNotesColumnOrder(keys) {
  const list = Array.isArray(keys) ? [...keys] : [];
  const left = list.filter((k) => k === "equipmenttype");
  const rest = list.filter((k) => k !== "equipmenttype");
  return [...left, ...rest];
}

function getCommentGridColumnHeader(key) {
  const headers = {
    comment: "Comment",
    technician: "Technician",
    created_at: "Comment Date",
  };
  return headers[key] ?? key;
}

function formatGridValue(value) {
  if (value == null) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (
    value instanceof Date ||
    (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value))
  ) {
    try {
      return new Date(value).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return String(value);
    }
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function NotesContent({
  categories,
  types,
  technicians,
  allNotes,
  searchEquipmentItemsBySerial,
  getNotesLikeSerialno,
  getCommentsByNoteId,
  getEquipmentItemById,
  insertNote,
  insertNoteComment,
  deleteNoteComment,
  updateNote,
  deleteNote,
}) {
  const router = useRouter();
  const categoryList = categories ?? [];
  const typeList = types ?? [];
  const techniciansList = technicians ?? [];
  const notesList = Array.isArray(allNotes) ? allNotes : [];
  const [categoryId, setCategoryId] = useState(0);
  const [typeId, setTypeId] = useState(0);
  const [technicianId, setTechnicianId] = useState(0);
  const [serialNumber, setSerialNumber] = useState("");
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [isFinalised, setIsFinalised] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [showSearchNotePopup, setShowSearchNotePopup] = useState(false);
  const [searchNoteResults, setSearchNoteResults] = useState([]);
  const [searchNoteError, setSearchNoteError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [isCommentPending, startCommentTransition] = useTransition();
  const [commentingTechnicianId, setCommentingTechnicianId] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [commentSaveError, setCommentSaveError] = useState(null);
  const [commentGridData, setCommentGridData] = useState([]);
  const [selectedCommentId, setSelectedCommentId] = useState(null);

  const typesForCategory =
    categoryId === 0
      ? typeList
      : typeList.filter(
          (t) => Number(t.equipmentcategories_id) === Number(categoryId)
        );

  const loadCommentGrid = () => {
    if (typeof getCommentsByNoteId !== "function") return;
    if (selectedNoteId == null || Number.isNaN(Number(selectedNoteId))) {
      setCommentGridData([]);
      setSelectedCommentId(null);
      return;
    }
    setSelectedCommentId(null);
    getCommentsByNoteId(selectedNoteId).then((res) => {
      setCommentGridData(Array.isArray(res?.data) ? res.data : []);
    });
  };

  useEffect(() => {
    loadCommentGrid();
  }, [selectedNoteId]);

  const handleCommentRowClick = (row) => {
    setSelectedCommentId(row.id ?? null);
    setCommentText(row.comment ?? "");
    setCommentingTechnicianId(row.technicians_id ?? 0);
  };

  const handleNewComment = () => {
    setCommentingTechnicianId(0);
    setCommentText("");
    setSelectedCommentId(null);
  };

  const handleDeleteComment = () => {
    if (selectedCommentId == null || typeof deleteNoteComment !== "function") return;
    if (!confirm("Are you sure you want to delete this comment?")) return;
    setCommentSaveError(null);
    startCommentTransition(async () => {
      const result = await deleteNoteComment(selectedCommentId);
      if (result?.error) {
        setCommentSaveError(result.error);
        return;
      }
      setSelectedCommentId(null);
      setCommentText("");
      setCommentingTechnicianId(0);
      loadCommentGrid();
      router.refresh();
    });
  };

  const handleSearchClick = () => {
    const term = serialNumber.trim();
    if (term.length < 2) return;
    if (typeId === 0) return;
    if (typeof searchEquipmentItemsBySerial !== "function") return;
    searchEquipmentItemsBySerial(term, typeId).then((res) => {
      setSearchResults(Array.isArray(res?.data) ? res.data : []);
      setShowSearchPopup(true);
    });
  };

  const handleSearchNoteClick = () => {
    if (typeof getNotesLikeSerialno !== "function") return;
    setSearchNoteError(null);
    getNotesLikeSerialno(serialNumber.trim()).then((res) => {
      if (res?.error) {
        setSearchNoteError(res.error);
        setSearchNoteResults([]);
      } else {
        setSearchNoteResults(Array.isArray(res?.data) ? res.data : []);
      }
      setShowSearchNotePopup(true);
    });
  };

  const handleSelectNoteFromSearch = (row) => {
    setShowSearchNotePopup(false);
    handleRowClick(row);
  };

  const handleSelectSerial = async (row) => {
    setShowSearchPopup(false);
    const id = row?.id;
    if (id == null || typeof getEquipmentItemById !== "function") {
      setSerialNumber(row?.serialno ?? row?.serial_no ?? "");
      setSelectedItemId(null);
      return;
    }
    const res = await getEquipmentItemById(id);
    const record = res?.data;
    if (!record) {
      setSerialNumber(row?.serialno ?? row?.serial_no ?? "");
      setSelectedItemId(null);
      return;
    }
    const tid = record.equipmenttypes_id ?? 0;
    setTypeId(tid);
    const typeRow = typeList.find((t) => Number(t.id) === Number(tid));
    setCategoryId(typeRow?.equipmentcategories_id ?? 0);
    setSerialNumber(record.serialno ?? record.serial_number ?? "");
    setSelectedItemId(record.id ?? null);
  };

  const handleSave = () => {
    setSaveError(null);
    if (selectedItemId == null) {
      setSaveError("Please select an equipment item (search and choose from the list).");
      return;
    }
    if (technicianId === 0) {
      setSaveError("Please select a technician.");
      return;
    }
    if (typeof insertNote !== "function") return;
    startTransition(async () => {
      const result = await insertNote(
        selectedItemId,
        technicianId,
        noteText,
        isFinalised
      );
      if (result?.error) {
        setSaveError(result.error);
        return;
      }
      setCategoryId(0);
      setTypeId(0);
      setTechnicianId(0);
      setSerialNumber("");
      setSelectedNoteId(null);
      setSelectedItemId(null);
      setNoteText("");
      setIsFinalised(false);
      router.refresh();
    });
  };

  const handleRowClick = (row) => {
    setSaveError(null);
    // id column -> invisible id textbox
    setSelectedNoteId(row.id ?? null);
    // description column -> Note textbox
    setNoteText(row.description ?? "");
    // isfinalised column -> Finalised checkbox
    setIsFinalised(Boolean(row.isfinalised));
    // Equipment Category: selected id = equipmentcategories_id
    setCategoryId(row.equipmentcategories_id ?? 0);
    // Technician: selected id = technicians_id
    setTechnicianId(row.technicians_id ?? 0);
    // Equipment type: selected id = equipmenttypes_id
    setTypeId(row.equipmenttypes_id ?? 0);
    setSerialNumber(row.serialno ?? "");
    setSelectedItemId(row.equipmentitems_id ?? null);
  };

  const handleNew = () => {
    setSaveError(null);
    setSelectedNoteId(null);
    setCategoryId(0);
    setTypeId(0);
    setTechnicianId(0);
    setSerialNumber("");
    setSelectedItemId(null);
    setNoteText("");
    setIsFinalised(false);
    setSelectedCommentId(null);
    setCommentText("");
    setCommentingTechnicianId(0);
  };

  const handleChange = () => {
    if (selectedNoteId == null) return;
    setSaveError(null);
    if (selectedItemId == null) {
      setSaveError("Please select an equipment item (search and choose from the list).");
      return;
    }
    if (technicianId === 0) {
      setSaveError("Please select a technician.");
      return;
    }
    if (typeof updateNote !== "function") return;
    startTransition(async () => {
      const result = await updateNote(
        selectedNoteId,
        selectedItemId,
        technicianId,
        noteText,
        isFinalised
      );
      if (result?.error) {
        setSaveError(result.error);
        return;
      }
      router.refresh();
      handleNew();
    });
  };

  const handleDelete = () => {
    if (selectedNoteId == null) return;
    setSaveError(null);
    if (typeof deleteNote !== "function") return;
    startTransition(async () => {
      const result = await deleteNote(selectedNoteId);
      if (result?.error) {
        setSaveError(result.error);
        return;
      }
      router.refresh();
      handleNew();
    });
  };

  const handleSaveComment = () => {
    setCommentSaveError(null);
    if (typeof insertNoteComment !== "function") return;
    startCommentTransition(async () => {
      const result = await insertNoteComment(
        commentingTechnicianId,
        commentText,
        selectedNoteId
      );
      if (result?.error) {
        setCommentSaveError(result.error);
        return;
      }
      setCommentText("");
      setSelectedCommentId(null);
      loadCommentGrid();
      router.refresh();
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
      {showSearchNotePopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowSearchNotePopup(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Search note"
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Search Note
            </div>
            {searchNoteError && (
              <p className="border-b border-zinc-200 px-4 py-2 text-sm text-amber-600 dark:border-zinc-700 dark:text-amber-400">
                {searchNoteError}
              </p>
            )}
            <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 border-b border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
              <span>Equipment type</span>
              <span>Serial No</span>
              <span>Technician</span>
              <span>Created at</span>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto p-2">
              {searchNoteResults.length === 0 ? (
                <li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                  No notes found.
                </li>
              ) : (
                searchNoteResults.map((row, index) => (
                  <li key={row.id ?? index}>
                    <button
                      type="button"
                      onClick={() => handleSelectNoteFromSearch(row)}
                      className="grid w-full grid-cols-[1fr_1fr_1fr_auto] gap-4 rounded px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    >
                      <span className="min-w-0 truncate">
                        {row.equipmenttype ?? "—"}
                      </span>
                      <span className="min-w-0 truncate">
                        {row.serialno ?? "—"}
                      </span>
                      <span className="min-w-0 truncate">
                        {row.technician ?? "—"}
                      </span>
                      <span className="shrink-0 text-zinc-600 dark:text-zinc-300">
                        {formatGridValue(row.created_at)}
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
            htmlFor="notes-equipment-category"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Equipment categories
          </label>
          <select
            id="notes-equipment-category"
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
            htmlFor="notes-equipment-type"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Equipment types
          </label>
          <select
            id="notes-equipment-type"
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
            htmlFor="notes-serial-number"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Serial Number
          </label>
          <div className="flex items-stretch gap-2">
            <input
              type="text"
              id="notes-serial-number"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              className={inputClass + " rounded-r-none"}
              placeholder=""
            />
            <button
              type="button"
              onClick={handleSearchClick}
              disabled={serialNumber.trim().length < 2 || typeId === 0}
              className="rounded border border-l border-zinc-300 bg-white px-2 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Search &gt;&gt;
            </button>
            <button
              type="button"
              onClick={handleSearchNoteClick}
              className="rounded border border-zinc-300 bg-white px-2 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Search Note
            </button>
          </div>
        </div>
        <div>
          <label
            htmlFor="notes-technician"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Technicians
          </label>
          <select
            id="notes-technician"
            value={technicianId == null ? "" : technicianId}
            onChange={(e) =>
              setTechnicianId(e.target.value === "" ? 0 : Number(e.target.value))
            }
            className={selectClass}
          >
            <option value={0}>   -  SELECT  - </option>
            {techniciansList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.descr ?? t.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            &nbsp;
          </span>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={isFinalised}
              onChange={(e) => setIsFinalised(e.target.checked)}
              className={checkboxClass}
            />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Finalised
            </span>
          </label>
        </div>
        <input
          type="hidden"
          id="id"
          name="id"
          value={selectedNoteId != null ? String(selectedNoteId) : ""}
          readOnly
          aria-hidden="true"
        />
        <input
          type="hidden"
          id="item_id"
          name="item_id"
          value={selectedItemId != null ? String(selectedItemId) : ""}
          readOnly
          aria-hidden="true"
        />
      </div>
      <div className="mb-4 w-full">
        <label
          htmlFor="notes-note"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Note
        </label>
        <textarea
          id="notes-note"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          rows={5}
          className={`${inputClass} w-full min-w-0 resize-y`}
          placeholder=""
        />
      </div>
      <hr className="my-4 border-zinc-200 dark:border-zinc-700" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className={
            selectedNoteId != null
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
            selectedNoteId == null
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
            selectedNoteId == null
              ? "hidden"
              : "rounded border border-amber-300 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800 shadow-sm hover:bg-amber-200 disabled:opacity-50 dark:border-amber-600 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-800/50"
          }
        >
          Change
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className={
            selectedNoteId == null
              ? "hidden"
              : "rounded border border-red-300 bg-red-100 px-4 py-2 text-sm font-medium text-red-800 shadow-sm hover:bg-red-200 disabled:opacity-50 dark:border-red-600 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-800/50"
          }
        >
          Delete
        </button>
      </div>
      {saveError && (
        <p className="text-sm text-amber-600 dark:text-amber-400">{saveError}</p>
      )}
      <hr className="my-4 border-zinc-200 dark:border-zinc-700" />
      <div className="mb-4">
        <label
          htmlFor="notes-commenting-technician"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Commenting Technician
        </label>
        <input
          type="hidden"
          id="comment_id"
          name="comment_id"
          value={selectedCommentId != null ? String(selectedCommentId) : ""}
          readOnly
          aria-hidden="true"
        />
        <select
          id="notes-commenting-technician"
          value={commentingTechnicianId == null ? "" : commentingTechnicianId}
          onChange={(e) =>
            setCommentingTechnicianId(e.target.value === "" ? 0 : Number(e.target.value))
          }
          className={selectClass}
        >
          <option value={0}>   -  SELECT  - </option>
          {techniciansList.map((t) => (
            <option key={t.id} value={t.id}>
              {t.descr ?? t.id}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4 w-full">
        <label
          htmlFor="notes-comment"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Comment
        </label>
        <textarea
          id="notes-comment"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          rows={4}
          className={`${inputClass} w-full min-w-0 resize-y`}
          placeholder=""
        />
      </div>
      <hr className="my-4 border-zinc-200 dark:border-zinc-700" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSaveComment}
          disabled={isCommentPending}
          className={
            selectedCommentId != null
              ? "hidden"
              : "rounded border border-emerald-500 bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50"
          }
        >
          {isCommentPending ? "Saving…" : "Save Comment"}
        </button>
        <button
          type="button"
          onClick={handleNewComment}
          className={
            selectedCommentId == null
              ? "hidden"
              : "rounded border border-sky-300 bg-sky-100 px-4 py-2 text-sm font-medium text-sky-800 shadow-sm hover:bg-sky-200 dark:border-sky-500 dark:bg-sky-900/40 dark:text-sky-200 dark:hover:bg-sky-800/50"
          }
        >
          New Comment
        </button>
        <button
          type="button"
          onClick={handleDeleteComment}
          disabled={isCommentPending}
          className={
            selectedCommentId == null
              ? "hidden"
              : "rounded border border-red-300 bg-red-100 px-4 py-2 text-sm font-medium text-red-800 shadow-sm hover:bg-red-200 disabled:opacity-50 dark:border-red-600 dark:bg-red-900/40 dark:text-red-200 dark:hover:bg-red-800/50"
          }
        >
          Delete Comment
        </button>
      </div>
      {commentSaveError && (
        <p className="mb-4 text-sm text-amber-600 dark:text-amber-400">
          {commentSaveError}
        </p>
      )}
      <hr className="my-4 border-zinc-200 dark:border-zinc-700" />
      <div className="w-full">
        <h2 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Comment Grid
        </h2>
        <div className="overflow-auto">
          {commentGridData.length === 0 ? (
            <p className="py-4 text-sm text-zinc-500 dark:text-zinc-400">
              No comments to display.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
              <table className="w-full min-w-[32rem] table-fixed text-left text-sm">
                <thead>
                  <tr>
                    {Object.keys(commentGridData[0]).map((key) => (
                      <th
                        key={key}
                        className={
                          key === "id" || key === "technicians_id"
                            ? `${gridThClass} ${gridInvisibleColClass}`
                            : gridThClass
                        }
                      >
                        {getCommentGridColumnHeader(key)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {commentGridData.map((row, index) => (
                    <tr
                      key={row.id ?? index}
                      className={`${gridRowClass} cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700/50`}
                      onClick={() => handleCommentRowClick(row)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleCommentRowClick(row);
                        }
                      }}
                    >
                      {Object.keys(commentGridData[0]).map((key) => (
                        <td
                          key={key}
                          className={
                            key === "id" || key === "technicians_id"
                              ? `${gridTdClass} ${gridInvisibleColClass}`
                              : gridTdClass
                          }
                        >
                          {formatGridValue(row[key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
