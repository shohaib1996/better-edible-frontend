"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, FlaskConical, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { calculateGummyPrice, CANNABINOID_OPTIONS, ALL_CANNABINOIDS, CANNABINOID_PRICES } from "@/lib/gummyPricing";
import { useCreateDraftLabelMutation } from "@/redux/api/PrivateLabel/storeLabelApi";
import type {
  GummySize,
  GummyOilType,
  GummyEffect,
  GummyFlavorMode,
  CannabinoidName,
} from "@/types/privateLabel/gummyBuilder";

interface Props {
  storeId: string;
  onSaved: () => void;
}

type OptionBtn<T> = { value: T; label: string; sub?: string };

type QueuedGummy = {
  id: string;
  flavorName: string;
  size: GummySize;
  oilType: GummyOilType;
  effect: GummyEffect;
  flavorMode: GummyFlavorMode;
  cannabinoids: { name: CannabinoidName; mg: number }[];
  unitsOrdered: number;
  grandTotal: number;
};

const SIZES: OptionBtn<GummySize>[] = [
  { value: "standard", label: "Standard" },
  { value: "xl", label: "XL", sub: "+$0.05/unit" },
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
  { value: "single", label: "Single Flavor" },
  { value: "mix", label: "Mix Flavors", sub: "+$0.05" },
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
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 sm:flex-none flex flex-col items-center sm:items-start justify-center px-3 py-3 sm:py-2 rounded-xs border transition-all text-center sm:text-left min-h-14 sm:min-h-0 ${
            value === o.value
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <span className="text-sm font-semibold leading-tight">{o.label}</span>
          {o.sub && (
            <span className={`text-[11px] leading-tight mt-0.5 ${value === o.value ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
              {o.sub}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
      {children}
    </p>
  );
}

export function GummyBuilder({ storeId, onSaved }: Props) {
  const [flavorName, setFlavorName] = useState("");
  const [size, setSize] = useState<GummySize>("standard");
  const [oilType, setOilType] = useState<GummyOilType>("biomax");
  const [effect, setEffect] = useState<GummyEffect>("hybrid");
  const [flavorMode, setFlavorMode] = useState<GummyFlavorMode>("single");
  const [unitsOrdered, setUnitsOrdered] = useState(630);
  const [cannabinoids, setCannabinoids] = useState<{ name: CannabinoidName; mg: number }[]>([]);
  const [selectedKey, setSelectedKey] = useState("CBD-100");
  const [queue, setQueue] = useState<QueuedGummy[]>([]);

  const [createDraft, { isLoading }] = useCreateDraftLabelMutation();

  const pricing = useMemo(
    () => calculateGummyPrice({ size, oilType, effect, flavorMode, cannabinoids, unitsOrdered }),
    [size, oilType, effect, flavorMode, cannabinoids, unitsOrdered],
  );

  const usedNames = new Set(cannabinoids.map((c) => c.name));
  const availableOptions = ALL_CANNABINOIDS.filter((n) => !usedNames.has(n)).flatMap((n) =>
    CANNABINOID_OPTIONS[n].map((mg) => ({ key: `${n}-${mg}`, name: n as CannabinoidName, mg })),
  );
  const effectiveKey =
    availableOptions.some((o) => o.key === selectedKey) ? selectedKey : (availableOptions[0]?.key ?? "");
  const [_selName, _selMg] = effectiveKey.split("-") as [CannabinoidName, string];
  const selectedPriceAdd = CANNABINOID_PRICES[_selName]?.[Number(_selMg)] ?? 0;

  const grandTotal = pricing.totalCost + (pricing.testingFeeWaived ? 0 : pricing.testingFee);

  function resetForm() {
    setFlavorName("");
    setSize("standard");
    setOilType("biomax");
    setEffect("hybrid");
    setFlavorMode("single");
    setUnitsOrdered(630);
    setCannabinoids([]);
  }

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

  function handleQueueCurrent() {
    if (!flavorName.trim()) { toast.error("Flavor name is required"); return; }
    if (unitsOrdered < 1) { toast.error("Units must be at least 1"); return; }
    setQueue((prev) => [
      ...prev,
      { id: Date.now().toString(), flavorName: flavorName.trim(), size, oilType, effect, flavorMode, cannabinoids, unitsOrdered, grandTotal },
    ]);
    toast.success(`"${flavorName.trim()}" queued — configure your next gummy`);
    resetForm();
  }

  function handleRemoveFromQueue(id: string) {
    setQueue((prev) => prev.filter((q) => q.id !== id));
  }

  async function handleSave() {
    const hasCurrentForm = flavorName.trim() !== "";
    if (!hasCurrentForm && queue.length === 0) {
      toast.error("Flavor name is required");
      return;
    }
    if (hasCurrentForm && unitsOrdered < 1) { toast.error("Units must be at least 1"); return; }

    const toSave: QueuedGummy[] = [
      ...queue,
      ...(hasCurrentForm
        ? [{ id: "current", flavorName: flavorName.trim(), size, oilType, effect, flavorMode, cannabinoids, unitsOrdered, grandTotal }]
        : []),
    ];

    try {
      for (const item of toSave) {
        await createDraft({
          storeId,
          flavorName: item.flavorName,
          size: item.size,
          oilType: item.oilType,
          effect: item.effect,
          flavorMode: item.flavorMode,
          cannabinoids: item.cannabinoids,
          unitsOrdered: item.unitsOrdered,
        }).unwrap();
      }
      toast.success(
        toSave.length > 1
          ? `${toSave.length} gummies saved to your line`
          : "Gummy saved to your line",
      );
      setQueue([]);
      resetForm();
      onSaved();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to save gummy");
    }
  }

  const totalQueued = queue.length + (flavorName.trim() ? 1 : 0);

  return (
    <div className="space-y-4">

      {/* Flavor name */}
      <div>
        <SectionLabel>Flavor Name</SectionLabel>
        <Input
          placeholder="e.g. Mango Haze"
          value={flavorName}
          onChange={(e) => setFlavorName(e.target.value)}
          className="rounded-xs h-12 text-base"
        />
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

      {/* Effect + Flavor Mode */}
      <div className="rounded-xs bg-muted/20 border border-border p-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <SectionLabel>Effect</SectionLabel>
          <SegmentGroup options={EFFECTS} value={effect} onChange={setEffect} />
        </div>
        <div className="border-t sm:border-t-0 sm:border-l border-border pt-4 sm:pt-0 sm:pl-4">
          <SectionLabel>Flavor Mode</SectionLabel>
          <SegmentGroup options={FLAVOR_MODES} value={flavorMode} onChange={setFlavorMode} />
        </div>
      </div>

      {/* Units */}
      <div>
        <SectionLabel>Units Ordered</SectionLabel>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="grid grid-cols-4 sm:flex gap-2 sm:gap-1.5">
            {UNIT_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setUnitsOrdered(p)}
                className={`py-3 sm:py-1.5 sm:px-3 rounded-xs text-sm font-semibold border transition-all ${
                  unitsOrdered === p
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {p >= 1000 ? `${p / 1000}k` : p}
              </button>
            ))}
          </div>
          <Input
            type="number"
            min={1}
            value={unitsOrdered}
            onChange={(e) => setUnitsOrdered(Number(e.target.value))}
            className="rounded-xs h-11 sm:h-8 sm:w-28 text-sm"
            placeholder="Custom"
          />
        </div>
        {pricing.isRatio && pricing.testingFeeWaived && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Testing fee waived — 3,000+ units
          </p>
        )}
      </div>

      {/* Cannabinoid Add-ons */}
      <div>
        <SectionLabel>
          Cannabinoid Add-ons{" "}
          <span className="normal-case font-normal text-muted-foreground/60 tracking-normal">(optional)</span>
        </SectionLabel>

        {cannabinoids.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-2.5 rounded-xs bg-muted/30 border border-border">
            {cannabinoids.map((c) => (
              <Badge key={c.name} variant="secondary" className="rounded-xs gap-1.5 pl-2.5 pr-1.5 py-1.5">
                <span className="font-semibold text-xs">{c.name}</span>
                <span className="text-muted-foreground text-xs">{c.mg}mg</span>
                <button type="button" onClick={() => handleRemoveCannabinoid(c.name)} className="ml-0.5 hover:text-destructive transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {availableOptions.length > 0 && (
          <div className="flex items-center gap-2">
            <Select value={effectiveKey} onValueChange={setSelectedKey}>
              <SelectTrigger className="flex-1 sm:flex-none sm:w-auto sm:min-w-40 h-11 sm:h-9 rounded-xs text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xs">
                {ALL_CANNABINOIDS.filter((n) => !usedNames.has(n)).map((name) => (
                  <SelectGroup key={name}>
                    <SelectLabel className="text-xs font-bold text-foreground px-2 py-1">{name}</SelectLabel>
                    {CANNABINOID_OPTIONS[name].map((mg) => (
                      <SelectItem key={`${name}-${mg}`} value={`${name}-${mg}`} className="rounded-xs pl-4">
                        {name} {mg}mg
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              className="rounded-xs gap-1.5 h-11 shrink-0 px-4"
              onClick={handleAddCannabinoid}
            >
              <Plus className="w-4 h-4" />
              {cannabinoids.length === 0 ? "Add" : "Add Another"}
            </Button>
          </div>
        )}

        {selectedPriceAdd > 0 && availableOptions.length > 0 && (
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mt-1.5">
            +${selectedPriceAdd.toFixed(2)}/unit added to price
          </p>
        )}
      </div>

      {/* Pricing card */}
      <div className="rounded-xs border border-border overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Live Pricing</p>
        </div>
        <div className="px-4 py-3 space-y-2 text-sm">
          <div className="flex justify-between text-muted-foreground">
            <span>Unit cost</span>
            <span className="font-mono font-medium text-foreground">${pricing.unitCost.toFixed(4)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>× {unitsOrdered.toLocaleString()} units</span>
            <span className="font-mono">${pricing.totalCost.toFixed(2)}</span>
          </div>
          {pricing.isRatio && (
            <div className="flex justify-between text-muted-foreground">
              <span>Testing fee</span>
              {pricing.testingFeeWaived ? (
                <span className="text-green-600 dark:text-green-400 font-medium">Waived</span>
              ) : (
                <span className="text-amber-600 dark:text-amber-400">+${pricing.testingFee}</span>
              )}
            </div>
          )}
        </div>
        <div className="px-4 py-3 bg-primary/5 border-t border-border flex items-center justify-between">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-2xl font-bold text-primary">${grandTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Queue preview */}
      {queue.length > 0 && (
        <div className="rounded-xs border border-border overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Queued — {queue.length} gummy{queue.length !== 1 ? "s" : ""}
            </p>
            <span className="text-xs text-muted-foreground font-mono">
              ${queue.reduce((s, q) => s + q.grandTotal, 0).toFixed(2)}
            </span>
          </div>
          <div className="divide-y divide-border">
            {queue.map((item) => (
              <div key={item.id} className="px-4 py-2.5 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{item.flavorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.oilType === "rosin" ? "Rosin" : "BioMax"} · {item.size === "xl" ? "XL" : "Std"} · {item.effect} · {item.unitsOrdered.toLocaleString()} units
                    {item.cannabinoids.length > 0 && ` · ${item.cannabinoids.map((c) => `${c.name} ${c.mg}mg`).join(", ")}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-semibold font-mono">${item.grandTotal.toFixed(2)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFromQueue(item.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleQueueCurrent}
          disabled={isLoading || !flavorName.trim()}
          className="rounded-xs flex-1 h-12 gap-2 text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Add Another Gummy
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading || (!flavorName.trim() && queue.length === 0)}
          className="rounded-xs flex-1 h-12 gap-2 text-base font-semibold"
        >
          <FlaskConical className="w-4 h-4" />
          {isLoading
            ? "Saving…"
            : totalQueued > 1
            ? `Save All (${totalQueued}) to My Line`
            : "Save to My Line"}
        </Button>
      </div>

    </div>
  );
}
