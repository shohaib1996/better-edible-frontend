"use client";

import { FlaskConical, CheckCircle2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SIZES, OIL_TYPES, EFFECTS, FLAVOR_MODES, UNIT_OPTIONS } from "@/lib/gummyBuilderConfig";
import { SegmentGroup, SectionLabel } from "./SegmentGroup";
import { CannabinoidSelector } from "./CannabinoidSelector";
import { GummyPricingCard } from "./GummyPricingCard";
import { GummyQueue } from "./GummyQueue";
import { FlavorPicker } from "./FlavorPicker";
import { GummyVisual } from "./GummyVisual";
import { GummyColorPicker } from "./GummyColorPicker";
import { useGummyBuilder, MAX_MIX_FLAVORS } from "@/lib/useGummyBuilder";

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
    flavorMode,
    unitsOrdered, setUnitsOrdered,
    cannabinoids, setCannabinoids,
    gummyHue, setGummyHue,
    queue, setQueue,
    allFlavors,
    isLoadingFlavors,
    maxFlavors,
    pricing,
    grandTotal,
    totalQueued,
    isSaving,
    handleFlavorModeChange,
    handleAddFlavor,
    handleRemoveFlavor,
    handleQueueCurrent,
    handleSave,
  } = useGummyBuilder({ storeId, onSaved });

  return (
    <div className="space-y-4">

      {/* Flavor Name + Units Ordered */}
      <div className="grid grid-cols-1 sm:grid-cols-[3fr_1fr] gap-3 items-start">
        <div>
          <SectionLabel>Flavor Name</SectionLabel>
          <Input
            className="rounded-xs h-10 text-sm"
            placeholder="e.g. Tropical Wave, Mango Madness…"
            value={flavorName}
            onChange={(e) => setFlavorName(e.target.value)}
          />
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

      {/* Size + Oil Type */}
      <div className="rounded-xs bg-muted/20 border border-border p-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <SectionLabel>Gummy Size</SectionLabel>
          <SegmentGroup options={SIZES} value={size} onChange={setSize} />
        </div>
        <div className="border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-4">
          <SectionLabel>Oil Type</SectionLabel>
          <SegmentGroup options={OIL_TYPES} value={oilType} onChange={setOilType} />
        </div>
      </div>

      {/* Effect + Flavor Mode + Flavors */}
      <div className="rounded-xs bg-muted/20 border border-border p-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <SectionLabel>Effect</SectionLabel>
          <SegmentGroup options={EFFECTS} value={effect} onChange={setEffect} />
        </div>
        <div className="border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-4">
          <SectionLabel>Flavor Mode</SectionLabel>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="shrink-0">
              <SegmentGroup options={FLAVOR_MODES} value={flavorMode} onChange={handleFlavorModeChange} />
            </div>
            <div className="sm:flex-1 sm:min-w-0">
              <FlavorPicker
                selectedFlavors={selectedFlavors}
                allFlavors={allFlavors}
                isLoadingFlavors={isLoadingFlavors}
                maxFlavors={maxFlavors}
                onAdd={handleAddFlavor}
                onRemove={handleRemoveFlavor}
              />
            </div>
          </div>
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
        <div className="border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-4 flex flex-row items-center justify-between gap-4">
          <div className="flex-1 flex justify-center">
            <GummyVisual size={size} hue={gummyHue} />
          </div>
          <GummyColorPicker hue={gummyHue} onHueChange={setGummyHue} />
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
