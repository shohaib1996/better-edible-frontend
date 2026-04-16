"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Factory } from "lucide-react";
import { cn } from "@/lib/utils";
import Stage1View from "@/components/PPS/stage1/Stage1View";
import Stage2View from "@/components/PPS/stage2/Stage2View";
import Stage3View from "@/components/PPS/stage3/Stage3View";
import Stage4View from "@/components/PPS/stage4/Stage4View";
import ResourcesView from "@/components/PPS/ResourcesView";
import PackagePrepView from "@/components/PPS/package-prep/PackagePrepView";
import OilContainersPanel from "@/components/oil/OilContainersPanel";
import WasteLogPanel from "@/components/oil/WasteLogPanel";

type Tab =
  | "stage1"
  | "stage2"
  | "stage3"
  | "stage4"
  | "resources"
  | "package-prep"
  | "cannabis-oil";

const TABS: { id: Tab; label: string }[] = [
  { id: "stage1", label: "Stage 1 — Cooking & Molding" },
  { id: "stage2", label: "Stage 2 — Dehydrator Loading" },
  { id: "stage3", label: "Stage 3 — Container & Label" },
  { id: "stage4", label: "Stage 4 — Packaging" },
  { id: "package-prep", label: "Package Prep" },
  { id: "cannabis-oil", label: "Cannabis Oil" },
  { id: "resources", label: "Resources" },
];

const PARAM_TO_TAB: Record<string, Tab> = {
  "1": "stage1",
  "2": "stage2",
  "3": "stage3",
  "4": "stage4",
  resources: "resources",
  "package-prep": "package-prep",
  "cannabis-oil": "cannabis-oil",
};
const TAB_TO_PARAM: Record<Tab, string> = {
  stage1: "1",
  stage2: "2",
  stage3: "3",
  stage4: "4",
  resources: "resources",
  "package-prep": "package-prep",
  "cannabis-oil": "cannabis-oil",
};

type OilTab = "containers" | "waste-log";

const OIL_TABS: { id: OilTab; label: string }[] = [
  { id: "containers", label: "Containers" },
  { id: "waste-log", label: "Waste Log" },
];

export default function PPSPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const active: Tab = PARAM_TO_TAB[searchParams.get("stage") ?? ""] ?? "stage1";
  const [oilTab, setOilTab] = useState<OilTab>("containers");

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Factory className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">
            Production Progression System
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track gummy production through all 4 stages
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Nav */}
        <nav className="flex flex-col gap-1 w-full md:w-56 shrink-0">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() =>
                router.replace(`/admin/pps?stage=${TAB_TO_PARAM[id]}`)
              }
              className={cn(
                "w-full text-center md:text-left px-4 py-2.5 rounded-xs text-sm font-medium transition-colors",
                active === id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {active === "stage1" && <Stage1View compact />}
          {active === "stage2" && <Stage2View compact />}
          {active === "stage3" && <Stage3View compact isAdmin />}
          {active === "stage4" && <Stage4View basePath="/admin/pps" compact />}
          {active === "package-prep" && <PackagePrepView isAdmin compact />}
          {active === "cannabis-oil" && (
            <div>
              <div className="flex gap-1 mb-6">
                {OIL_TABS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setOilTab(id)}
                    className={cn(
                      "px-4 py-2 rounded-xs text-sm font-medium transition-colors",
                      oilTab === id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {oilTab === "containers" && <OilContainersPanel />}
              {oilTab === "waste-log" && <WasteLogPanel />}
            </div>
          )}
          {active === "resources" && <ResourcesView />}
        </div>
      </div>
    </div>
  );
}
