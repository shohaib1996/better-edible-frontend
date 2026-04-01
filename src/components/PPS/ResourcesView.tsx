"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import MoldsPanel from "./resources/MoldsPanel";
import TraysPanel from "./resources/TraysPanel";
import UnitsPanel from "./resources/UnitsPanel";

type Tab = "molds" | "trays" | "units";
const TABS: { id: Tab; label: string }[] = [
  { id: "molds", label: "Molds" },
  { id: "trays", label: "Trays" },
  { id: "units", label: "Dehydrators" },
];

export default function ResourcesView() {
  const [active, setActive] = useState<Tab>("molds");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Resource Management</h2>
        <p className="text-sm text-muted-foreground">
          Manage molds, dehydrator trays, and dehydrators
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-xs transition-colors",
              active === id
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {active === "molds" && <MoldsPanel />}
      {active === "trays" && <TraysPanel />}
      {active === "units" && <UnitsPanel />}
    </div>
  );
}
