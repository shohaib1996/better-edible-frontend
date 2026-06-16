"use client";

import { FlaskConical, CheckCircle2, Layers, Loader2, Droplets, Wand2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SIZES, OIL_TYPES, BIOMAX_EFFECTS, UNIT_OPTIONS } from "@/lib/gummyBuilderConfig";
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
    colorRecipe,
    queue, setQueue,
    allFlavors,
    isLoadingFlavors,
    maxFlavors,
    availableRosinStrains,
    availableEffects,
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

  const isRosin = oilType === "rosin";
  const rosinOutOfStock = isRosin && availableRosinStrains.length === 0;

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

      {/* Oil Type → Size → Effect (in that order) */}
      <div className="rounded-xs bg-muted/20 border border-border p-3 grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* 1. Oil Type — first selection */}
        <div>
          <SectionLabel>Oil Type</SectionLabel>
          <SegmentGroup options={OIL_TYPES} value={oilType} onChange={(v) => {
            setOilType(v);
            // Reset effect to hybrid when switching oil types
            setEffect("hybrid");
          }} />
          {isRosin && (
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
              Pressed in-house · availability varies by strain
            </p>
          )}
          {!isRosin && (
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">
              Botanical terpenes · all effects always available
            </p>
          )}
        </div>

        {/* 2. Gummy Size — second selection */}
        <div className="border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-4">
          <SectionLabel>Gummy Size</SectionLabel>
          <SegmentGroup options={SIZES} value={size} onChange={setSize} />
        </div>

        {/* 3. Effect — conditional on oil type */}
        <div className="border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-4">
          <SectionLabel>
            {isRosin ? "Rosin Strain" : "Effect"}
          </SectionLabel>

          {rosinOutOfStock ? (
            <div className="flex items-start gap-2 rounded-xs border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-3 py-2.5 mt-1">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-snug">
                No Rosin currently in stock. Check back soon or choose BioMax.
              </p>
            </div>
          ) : (
            <SegmentGroup
              options={availableEffects}
              value={effect}
              onChange={setEffect}
            />
          )}
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
              <div
                className="flex flex-col items-center justify-center gap-2 px-4 py-6"
                style={{ backgroundColor: colorInfo.hex }}
              >
                <Droplets className="w-7 h-7 opacity-70" style={{ color: getTextColor(colorInfo.hex) }} />
                <p className="text-[11px] font-semibold uppercase tracking-widest opacity-70" style={{ color: getTextColor(colorInfo.hex) }}>
                  {flavorName || selectedFlavors.join(", ")}
                </p>
                <p className="text-xl font-bold text-center leading-tight" style={{ color: getTextColor(colorInfo.hex) }}>
                  {colorInfo.name}
                </p>
              </div>
              <div className="bg-neutral-900 px-4 py-4">
                <p className="text-sm text-white/80 italic text-center leading-relaxed">
                  "{colorInfo.rationale}"
                </p>
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
