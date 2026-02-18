"use client";

import Link from "next/link";
import { useState } from "react";

const parentClass =
  "flex cursor-pointer items-center gap-1 rounded px-2 py-1.5 text-2xl font-bold text-zinc-800 bg-[#F0FFFF] hover:bg-[#E0EEEE] dark:bg-[#F0FFFF] dark:text-zinc-800 dark:hover:bg-[#E0EEEE]";
const childLinkClass =
  "block rounded px-2 py-1.5 text-sm font-medium text-zinc-800 bg-[#FFE4B5] hover:bg-[#FFDAB9] dark:bg-[#FFE4B5] dark:text-zinc-800 dark:hover:bg-[#FFDAB9]";
const treeLineClass = "border-l-2 border-blue-200 dark:border-blue-600";

export function MenuTree({ menuVisibility = {} }) {
  const v = menuVisibility;
  const [expanded, setExpanded] = useState({
    admin: true,
    functions: true,
    reports: true,
  });

  const toggle = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <nav className="flex-1 px-2 pb-4" role="tree" aria-label="Menu tree">
      <ul className="space-y-0.5" role="group">
        <li role="treeitem" aria-expanded={expanded.admin}>
          <span
            className={parentClass}
            onClick={() => toggle("admin")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle("admin");
              }
            }}
          >
            <span className="inline-block w-4 text-center text-sm" aria-hidden>
              {expanded.admin ? "▼" : "▶"}
            </span>
            Administration
          </span>
          {expanded.admin && (
            <ul
              className={`mt-0.5 ml-2 pl-3 space-y-0.5 ${treeLineClass}`}
              role="group"
            >
              {v.permissions !== false && (
                <li role="treeitem">
                  <Link href="/permissions" className={childLinkClass}>
                    Permissions
                  </Link>
                </li>
              )}
              {v.equipmentCategories !== false && (
                <li role="treeitem">
                  <Link href="/equipment_categories" className={childLinkClass}>
                    Equipment Categories
                  </Link>
                </li>
              )}
              {v.equipmentTypes !== false && (
                <li role="treeitem">
                  <Link href="/equipment_types" className={childLinkClass}>
                    Equipment Types
                  </Link>
                </li>
              )}
              {v.equipmentItems !== false && (
                <li role="treeitem">
                  <Link href="/equipment_items" className={childLinkClass}>
                    Equipment Items
                  </Link>
                </li>
              )}
              {v.mines !== false && (
                <li role="treeitem">
                  <Link href="/mines" className={childLinkClass}>
                    Mines
                  </Link>
                </li>
              )}
              {v.shafts !== false && (
                <li role="treeitem">
                  <Link href="/shafts" className={childLinkClass}>
                    Shafts
                  </Link>
                </li>
              )}
              {v.sections !== false && (
                <li role="treeitem">
                  <Link href="/sections" className={childLinkClass}>
                    Sections
                  </Link>
                </li>
              )}
              {v.gangs !== false && (
                <li role="treeitem">
                  <Link href="/gangs" className={childLinkClass}>
                    Gangs
                  </Link>
                </li>
              )}
              {v.parts !== false && (
                <li role="treeitem">
                  <Link href="/parts" className={childLinkClass}>
                    Parts
                  </Link>
                </li>
              )}
            </ul>
          )}
        </li>
        <li role="treeitem" aria-expanded={expanded.functions}>
          <span
            className={parentClass}
            onClick={() => toggle("functions")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle("functions");
              }
            }}
          >
            <span className="inline-block w-4 text-center text-sm" aria-hidden>
              {expanded.functions ? "▼" : "▶"}
            </span>
            Functions
          </span>
          {expanded.functions && (
            <ul
              className={`mt-0.5 ml-2 pl-3 space-y-0.5 ${treeLineClass}`}
              role="group"
            >
              {v.addJob !== false && (
                <li role="treeitem">
                  <Link href="/add-job" className={childLinkClass}>
                    Add Job
                  </Link>
                </li>
              )}
              {v.notes !== false && (
                <li role="treeitem">
                  <Link href="/notes" className={childLinkClass}>
                    Notes
                  </Link>
                </li>
              )}
            </ul>
          )}
        </li>
        <li role="treeitem" aria-expanded={expanded.reports}>
          <span
            className={parentClass}
            onClick={() => toggle("reports")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle("reports");
              }
            }}
          >
            <span className="inline-block w-4 text-center text-sm" aria-hidden>
              {expanded.reports ? "▼" : "▶"}
            </span>
            Reports
          </span>
          {expanded.reports && (
            <ul
              className={`mt-0.5 ml-2 pl-3 space-y-0.5 ${treeLineClass}`}
              role="group"
            >
              <li role="treeitem">
                <Link href="/rpt_servicesdone" className={childLinkClass}>
                  Services done
                </Link>
              </li>
              {v.equipmentList !== false && (
                <li role="treeitem">
                  <Link href="/rpt_service_history" className={childLinkClass}>
                    Equipment List
                  </Link>
                </li>
              )}
              {v.serviceList !== false && (
                <li role="treeitem">
                  <Link href="/report_servicelist" className={childLinkClass}>
                    Service list
                  </Link>
                </li>
              )}
              <li role="treeitem">
                <Link href="/rpt_jobspertechnician" className={childLinkClass}>
                  Jobs per Technician
                </Link>
              </li>
              <li role="treeitem">
                <Link href="/rpt_jobspereqitem" className={childLinkClass}>
                  Job Count per Equipment Item
                </Link>
              </li>
              <li role="treeitem">
                <Link href="/rpt_qtyservicedbytype" className={childLinkClass}>
                  Qty Serviced By type
                </Link>
              </li>
            </ul>
          )}
        </li>
      </ul>
    </nav>
  );
}
