"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FlaskConical, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import OilContainersPanel from "@/components/oil/OilContainersPanel";
import WasteLogPanel from "@/components/oil/WasteLogPanel";

type Tab = "containers" | "waste-log";

const TABS: { id: Tab; label: string }[] = [
  { id: "containers", label: "Containers" },
  { id: "waste-log", label: "Waste Log" },
];

export default function OilPage() {
  const [active, setActive] = useState<Tab>("containers");
  const router = useRouter();

  return (
    <div className="p-4 md:p-8 bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.push("/admin/pps?stage=cannabis-oil")}
          className="p-1.5 rounded-xs hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Back to PPS"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <FlaskConical className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold">Cannabis Oil Inventory</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage containers, track usage, and log waste
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
          {active === "containers" && <OilContainersPanel />}
          {active === "waste-log" && <WasteLogPanel />}
        </div>
      </div>
    </div>
  );
}
