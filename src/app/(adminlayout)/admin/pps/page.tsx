"use client";

import { useState } from "react";
import { Factory } from "lucide-react";
import { cn } from "@/lib/utils";
import Stage1View from "@/components/PPS/Stage1View";
import Stage2View from "@/components/PPS/Stage2View";
import Stage3View from "@/components/PPS/Stage3View";
import Stage4View from "@/components/PPS/Stage4View";
import ResourcesView from "@/components/PPS/ResourcesView";

type Tab = "stage1" | "stage2" | "stage3" | "stage4" | "resources";

const TABS: { id: Tab; label: string }[] = [
  { id: "stage1", label: "Stage 1 — Cooking & Molding" },
  { id: "stage2", label: "Stage 2 — Dehydrator Loading" },
  { id: "stage3", label: "Stage 3 — Container & Label" },
  { id: "stage4", label: "Stage 4 — Packaging" },
  { id: "resources", label: "Resources" },
];

export default function PPSPage() {
  const [active, setActive] = useState<Tab>("stage1");

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
              onClick={() => setActive(id)}
              className={cn(
                "w-full text-center md:text-left px-4 py-2.5 rounded-xs text-sm font-medium transition-colors",
                active === id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
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
          {active === "stage3" && <Stage3View compact />}
          {active === "stage4" && <Stage4View basePath="/admin/pps" compact />}
          {active === "resources" && <ResourcesView />}
        </div>
      </div>
    </div>
  );
}
