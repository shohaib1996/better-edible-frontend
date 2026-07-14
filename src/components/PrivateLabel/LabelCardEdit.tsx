"use client";

import { Check, X, FlaskConical, CheckCircle2 } from "lucide-react";
import { GummyVisual } from "./GummyVisual";
import { FlavorPicker } from "./FlavorPicker";
import { hexToHueRotation } from "@/lib/useGummyBuilder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SIZES, OIL_TYPES, EFFECTS } from "@/lib/gummyBuilderConfig";
import { SegmentGroup } from "./SegmentGroup";
import { CannabinoidEditor } from "./CannabinoidEditor";
import type { GummySize, GummyOilType, GummyEffect, CannabinoidName } from "@/types/privateLabel/gummyBuilder";

const UNIT_PRESETS = [630, 1000, 2000, 3000];

interface EditPricing {
  unitCost: number;
  totalCost: number;
  testingFee: number;
  testingFeeWaived: boolean;
  isRatio: boolean;
}

interface Props {
  flavorName: string;
  setFlavorName: (v: string) => void;
  size: GummySize;
  setSize: (v: GummySize) => void;
  oilType: GummyOilType;
  setOilType: (v: GummyOilType) => void;
  effect: GummyEffect;
  setEffect: (v: GummyEffect) => void;
  units: number;
  setUnits: (v: number) => void;
  selectedFlavors: string[];
  allFlavors: { name: string }[];
  isLoadingFlavors: boolean;
  colorHex: string | undefined;
  colorName: string | undefined;
  isColorLoading: boolean;
  cannabinoids: { name: CannabinoidName; mg: number }[];
  effectiveKey: string;
  selectedKey: string;
  setSelectedKey: (k: string) => void;
  editPricing: EditPricing;
  isSaving: boolean;
  onAddFlavor: (name: string) => void;
  onRemoveFlavor: (name: string) => void;
  onAddCannabinoid: () => void;
  onRemoveCannabinoid: (name: CannabinoidName) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function LabelCardEdit({
  flavorName, setFlavorName,
  size, setSize,
  oilType, setOilType,
  effect, setEffect,
  units, setUnits,
  selectedFlavors, allFlavors, isLoadingFlavors,
  colorHex, colorName, isColorLoading,
  cannabinoids, effectiveKey, selectedKey, setSelectedKey,
  editPricing,
  isSaving,
  onAddFlavor, onRemoveFlavor,
  onAddCannabinoid, onRemoveCannabinoid,
  onSave, onCancel,
}: Props) {
  const grandTotal = editPricing.totalCost + (editPricing.testingFeeWaived ? 0 : editPricing.testingFee);
  const editColorHue = colorHex ? hexToHueRotation(colorHex) : 0;

  return (
    <div className="rounded-xs border border-primary/40 bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <FlaskConical className="w-4 h-4 text-primary shrink-0" />
          <Input
            value={flavorName}
            onChange={(e) => setFlavorName(e.target.value)}
            className="rounded-xs h-8 text-sm"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button size="sm" className="rounded-xs h-8 gap-1.5" onClick={onSave} disabled={isSaving}>
            <Check className="w-3.5 h-3.5" /> Save
          </Button>
          <Button size="sm" variant="ghost" className="rounded-xs h-8" onClick={onCancel}>
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Size + Oil Type */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Size</p>
          <SegmentGroup options={SIZES} value={size} onChange={setSize} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Oil Type</p>
          <SegmentGroup options={OIL_TYPES} value={oilType} onChange={setOilType} />
        </div>
      </div>

      {/* Effect */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Effect</p>
        <SegmentGroup options={EFFECTS} value={effect} onChange={setEffect} />
      </div>

      {/* Flavors */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Flavors</p>
        <FlavorPicker
          selectedFlavors={selectedFlavors}
          allFlavors={allFlavors}
          isLoadingFlavors={isLoadingFlavors}
          maxFlavors={3}
          onAdd={onAddFlavor}
          onRemove={onRemoveFlavor}
        />
      </div>

      {/* Units + Gummy Color */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Units</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {UNIT_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setUnits(p)}
                className={`px-2.5 py-1 rounded-xs text-xs font-semibold border transition-all ${
                  units === p
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {p.toLocaleString()}
              </button>
            ))}
            <Input
              type="number" min={1} value={units}
              onChange={(e) => setUnits(Number(e.target.value))}
              className="rounded-xs h-7 text-xs w-24"
            />
          </div>
          {editPricing.isRatio && editPricing.testingFeeWaived && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Testing fee waived
            </p>
          )}
        </div>

        {isColorLoading ? (
          <div className="rounded-xs bg-muted/40 border border-border px-3 py-2.5 flex items-center justify-center">
            <p className="text-xs text-muted-foreground animate-pulse">Generating color…</p>
          </div>
        ) : colorHex ? (
          <div className="rounded-xs bg-muted/40 border border-border px-3 py-2.5 flex items-center gap-3">
            <GummyVisual size={size} hue={editColorHue} compact />
            <div className="min-w-0">
              {colorName && (
                <p className="text-sm font-semibold truncate" style={{ color: colorHex }}>{colorName}</p>
              )}
            </div>
          </div>
        ) : <div />}
      </div>

      <CannabinoidEditor
        cannabinoids={cannabinoids}
        effectiveKey={effectiveKey}
        selectedKey={selectedKey}
        onSelectKey={setSelectedKey}
        onAdd={onAddCannabinoid}
        onRemove={onRemoveCannabinoid}
      />

      {/* Live pricing */}
      <div className="rounded-xs border border-border overflow-hidden text-sm">
        <div className="px-3 py-2 bg-muted/30 flex items-center justify-between gap-4">
          <span className="text-xs text-muted-foreground">${editPricing.unitCost.toFixed(4)}/unit × {units.toLocaleString()}</span>
          {editPricing.isRatio && !editPricing.testingFeeWaived && (
            <span className="text-xs text-amber-600">+${editPricing.testingFee} testing fee</span>
          )}
          <span className="font-bold text-primary ml-auto">${grandTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
