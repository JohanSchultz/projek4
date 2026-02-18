"use client";

import { useState, useCallback, useEffect } from "react";

const inputClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";
const selectClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";
const checkboxClass =
  "h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-zinc-400";

/**
 * Reusable filter component with "From" and "To" date pickers, Mines dropdown,
 * Shafts dropdown (filtered by selected mine), and multi-select of equipment types.
 *
 * @param {Object} props
 * @param {{ id: number, descr: string }[]} props.equipmentTypes - List of equipment types (e.g. from public.equipmenttypes where isactive = true)
 * @param {{ id: number, descr: string }[]} [props.mines] - List of mines (e.g. from public.mines where isactive = true)
 * @param {(mineId: number) => Promise<{ data: { id: number, descr: string }[] }>} [props.fetchShaftsByMineId] - Fetches shafts for mine
 * @param {(shaftId: number) => Promise<{ data: { id: number, descr: string }[] }>} [props.fetchSectionsByShaftId] - Fetches sections for shaft
 * @param {(sectionId: number) => Promise<{ data: { id: number, descr: string }[] }>} [props.fetchGangsBySectionId] - Fetches gangs for section
 * @param {(value: { fromDate, toDate, selectedIds, selectedMineId, selectedShaftId, selectedSectionId, selectedGangId }) => void} [props.onChange] - Called when any value changes
 * @param {(params: { fromDate, toDate, selectedIds, selectedMineId, selectedShaftId, selectedSectionId }) => void} [props.onShowReport] - When provided, a "Show Report" button is shown; called with current filter values when clicked
 */
