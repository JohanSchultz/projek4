"use client";

import { useState } from "react";
import { DateRangeEquipmentTypeFilter } from "@/components/DateRangeEquipmentTypeFilter";

export function QtysServicedByTypeContent({
  equipmentTypes,
  mines,
  fetchShaftsByMineId,
  fetchSectionsByShaftId,
  fetchGangsBySectionId,
}) {
  const [reportShown, setReportShown] = useState(false);

  const handleShowReport = () => {
    setReportShown(true);
  };

  return (
    <>
      <div className="mb-6">
        <DateRangeEquipmentTypeFilter
          equipmentTypes={equipmentTypes}
          mines={mines}
          fetchShaftsByMineId={fetchShaftsByMineId}
          fetchSectionsByShaftId={fetchSectionsByShaftId}
          fetchGangsBySectionId={fetchGangsBySectionId}
          onShowReport={handleShowReport}
        />
      </div>
      {reportShown && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Report content can be added here.
        </p>
      )}
    </>
  );
}
