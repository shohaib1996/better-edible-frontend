"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";
import MoldsPanel from "./resources/MoldsPanel";
import TraysPanel from "./resources/TraysPanel";
import UnitsPanel from "./resources/UnitsPanel";

type Tab = "molds" | "trays" | "units";
const TABS: { id: Tab; label: string }[] = [
  { id: "molds", label: "Molds" },
  { id: "trays", label: "Trays" },
  { id: "units", label: "Units" },
];

export default function ResourcesView() {
  const [active, setActive] = useState<Tab>("molds");
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Resource Management</h2>
        <p className="text-sm text-muted-foreground">
          Manage molds, dehydrator trays, and dehydrator units
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
        <button
          onClick={() => router.push("/admin/pps/package-prep")}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xs bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors"
        >
          <Package className="w-4 h-4" />
          Package Prep
        </button>
      </div>

      {active === "molds" && <MoldsPanel />}
      {active === "trays" && <TraysPanel />}
      {active === "units" && <UnitsPanel />}
    </div>
  );
}
