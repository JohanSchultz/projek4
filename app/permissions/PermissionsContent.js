"use client";

import { useState, useEffect, useCallback } from "react";

const selectClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";
const checkboxClass =
  "h-4 w-4 rounded border-zinc-300 text-zinc-600 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-zinc-400";

export function PermissionsContent({
  users,
  functions,
  getUserFunctions,
  setUserFunction,
  saveUserPermissions,
}) {
  const usersList = Array.isArray(users) ? users : [];
  const functionsList = Array.isArray(functions) ? functions : [];
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedFunctionIds, setSelectedFunctionIds] = useState(() => new Set());
  const [pendingIds, setPendingIds] = useState(new Set());
  const [loadError, setLoadError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadUserFunctions = useCallback(
    (userId) => {
      setLoadError(null);
      if (userId == null || userId === "" || typeof getUserFunctions !== "function") {
        setSelectedFunctionIds(new Set());
        return;
      }
      getUserFunctions(userId).then((res) => {
        if (res?.error) {
          setLoadError(res.error);
          setSelectedFunctionIds(new Set());
        } else {
          const ids = Array.isArray(res?.data) ? res.data : [];
          setSelectedFunctionIds(new Set(ids.map(String)));
        }
      });
    },
    [getUserFunctions]
  );

  useEffect(() => {
    loadUserFunctions(selectedUserId);
  }, [selectedUserId, loadUserFunctions]);

  const handleUserChange = (e) => {
    const value = e.target.value;
    setSelectedUserId(value);
  };

  const handleFunctionToggle = (functionId) => {
    if (selectedUserId == null || selectedUserId === "") return;
    const idStr = String(functionId);
    const currentlyChecked = selectedFunctionIds.has(idStr);
    const add = !currentlyChecked;

    setPendingIds((prev) => new Set(prev).add(idStr));
    setUserFunction(selectedUserId, functionId, add).then((result) => {
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(idStr);
        return next;
      });
      if (result?.error) return;
      setSelectedFunctionIds((prev) => {
        const next = new Set(prev);
        if (add) next.add(idStr);
        else next.delete(idStr);
        return next;
      });
    });
  };

  const handleSave = () => {
    if (selectedUserId == null || selectedUserId === "" || typeof saveUserPermissions !== "function") return;
    setSaveError(null);
    setSaving(true);
    saveUserPermissions(selectedUserId, Array.from(selectedFunctionIds)).then((result) => {
      setSaving(false);
      if (result?.error) {
        setSaveError(result.error);
      }
    });
  };

  return (
    <>
      <div className="mb-6">
        <label
          htmlFor="permissions-user"
          className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          User
        </label>
        <select
          id="permissions-user"
          value={selectedUserId}
          onChange={handleUserChange}
          className={selectClass}
        >
          <option value="">   -  SELECT  - </option>
          {usersList.map((u) => (
            <option key={u.id} value={u.id}>
              {u.email ?? u.id}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-[16rem]">
        <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Functions
        </span>
        {loadError && (
          <p className="mb-2 text-sm text-amber-600 dark:text-amber-400">
            {loadError}
          </p>
        )}
        <div
          className="max-h-96 overflow-y-auto rounded border border-zinc-300 bg-white p-2 dark:border-zinc-600 dark:bg-zinc-800"
          role="group"
          aria-label="Functions"
        >
          {functionsList.length === 0 ? (
            <p className="py-1 text-sm text-zinc-500 dark:text-zinc-400">
              No functions
            </p>
          ) : (
            <ul className="space-y-1.5">
              {functionsList.map((fn) => {
                const idStr = String(fn.id);
                const checked = selectedFunctionIds.has(idStr);
                const disabled = !selectedUserId || pendingIds.has(idStr);
                return (
                  <li key={fn.id}>
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleFunctionToggle(fn.id)}
                        disabled={disabled}
                        className={checkboxClass}
                        value={fn.id}
                      />
                      <span>{fn.descr ?? fn.id}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="mt-3">
          {saveError && (
            <p className="mb-2 text-sm text-amber-600 dark:text-amber-400">
              {saveError}
            </p>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!selectedUserId || saving}
            className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </>
  );
}
