"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CANNABINOID_PRICES, ALL_CANNABINOIDS, CANNABINOID_OPTIONS } from "@/lib/gummyPricing";
import type { CannabinoidName } from "@/types/privateLabel/gummyBuilder";

interface Cannabinoid { name: string; mg: number; priceAdd: number; }

interface Props {
  gummySize: "standard" | "xl" | "";
  onGummySizeChange: (v: "standard" | "xl") => void;
  gummyOilType: "biomax" | "rosin" | "";
  onGummyOilTypeChange: (v: "biomax" | "rosin") => void;
  gummyEffect: "hybrid" | "indica" | "sativa" | "";
  onGummyEffectChange: (v: "hybrid" | "indica" | "sativa") => void;
  gummyCannabinoids: Cannabinoid[];
  onGummyCannabinoidsChange: (c: Cannabinoid[]) => void;
  unitsOrdered: string;
  onUnitsOrderedChange: (v: string) => void;
  unitCost: string;
  totalCost: string;
}

const selectCls = "rounded-xs border-border dark:border-white/20 bg-card";

export function LabelGummySpecSection({
  gummySize, onGummySizeChange,
  gummyOilType, onGummyOilTypeChange,
  gummyEffect, onGummyEffectChange,
  gummyCannabinoids, onGummyCannabinoidsChange,
  unitsOrdered, onUnitsOrderedChange,
  unitCost, totalCost,
}: Props) {
  const [cbName, setCbName] = useState("");
  const [cbMg, setCbMg] = useState("");

  function addCannabinoid() {
    const mg = parseInt(cbMg, 10);
    if (!cbName || mg <= 0) return;
    const priceAdd = CANNABINOID_PRICES[cbName as CannabinoidName]?.[mg] ?? 0;
    onGummyCannabinoidsChange([
      ...gummyCannabinoids.filter((c) => c.name !== cbName),
      { name: cbName, mg, priceAdd },
    ]);
    setCbName("");
    setCbMg("");
  }

  return (
    <div className="rounded-xs border border-border p-3 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gummy Spec</p>

      {/* Size / Oil Type / Effect */}
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Size</Label>
          <Select value={gummySize} onValueChange={(v) => onGummySizeChange(v as "standard" | "xl")}>
            <SelectTrigger className={`${selectCls} h-9 text-sm`}><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent className={selectCls}>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="xl">XL</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Oil Type</Label>
          <Select value={gummyOilType} onValueChange={(v) => onGummyOilTypeChange(v as "biomax" | "rosin")}>
            <SelectTrigger className={`${selectCls} h-9 text-sm`}><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent className={selectCls}>
              <SelectItem value="biomax">BioMax</SelectItem>
              <SelectItem value="rosin">Rosin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Effect</Label>
          <Select value={gummyEffect} onValueChange={(v) => onGummyEffectChange(v as "hybrid" | "indica" | "sativa")}>
            <SelectTrigger className={`${selectCls} h-9 text-sm`}><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent className={selectCls}>
              <SelectItem value="hybrid">Hybrid</SelectItem>
              <SelectItem value="indica">Indica</SelectItem>
              <SelectItem value="sativa">Sativa</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cannabinoid Add-ons */}
      <div className="space-y-2">
        <Label className="text-xs">Cannabinoid Add-ons</Label>
        {gummyCannabinoids.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {gummyCannabinoids.map((c) => (
              <span key={c.name} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-xs bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300">
                {c.name} {c.mg}mg
                {c.priceAdd > 0 && <span className="opacity-60">+${c.priceAdd.toFixed(2)}</span>}
                <button
                  type="button"
                  onClick={() => onGummyCannabinoidsChange(gummyCannabinoids.filter((cb) => cb.name !== c.name))}
                  className="hover:text-destructive ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Select value={cbName} onValueChange={(v) => { setCbName(v); setCbMg(""); }}>
            <SelectTrigger className={`${selectCls} h-9 text-sm flex-1`}><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent className={selectCls}>
              {ALL_CANNABINOIDS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={cbMg} onValueChange={setCbMg} disabled={!cbName}>
            <SelectTrigger className={`${selectCls} h-9 text-sm w-36`}><SelectValue placeholder="mg" /></SelectTrigger>
            <SelectContent className={selectCls}>
              {(CANNABINOID_OPTIONS[cbName as keyof typeof CANNABINOID_OPTIONS] ?? []).map((mg) => (
                <SelectItem key={mg} value={String(mg)}>
                  {mg}mg +${(CANNABINOID_PRICES[cbName as CannabinoidName]?.[mg] ?? 0).toFixed(2)}/unit
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button" size="sm" variant="outline"
            className={`${selectCls} h-9 shrink-0`}
            disabled={!cbName || !cbMg}
            onClick={addCannabinoid}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />Add
          </Button>
        </div>
      </div>

      {/* Pricing — auto-calculated from spec */}
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Units Ordered</Label>
          <Input
            type="number" min="1" placeholder="e.g. 630"
            value={unitsOrdered}
            onChange={(e) => onUnitsOrderedChange(e.target.value)}
            className={`${selectCls} h-9 text-sm`}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Unit Cost ($)</Label>
          <div className="rounded-xs border border-border bg-muted/40 h-9 px-3 flex items-center text-sm font-medium tabular-nums">
            {unitCost ? `$${parseFloat(unitCost).toFixed(4)}` : <span className="text-muted-foreground text-xs">Set oil type</span>}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Total Cost ($)</Label>
          <div className="rounded-xs border border-border bg-muted/40 h-9 px-3 flex items-center text-sm font-semibold tabular-nums text-primary">
            {totalCost ? `$${parseFloat(totalCost).toFixed(2)}` : <span className="text-muted-foreground font-normal text-xs">Enter units</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