export function DateRangeEquipmentTypeFilter({
  equipmentTypes = [],
  mines = [],
  fetchShaftsByMineId,
  fetchSectionsByShaftId,
  fetchGangsBySectionId,
  initialFromDate = "",
  initialToDate = "",
  initialSelectedIds = [],
  onChange,
  onShowReport,
}) {
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);
  const [selectedMineId, setSelectedMineId] = useState(0);
  const [selectedShaftId, setSelectedShaftId] = useState(0);
  const [selectedSectionId, setSelectedSectionId] = useState(0);
  const [selectedGangId, setSelectedGangId] = useState(0);
  const [shaftsList, setShaftsList] = useState([]);
  const [sectionsList, setSectionsList] = useState([]);
  const [gangsList, setGangsList] = useState([]);
  const [shaftsPending, setShaftsPending] = useState(false);
  const [sectionsPending, setSectionsPending] = useState(false);
  const [gangsPending, setGangsPending] = useState(false);
  const [selectedIds, setSelectedIds] = useState(
    () => new Set(initialSelectedIds.map(Number))
  );

  useEffect(() => {
    setFromDate(initialFromDate);
  }, [initialFromDate]);
  useEffect(() => {
    setToDate(initialToDate);
  }, [initialToDate]);
  useEffect(() => {
    setSelectedIds(new Set(initialSelectedIds.map(Number)));
  }, [initialSelectedIds.join(",")]);

  useEffect(() => {
    if (typeof fetchShaftsByMineId !== "function") {
      setShaftsList([]);
      return;
    }
    let cancelled = false;
    setShaftsPending(true);
    fetchShaftsByMineId(selectedMineId)
      .then((res) => {
        if (cancelled) return;
        const data = Array.isArray(res?.data) ? res.data : [];
        setShaftsList(data);
        setSelectedShaftId(0);
      })
      .finally(() => {
        if (!cancelled) setShaftsPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedMineId, fetchShaftsByMineId]);

  useEffect(() => {
    if (typeof fetchSectionsByShaftId !== "function") {
      setSectionsList([]);
      return;
    }
    let cancelled = false;
    setSectionsPending(true);
    fetchSectionsByShaftId(selectedShaftId)
      .then((res) => {
        if (cancelled) return;
        const data = Array.isArray(res?.data) ? res.data : [];
        setSectionsList(data);
        setSelectedSectionId(0);
      })
      .finally(() => {
        if (!cancelled) setSectionsPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedShaftId, fetchSectionsByShaftId]);

  useEffect(() => {
    if (typeof fetchGangsBySectionId !== "function") {
      setGangsList([]);
      return;
    }
    let cancelled = false;
    setGangsPending(true);
    fetchGangsBySectionId(selectedSectionId)
      .then((res) => {
        if (cancelled) return;
        const data = Array.isArray(res?.data) ? res.data : [];
        setGangsList(data);
        setSelectedGangId(0);
      })
      .finally(() => {
        if (!cancelled) setGangsPending(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSectionId, fetchGangsBySectionId]);

  const notify = useCallback(
    (nextFrom, nextTo, nextSet, nextMineId, nextShaftId, nextSectionId, nextGangId) => {
      if (typeof onChange === "function") {
        onChange({
          fromDate: nextFrom,
          toDate: nextTo,
          selectedIds: Array.from(nextSet),
          selectedMineId: nextMineId,
          selectedShaftId: nextShaftId,
          selectedSectionId: nextSectionId,
          selectedGangId: nextGangId,
        });
      }
    },
    [onChange]
  );

  const handleFromChange = useCallback(
    (e) => {
      const v = e.target.value;
      setFromDate(v);
      notify(v, toDate, selectedIds, selectedMineId, selectedShaftId, selectedSectionId, selectedGangId);
    },
    [toDate, selectedIds, selectedMineId, selectedShaftId, selectedSectionId, selectedGangId, notify]
  );

  const handleToChange = useCallback(
    (e) => {
      const v = e.target.value;
      setToDate(v);
      notify(fromDate, v, selectedIds, selectedMineId, selectedShaftId, selectedSectionId, selectedGangId);
    },
    [fromDate, selectedIds, selectedMineId, selectedShaftId, selectedSectionId, selectedGangId, notify]
  );

  const handleMineChange = useCallback(
    (e) => {
      const v = e.target.value;
      const id = v === "" ? 0 : Number(v);
      setSelectedMineId(id);
      notify(fromDate, toDate, selectedIds, id, 0, 0, 0);
    },
    [fromDate, toDate, selectedIds, notify]
  );

  const handleShaftChange = useCallback(
    (e) => {
      const v = e.target.value;
      const id = v === "" ? 0 : Number(v);
      setSelectedShaftId(id);
      notify(fromDate, toDate, selectedIds, selectedMineId, id, 0, 0);
    },
    [fromDate, toDate, selectedIds, selectedMineId, notify]
  );

  const handleSectionChange = useCallback(
    (e) => {
      const v = e.target.value;
      const id = v === "" ? 0 : Number(v);
      setSelectedSectionId(id);
      notify(fromDate, toDate, selectedIds, selectedMineId, selectedShaftId, id, 0);
    },
    [fromDate, toDate, selectedIds, selectedMineId, selectedShaftId, notify]
  );

  const handleGangChange = useCallback(
    (e) => {
      const v = e.target.value;
      const id = v === "" ? 0 : Number(v);
      setSelectedGangId(id);
      notify(fromDate, toDate, selectedIds, selectedMineId, selectedShaftId, selectedSectionId, id);
    },
    [fromDate, toDate, selectedIds, selectedMineId, selectedShaftId, selectedSectionId, notify]
  );

  const toggleId = useCallback(
    (id) => {
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedIds(next);
      notify(fromDate, toDate, next, selectedMineId, selectedShaftId, selectedSectionId, selectedGangId);
    },
    [fromDate, toDate, selectedIds, selectedMineId, selectedShaftId, selectedSectionId, selectedGangId, notify]
  );

  const handleSelectNone = useCallback(() => {
    const next = new Set();
    setSelectedIds(next);
    notify(fromDate, toDate, next, selectedMineId, selectedShaftId, selectedSectionId, selectedGangId);
  }, [fromDate, toDate, selectedMineId, selectedShaftId, selectedSectionId, selectedGangId, notify]);

  const types = Array.isArray(equipmentTypes) ? equipmentTypes : [];

  const handleSelectAll = useCallback(() => {
    const typeIds = types.map((t) => t.id);
    const next = new Set(typeIds);
    setSelectedIds(next);
    notify(fromDate, toDate, next, selectedMineId, selectedShaftId, selectedSectionId, selectedGangId);
  }, [fromDate, toDate, selectedMineId, selectedShaftId, selectedSectionId, selectedGangId, notify, types]);
  const minesList = Array.isArray(mines) ? mines : [];

  return (
    <div className="flex flex-wrap gap-6">
      <div>
        <label
          htmlFor="filter-from-date"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          From
        </label>
        <input
          type="date"
          id="filter-from-date"
          value={fromDate}
          onChange={handleFromChange}
          className={inputClass}
        />
      </div>
      <div>
        <label
          htmlFor="filter-to-date"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          To
        </label>
        <input
          type="date"
          id="filter-to-date"
          value={toDate}
          onChange={handleToChange}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <label
            htmlFor="filter-mines"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Mine
          </label>
          <select
            id="filter-mines"
            value={selectedMineId == null ? "" : selectedMineId}
            onChange={handleMineChange}
            className={selectClass}
          >
            <option value={0}>  -  ALL - </option>
            {minesList.map((m) => (
              <option key={m.id} value={m.id}>
                {m.descr ?? m.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="filter-shafts"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Shaft
          </label>
          <select
            id="filter-shafts"
            value={selectedShaftId == null ? "" : selectedShaftId}
            onChange={handleShaftChange}
            disabled={shaftsPending}
            className={selectClass}
          >
            <option value={0}>  -  ALL - </option>
            {shaftsList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.descr ?? s.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="filter-sections"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Section
          </label>
          <select
            id="filter-sections"
            value={selectedSectionId == null ? "" : selectedSectionId}
            onChange={handleSectionChange}
            disabled={sectionsPending}
            className={selectClass}
          >
            <option value={0}>  -  ALL - </option>
            {sectionsList.map((sec) => (
              <option key={sec.id} value={sec.id}>
                {sec.descr ?? sec.id}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label
            htmlFor="filter-gangs"
            className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Gang
          </label>
          <select
            id="filter-gangs"
            value={selectedGangId == null ? "" : selectedGangId}
            onChange={handleGangChange}
            disabled={gangsPending}
            className={selectClass}
          >
            <option value={0}>  -  ALL - </option>
            {gangsList.map((g) => (
              <option key={g.id} value={g.id}>
                {g.descr ?? g.id}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="min-w-[12rem]">
        <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Equipment types
        </span>
        <div
          className="max-h-48 overflow-y-auto rounded border border-zinc-300 bg-white p-2 dark:border-zinc-600 dark:bg-zinc-800"
          role="group"
          aria-label="Equipment types"
        >
          {types.length === 0 ? (
            <p className="py-1 text-sm text-zinc-500 dark:text-zinc-400">
              No equipment types
            </p>
          ) : (
            <ul className="space-y-1.5">
              {types.map((t) => (
                <li key={t.id}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(t.id)}
                      onChange={() => toggleId(t.id)}
                      className={checkboxClass}
                      value={t.id}
                    />
                    <span>{t.descr ?? t.id}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
        {types.length > 0 && (
          <div className="mt-2 flex w-full min-w-[12rem] justify-between">
            <button
              type="button"
              onClick={handleSelectNone}
              className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Select None
            </button>
            <button
              type="button"
              onClick={handleSelectAll}
              className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            >
              Select All
            </button>
          </div>
        )}
      </div>
      {typeof onShowReport === "function" && (
        <div className="flex items-end">
          <button
            type="button"
            onClick={() =>
              onShowReport({
                fromDate,
                toDate,
                selectedIds: Array.from(selectedIds),
                selectedMineId,
                selectedShaftId,
                selectedSectionId,
                selectedGangId,
                equipmentTypeLabels: Array.from(selectedIds)
                  .map((id) => types.find((t) => t.id === id)?.descr ?? String(id))
                  .filter(Boolean),
                mineLabel:
                  selectedMineId === 0
                    ? "ALL"
                    : minesList.find((m) => m.id === selectedMineId)?.descr ?? "",
                shaftLabel:
                  selectedShaftId === 0
                    ? "ALL"
                    : shaftsList.find((s) => s.id === selectedShaftId)?.descr ?? "",
                sectionLabel:
                  selectedSectionId === 0
                    ? "ALL"
                    : sectionsList.find((sec) => sec.id === selectedSectionId)?.descr ?? "",
                gangLabel:
                  selectedGangId === 0
                    ? "ALL"
                    : gangsList.find((g) => g.id === selectedGangId)?.descr ?? "",
              })
            }
            className="rounded border border-sky-300 bg-sky-200 px-4 py-2 text-sm font-medium text-sky-900 shadow-sm hover:bg-sky-300 dark:border-sky-600 dark:bg-sky-700 dark:text-sky-100 dark:hover:bg-sky-600"
          >
            Show Report
          </button>
        </div>
      )}
    </div>
  );
}
