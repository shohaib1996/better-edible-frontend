"use client";

import { useState, useMemo, useCallback } from "react";

const COLOR_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/store/labels/gummy-color`;
import { Trash2, Pencil, Check, X, FlaskConical, Plus, CheckCircle2 } from "lucide-react";
import { GummyVisual } from "./GummyVisual";
import { FlavorPicker } from "./FlavorPicker";
import { hexToHueRotation } from "@/lib/useGummyBuilder";
import { useGetFlavorsQuery } from "@/redux/api/flavor/flavorsApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { calculateGummyPrice, CANNABINOID_OPTIONS, ALL_CANNABINOIDS } from "@/lib/gummyPricing";
import {
  useUpdateDraftLabelMutation,
  useDeleteDraftLabelMutation,
} from "@/redux/api/PrivateLabel/storeLabelApi";
import type {
  IStoreDraftLabel,
  GummySize,
  GummyOilType,
  GummyEffect,
  CannabinoidName,
} from "@/types/privateLabel/gummyBuilder";
import { SIZES, OIL_TYPES, EFFECTS } from "@/lib/gummyBuilderConfig";
import { SegmentGroup } from "./SegmentGroup";

const UNIT_PRESETS = [630, 1000, 2000, 3000];

export function LabelCard({ label, storeId }: { label: IStoreDraftLabel; storeId: string }) {
  const [editing, setEditing] = useState(false);
  const [flavorName, setFlavorName] = useState(label.flavorName);
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>(label.selectedFlavors ?? []);
  const [colorHex, setColorHex] = useState<string | undefined>(label.gummyColorHex);
  const [colorName, setColorName] = useState<string | undefined>(label.gummyColorName);
  const [isColorLoading, setIsColorLoading] = useState(false);
  const [size, setSize] = useState<GummySize>(label.size);
  const [oilType, setOilType] = useState<GummyOilType>(label.oilType);
  const [effect, setEffect] = useState<GummyEffect>(label.effect);
  const [units, setUnits] = useState(label.unitsOrdered);
  const [cannabinoids, setCannabinoids] = useState(label.cannabinoids.map((c) => ({ name: c.name, mg: c.mg })));
  const [selectedKey, setSelectedKey] = useState("CBD-100");

  const { data: flavorsData, isLoading: isLoadingFlavors } = useGetFlavorsQuery();
  const allFlavors = useMemo(
    () => [...(flavorsData?.flavors ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [flavorsData],
  );
  const maxFlavors = 3;

  const [updateDraft, { isLoading: isSaving }] = useUpdateDraftLabelMutation();
  const [deleteDraft, { isLoading: isDeleting }] = useDeleteDraftLabelMutation();

  const editPricing = useMemo(
    () => calculateGummyPrice({ size, oilType, effect, cannabinoids, unitsOrdered: units }),
    [size, oilType, effect, cannabinoids, units],
  );
// Ensure selected cannabinoid option is valid
  const usedNames = new Set(cannabinoids.map((c) => c.name));
  const availableOptions = ALL_CANNABINOIDS.filter((n) => !usedNames.has(n)).flatMap((n) =>
    CANNABINOID_OPTIONS[n].map((mg) => ({ key: `${n}-${mg}`, name: n as CannabinoidName, mg })),
  );
  const effectiveKey =
    availableOptions.some((o) => o.key === selectedKey) ? selectedKey : (availableOptions[0]?.key ?? "");

  function handleAddCannabinoid() {
    const opt = availableOptions.find((o) => o.key === effectiveKey);
    if (!opt) return;
    setCannabinoids((prev) => [...prev, { name: opt.name, mg: opt.mg }]);
    const next = availableOptions.find((o) => o.key !== effectiveKey);
    setSelectedKey(next?.key ?? "CBD-100");
  }

  function handleRemoveCannabinoid(name: CannabinoidName) {
    setCannabinoids((prev) => prev.filter((c) => c.name !== name));
  }

  const fetchColor = useCallback(async (flavors: string[]) => {
    if (flavors.length === 0) return;
    setIsColorLoading(true);
    try {
      const res = await fetch(COLOR_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flavor: flavors.join(", ") }),
      });
      const data = await res.json();
      const hex: string | undefined = data?.hex;
      if (hex && /^#[0-9A-Fa-f]{6}$/.test(hex)) {
        setColorHex(hex);
        setColorName(data.name ?? undefined);
      }
    } catch {
      // silently fail — keep current color
    } finally {
      setIsColorLoading(false);
    }
  }, []);

  function handleAddFlavor(name: string) {
    const updated = [...selectedFlavors, name];
    setSelectedFlavors(updated);
    fetchColor(updated);
  }

  function handleRemoveFlavor(name: string) {
    const updated = selectedFlavors.filter((f) => f !== name);
    setSelectedFlavors(updated);
    if (updated.length > 0) fetchColor(updated);
  }

  function handleCancel() {
    setFlavorName(label.flavorName);
    setSelectedFlavors(label.selectedFlavors ?? []);
    setColorHex(label.gummyColorHex);
    setColorName(label.gummyColorName);
    setSize(label.size);
    setOilType(label.oilType);
    setEffect(label.effect);
    setUnits(label.unitsOrdered);
    setCannabinoids(label.cannabinoids.map((c) => ({ name: c.name, mg: c.mg })));
    setEditing(false);
  }

  async function handleSave() {
    try {
      await updateDraft({
        id: label._id,
        storeId,
        flavorName,
        size,
        oilType,
        effect,
        cannabinoids,
        unitsOrdered: units,
        selectedFlavors,
        ...(colorHex && { gummyColorHex: colorHex, gummyColorName: colorName }),
      }).unwrap();
      toast.success("Updated");
      setEditing(false);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to update");
    }
  }

  async function handleDelete() {
    try {
      await deleteDraft({ id: label._id, storeId }).unwrap();
      toast.success("Removed from line");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to delete");
    }
  }

  // ── View mode ──────────────────────────────────────────
  if (!editing) {
    const oilLabel = label.oilType === "rosin" ? "Rosin" : "BioMax";
    const sizeLabel = label.size === "xl" ? "XL" : "Standard";
    const effectLabel = label.effect.charAt(0).toUpperCase() + label.effect.slice(1);
    const gummyHue = label.gummyColorHex ? hexToHueRotation(label.gummyColorHex) : 0;

    return (
      <div className="rounded-xs border border-border bg-card p-4 space-y-3">
        <div className="flex items-start gap-3">
          {/* Gummy visual */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <GummyVisual size={label.size} hue={gummyHue} compact />
            {label.gummyColorHex && (
              <span
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: label.gummyColorHex }}
                title={label.gummyColorName ?? label.gummyColorHex}
              />
            )}
          </div>

          {/* Card body */}
          <div className="flex-1 min-w-0 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FlaskConical className="w-4 h-4 text-primary shrink-0" />
                <span className="font-semibold text-sm truncate">{label.flavorName}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button size="icon" variant="ghost" className="h-7 w-7 rounded-xs" onClick={() => setEditing(true)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon" variant="ghost"
                  className="h-7 w-7 rounded-xs text-destructive hover:text-destructive"
                  onClick={handleDelete} disabled={isDeleting}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {label.gummyColorName && (
              <p className="text-sm font-medium" style={{ color: label.gummyColorHex }}>{label.gummyColorName}</p>
            )}

            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="rounded-xs text-xs">{oilLabel}</Badge>
              <Badge variant="outline" className="rounded-xs text-xs">{sizeLabel}</Badge>
              <Badge variant="outline" className="rounded-xs text-xs">{effectLabel}</Badge>
              {label.cannabinoids.map((c) => (
                <Badge key={c.name} variant="secondary" className="rounded-xs text-xs">{c.name} {c.mg}mg</Badge>
              ))}
              {(label.selectedFlavors ?? []).map((f) => (
                <Badge key={f} className="rounded-xs text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10">{f}</Badge>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm gap-4">
              <span className="text-muted-foreground text-xs">{label.unitsOrdered.toLocaleString()} units</span>
              <div className="text-right">
                <span className="font-semibold">${(label.totalCost ?? 0).toFixed(2)}</span>
                <span className="text-muted-foreground text-xs ml-1">(${(label.unitCost ?? 0).toFixed(4)}/ea)</span>
              </div>
            </div>
          </div>
        </div>

        {label.isRatio && !label.testingFeeWaived && (
          <div className="rounded-xs bg-amber-400/10 border border-amber-400/30 px-3 py-2 text-xs text-amber-800 dark:text-amber-400">
            +$250 testing fee applies — order 3,000+ units to waive.
          </div>
        )}
        {label.isRatio && label.testingFeeWaived && (
          <div className="rounded-xs bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-3 py-2 text-xs text-green-700 dark:text-green-400">
            Testing fee waived — 3,000+ units.
          </div>
        )}
      </div>
    );
  }

  // ── Edit mode ──────────────────────────────────────────
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
          <Button size="sm" className="rounded-xs h-8 gap-1.5" onClick={handleSave} disabled={isSaving}>
            <Check className="w-3.5 h-3.5" /> Save
          </Button>
          <Button size="sm" variant="ghost" className="rounded-xs h-8" onClick={handleCancel}>
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
          maxFlavors={maxFlavors}
          onAdd={handleAddFlavor}
          onRemove={handleRemoveFlavor}
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

      {/* Cannabinoids */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Cannabinoids</p>
        {cannabinoids.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {cannabinoids.map((c) => (
              <Badge key={c.name} variant="secondary" className="rounded-xs gap-1.5 pl-2.5 pr-1.5 py-1 text-xs">
                <span className="font-semibold">{c.name}</span>
                <span className="text-muted-foreground">{c.mg}mg</span>
                <button type="button" onClick={() => handleRemoveCannabinoid(c.name)} className="ml-0.5 hover:text-destructive transition-colors">
                  <X className="w-2.5 h-2.5" />
                </button>
              </Badge>
            ))}
          </div>
        )}
        {availableOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={effectiveKey} onValueChange={setSelectedKey}>
              <SelectTrigger className="w-auto min-w-[130px] h-8 rounded-xs text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xs">
                {ALL_CANNABINOIDS.filter((n) => !usedNames.has(n)).map((name) => (
                  <SelectGroup key={name}>
                    <SelectLabel className="text-xs font-bold text-foreground px-2 py-1">{name}</SelectLabel>
                    {CANNABINOID_OPTIONS[name].map((mg) => (
                      <SelectItem key={`${name}-${mg}`} value={`${name}-${mg}`} className="rounded-xs pl-4 text-xs">
                        {name} {mg}mg
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="sm" className="rounded-xs h-8 gap-1 text-xs" onClick={handleAddCannabinoid}>
              <Plus className="w-3 h-3" />
              {cannabinoids.length === 0 ? "Add" : "Add Another"}
            </Button>
          </div>
        )}
        {cannabinoids.length === 0 && availableOptions.length === 0 && (
          <p className="text-xs text-muted-foreground">No cannabinoids</p>
        )}
      </div>

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
