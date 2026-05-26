"use client";

import { useState } from "react";
import { AlertTriangle, ChevronDown, PackagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetLabelInventoryQuery } from "@/redux/api/PrivateLabel/ppsApi";
import PackagePrepAdminOrder from "./PackagePrepAdminOrder";
import { OnOrderTab } from "./OnOrderTab";
import { UnprocessedTab } from "./UnprocessedTab";
import { ApplyLabelTab } from "./ApplyLabelTab";
import { PrintedTab } from "./PrintedTab";

type Tab = "on_order" | "unprocessed" | "apply_label" | "printed";

const TABS: { id: Tab; label: string }[] = [
  { id: "on_order", label: "On Order" },
  { id: "unprocessed", label: "Unprocessed" },
  { id: "apply_label", label: "Apply Label" },
  { id: "printed", label: "Printed" },
];

export default function PackagePrepView({ isAdmin, compact }: { isAdmin: boolean; compact?: boolean }) {
  const [active, setActive] = useState<Tab>("on_order");
  const [bulkOpen, setBulkOpen] = useState(false);

  const { data: inventoryData } = useGetLabelInventoryQuery();
  const belowCount = (inventoryData?.inventory ?? []).filter(
    (i) => i.reorderThreshold > 0 && i.unprocessed + i.labeled + i.printed < i.reorderThreshold,
  ).length;

  return (
    <div className="flex flex-col gap-4">
      {isAdmin && (
        <div className="flex flex-col gap-0 rounded-xs border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setBulkOpen((v) => !v)}
            className="flex items-center justify-between gap-3 px-4 py-3 bg-muted/40 hover:bg-muted/70 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <PackagePlus className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-semibold text-foreground">Place Bulk Label Order</span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0", bulkOpen && "rotate-180")} />
          </button>
          {bulkOpen && (
            <div className="border-t border-border p-4">
              <PackagePrepAdminOrder />
            </div>
          )}
        </div>
      )}

      {isAdmin && belowCount > 0 && (
        <div className="flex items-center gap-2 rounded-xs bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {belowCount} SKU{belowCount !== 1 ? "s are" : " is"} below reorder threshold
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-xs transition-colors text-center",
              active === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {active === "on_order" && <OnOrderTab compact={compact} isAdmin={isAdmin} />}
      {active === "unprocessed" && <UnprocessedTab isAdmin={isAdmin} compact={compact} />}
      {active === "apply_label" && <ApplyLabelTab isAdmin={isAdmin} compact={compact} />}
      {active === "printed" && <PrintedTab isAdmin={isAdmin} compact={compact} />}
    </div>
  );
}
