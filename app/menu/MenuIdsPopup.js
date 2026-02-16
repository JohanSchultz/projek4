"use client";

import { useState, useEffect } from "react";

export function MenuIdsPopup({ gridRows }) {
  const [open, setOpen] = useState(false);
  const ids = Array.isArray(gridRows)
    ? gridRows.map((r) => r.function_id).filter((id) => id != null)
    : [];

  useEffect(() => {
    if (ids.length > 0) setOpen(true);
  }, [ids.length]);

  if (ids.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
      >
        Show IDs in popup
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Function IDs"
        >
          <div
            className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                ID values with which the grid was populated
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
              {ids.map((id, index) => (
                <li key={id ?? index} className="text-sm text-zinc-800 dark:text-zinc-200">
                  {String(id)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
