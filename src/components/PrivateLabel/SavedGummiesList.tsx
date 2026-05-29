"use client";

import { useState, useMemo } from "react";
import { Trash2, Pencil, Check, X, FlaskConical, Plus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  GummyFlavorMode,
  CannabinoidName,
} from "@/types/privateLabel/gummyBuilder";

interface Props {
  storeId: string;
  labels: IStoreDraftLabel[];
  isLoading: boolean;
}

type OptionBtn<T> = { value: T; label: string; sub?: string };

const SIZES: OptionBtn<GummySize>[] = [
  { value: "standard", label: "Standard" },
  { value: "xl", label: "XL", sub: "+$0.05" },
];
const OIL_TYPES: OptionBtn<GummyOilType>[] = [
  { value: "biomax", label: "BioMax", sub: "$1.75/unit" },
  { value: "rosin", label: "Rosin", sub: "$2.50/unit" },
];
const EFFECTS: OptionBtn<GummyEffect>[] = [
  { value: "hybrid", label: "Hybrid" },
  { value: "indica", label: "Indica", sub: "+$0.05" },
  { value: "sativa", label: "Sativa", sub: "+$0.05" },
];
const FLAVOR_MODES: OptionBtn<GummyFlavorMode>[] = [
  { value: "single", label: "Single" },
  { value: "mix", label: "Mix", sub: "+$0.05" },
];
const UNIT_PRESETS = [630, 1000, 2000, 3000];

function SegmentGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: OptionBtn<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex flex-col items-start px-2.5 py-1.5 rounded-xs border text-left transition-all ${
            value === o.value
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <span className="text-xs font-semibold leading-tight">{o.label}</span>
          {o.sub && (
            <span className={`text-[9px] leading-tight ${value === o.value ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              {o.sub}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function LabelCard({ label, storeId }: { label: IStoreDraftLabel; storeId: string }) {
  const [editing, setEditing] = useState(false);
  const [flavorName, setFlavorName] = useState(label.flavorName);
  const [size, setSize] = useState<GummySize>(label.size);
  const [oilType, setOilType] = useState<GummyOilType>(label.oilType);
  const [effect, setEffect] = useState<GummyEffect>(label.effect);
  const [flavorMode, setFlavorMode] = useState<GummyFlavorMode>(label.flavorMode);
  const [units, setUnits] = useState(label.unitsOrdered);
  const [cannabinoids, setCannabinoids] = useState(label.cannabinoids.map((c) => ({ name: c.name, mg: c.mg })));
  const [selectedKey, setSelectedKey] = useState("CBD-100");

  const [updateDraft, { isLoading: isSaving }] = useUpdateDraftLabelMutation();
  const [deleteDraft, { isLoading: isDeleting }] = useDeleteDraftLabelMutation();

  const editPricing = useMemo(
    () => calculateGummyPrice({ size, oilType, effect, flavorMode, cannabinoids, unitsOrdered: units }),
    [size, oilType, effect, flavorMode, cannabinoids, units],
  );

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

  function handleCancel() {
    setFlavorName(label.flavorName);
    setSize(label.size);
    setOilType(label.oilType);
    setEffect(label.effect);
    setFlavorMode(label.flavorMode);
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
        flavorMode,
        cannabinoids,
        unitsOrdered: units,
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
    const flavorModeLabel = label.flavorMode === "mix" ? "Mix" : "Single";

    return (
      <div className="rounded-xs border border-border bg-card p-4 space-y-3">
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

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="rounded-xs text-xs">{oilLabel}</Badge>
          <Badge variant="outline" className="rounded-xs text-xs">{sizeLabel}</Badge>
          <Badge variant="outline" className="rounded-xs text-xs">{effectLabel}</Badge>
          <Badge variant="outline" className="rounded-xs text-xs">{flavorModeLabel} flavor</Badge>
          {label.cannabinoids.map((c) => (
            <Badge key={c.name} variant="secondary" className="rounded-xs text-xs">{c.name} {c.mg}mg</Badge>
          ))}
        </div>

        <div className="flex items-center justify-between text-sm gap-4">
          <span className="text-muted-foreground text-xs">{label.unitsOrdered.toLocaleString()} units</span>
          <div className="text-right">
            <span className="font-semibold">${(label.totalCost ?? 0).toFixed(2)}</span>
            <span className="text-muted-foreground text-xs ml-1">(${(label.unitCost ?? 0).toFixed(4)}/ea)</span>
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

      {/* Effect + Flavor Mode */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Effect</p>
          <SegmentGroup options={EFFECTS} value={effect} onChange={setEffect} />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Flavor Mode</p>
          <SegmentGroup options={FLAVOR_MODES} value={flavorMode} onChange={setFlavorMode} />
        </div>
      </div>

      {/* Units */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Units</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {UNIT_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setUnits(p)}
              className={`px-2.5 py-1 rounded-xs text-xs font-semibold border transition-all ${
                units === p ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:bg-muted"
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

export function SavedGummiesList({ storeId, labels, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-xs border border-border bg-card p-4 h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  if (labels.length === 0) {
    return (
      <div className="rounded-xs border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
        No gummies saved yet. Use the builder to add your first SKU.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {labels.map((label) => (
        <LabelCard key={label._id} label={label} storeId={storeId} />
      ))}
    </div>
  );
}
