"use client";

import { FlaskConical, CheckCircle2, Layers, Loader2, Droplets, Copy, Wand2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SIZES, OIL_TYPES, EFFECTS, UNIT_OPTIONS } from "@/lib/gummyBuilderConfig";
import { SegmentGroup, SectionLabel } from "./SegmentGroup";
import { CannabinoidSelector } from "./CannabinoidSelector";
import { GummyPricingCard } from "./GummyPricingCard";
import { GummyQueue } from "./GummyQueue";
import { FlavorPicker } from "./FlavorPicker";
import { useGummyBuilder, MAX_MIX_FLAVORS } from "@/lib/useGummyBuilder";

function getTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.55 ? "#1a1a1a" : "#ffffff";
}

interface Props {
  storeId: string;
  onSaved: () => void;
}

export function GummyBuilder({ storeId, onSaved }: Props) {
  const {
    flavorName, setFlavorName,
    selectedFlavors,
    size, setSize,
    oilType, setOilType,
    effect, setEffect,
    unitsOrdered, setUnitsOrdered,
    cannabinoids, setCannabinoids,
    isColorLoading,
    colorInfo,
    queue, setQueue,
    allFlavors,
    isLoadingFlavors,
    maxFlavors,
    pricing,
    grandTotal,
    totalQueued,
    isSaving,
    handleAddFlavor,
    handleRemoveFlavor,
    handleAutoPickFlavors,
    fetchColorForFlavors,
    handleQueueCurrent,
    handleSave,
  } = useGummyBuilder({ storeId, onSaved });

  return (
    <div className="space-y-4">

      {/* Flavor Name + Flavors + Units Ordered */}
      <div className="grid grid-cols-1 sm:grid-cols-[2fr_2fr_1fr] gap-3 items-start">
        <div>
          <SectionLabel>Flavor Name</SectionLabel>
          <Input
            className="rounded-xs h-10 text-sm"
            placeholder="e.g. Tropical Wave, Mango Madness…"
            value={flavorName}
            onChange={(e) => setFlavorName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <SectionLabel>Flavors (up to 3)</SectionLabel>
          <FlavorPicker
            selectedFlavors={selectedFlavors}
            allFlavors={allFlavors}
            isLoadingFlavors={isLoadingFlavors}
            maxFlavors={maxFlavors}
            onAdd={handleAddFlavor}
            onRemove={handleRemoveFlavor}
          />
          <button
            type="button"
            onClick={handleAutoPickFlavors}
            disabled={isColorLoading || isLoadingFlavors}
            className="flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline transition-opacity pt-0.5"
          >
            {isColorLoading
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : <Wand2 className="w-3 h-3" />}
            {selectedFlavors.length > 0 ? "Re-generate for me" : "Generate flavors & color for me"}
          </button>
        </div>
        <div>
          <SectionLabel>Units Ordered</SectionLabel>
          <Select value={String(unitsOrdered)} onValueChange={(v) => setUnitsOrdered(Number(v))}>
            <SelectTrigger className="rounded-xs h-10 text-sm w-full border border-border dark:border-white/20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xs max-h-64">
              {UNIT_OPTIONS.map((n) => (
                <SelectItem key={n} value={String(n)} className="rounded-xs">
                  {n.toLocaleString()} units
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {pricing.isRatio && pricing.testingFeeWaived && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Testing fee waived
            </p>
          )}
        </div>
      </div>

      {/* Size + Oil Type + Effect */}
      <div className="rounded-xs bg-muted/20 border border-border p-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <SectionLabel>Gummy Size</SectionLabel>
          <SegmentGroup options={SIZES} value={size} onChange={setSize} />
        </div>
        <div className="border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-4">
          <SectionLabel>Oil Type</SectionLabel>
          <SegmentGroup options={OIL_TYPES} value={oilType} onChange={setOilType} />
        </div>
        <div className="border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-4">
          <SectionLabel>Effect</SectionLabel>
          <SegmentGroup options={EFFECTS} value={effect} onChange={setEffect} />
        </div>
      </div>

      {/* Cannabinoids + Color */}
      <div className="rounded-xs bg-muted/20 border border-border p-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <CannabinoidSelector
            cannabinoids={cannabinoids}
            onAdd={(entry) => setCannabinoids((prev) => [...prev, entry])}
            onRemove={(name) => setCannabinoids((prev) => prev.filter((c) => c.name !== name))}
          />
        </div>
        <div className="border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-4">
          {isColorLoading ? (
            <div className="rounded-xs border border-border flex items-center justify-center h-44">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : colorInfo ? (
            <div className="rounded-xs overflow-hidden border border-border">
              {/* Colored top */}
              <div
                className="flex flex-col items-center justify-center gap-2 px-4 py-6"
                style={{ backgroundColor: colorInfo.hex }}
              >
                <Droplets className="w-7 h-7 opacity-70" style={{ color: getTextColor(colorInfo.hex) }} />
                <p className="text-[11px] font-semibold uppercase tracking-widest opacity-70" style={{ color: getTextColor(colorInfo.hex) }}>
                  {selectedFlavors.join(", ")}
                </p>
                <p className="text-xl font-bold text-center leading-tight" style={{ color: getTextColor(colorInfo.hex) }}>
                  {colorInfo.name}
                </p>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(colorInfo.hex.toUpperCase())}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono mt-1 transition-opacity hover:opacity-80"
                  style={{ backgroundColor: "rgba(0,0,0,0.18)", color: getTextColor(colorInfo.hex) }}
                >
                  <Copy className="w-3 h-3" />
                  {colorInfo.hex.toUpperCase()}
                </button>
              </div>
              {/* Dark bottom */}
              <div className="bg-neutral-900 px-4 py-3 space-y-2.5">
                <div className="grid grid-cols-3 text-center divide-x divide-white/10">
                  {(["R", "G", "B"] as const).map((ch, i) => (
                    <div key={ch} className="px-2">
                      <p className="text-[10px] text-white/40 uppercase">{ch}</p>
                      <p className="text-base font-bold text-white">{[colorInfo.rgb.r, colorInfo.rgb.g, colorInfo.rgb.b][i]}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-white/50 italic text-center leading-relaxed">"{colorInfo.rationale}"</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xs border border-dashed border-border flex flex-col items-center justify-center gap-3 h-44 px-4">
              <p className="text-xs text-muted-foreground text-center">
                {selectedFlavors.length > 0
                  ? "Color ready to generate"
                  : "Select a flavor or use Generate for me"}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-xs gap-1.5 text-xs"
                disabled={selectedFlavors.length === 0 || isColorLoading}
                onClick={() => fetchColorForFlavors(selectedFlavors)}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Generate Color
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Live pricing */}
      <GummyPricingCard pricing={pricing} unitsOrdered={unitsOrdered} grandTotal={grandTotal} />

      {/* Queue preview */}
      <GummyQueue queue={queue} onRemove={(id) => setQueue((prev) => prev.filter((q) => q.id !== id))} />

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleQueueCurrent}
          disabled={isSaving || !flavorName.trim()}
          className="rounded-xs flex-1 h-12 gap-2 text-sm font-semibold"
        >
          <Layers className="w-4 h-4" />
          Add Another Gummy
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSaving || (!flavorName.trim() && queue.length === 0)}
          className="rounded-xs flex-1 h-12 gap-2 text-base font-semibold"
        >
          <FlaskConical className="w-4 h-4" />
          {isSaving
            ? "Saving…"
            : totalQueued > 1
            ? `Save All (${totalQueued}) to My Line`
            : "Save to My Line"}
        </Button>
      </div>

    </div>
  );
}
