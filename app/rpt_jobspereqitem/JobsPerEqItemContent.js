"use client";

import { useState } from "react";

const inputClass =
  "rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:focus:border-zinc-400 dark:focus:ring-zinc-400";

export function JobsPerEqItemContent() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const handleShowReport = () => {
    // Report logic can be added here
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div>
          <label
            htmlFor="jobspereqitem-from"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            From
          </label>
          <input
            id="jobspereqitem-from"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className={inputClass}
            aria-label="From date"
          />
        </div>
        <div>
          <label
            htmlFor="jobspereqitem-to"
            className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            To
          </label>
          <input
            id="jobspereqitem-to"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className={inputClass}
            aria-label="To date"
          />
        </div>
        <button
          type="button"
          onClick={handleShowReport}
          className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
        >
          Show Report
        </button>
      </div>
      <hr className="my-4 border-zinc-200 dark:border-zinc-700" />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Report content can be added below.
      </p>
    </>
  );
}
