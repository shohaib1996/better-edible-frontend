"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, FlaskConical, CheckCircle2 } from "lucide-react";
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
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex flex-col items-start px-3 py-2 rounded-xs border transition-all text-left ${
            value === o.value
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <span className="text-sm font-semibold leading-tight">{o.label}</span>
          {o.sub && (
            <span className={`text-[10px] leading-tight mt-0.5 ${value === o.value ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
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
    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
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

  async function handleSave() {
    if (!flavorName.trim()) { toast.error("Flavor name is required"); return; }
    if (unitsOrdered < 1) { toast.error("Units must be at least 1"); return; }
    try {
      await createDraft({ storeId, flavorName: flavorName.trim(), size, oilType, effect, flavorMode, cannabinoids, unitsOrdered }).unwrap();
      toast.success("Gummy saved to your line");
      setFlavorName("");
      setSize("standard");
      setOilType("biomax");
      setEffect("hybrid");
      setFlavorMode("single");
      setUnitsOrdered(630);
      setCannabinoids([]);
      onSaved();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to save gummy");
    }
  }

  return (
    <div className="space-y-5">

      {/* Flavor name */}
      <div>
        <SectionLabel>Flavor Name</SectionLabel>
        <Input
          placeholder="e.g. Mango Haze"
          value={flavorName}
          onChange={(e) => setFlavorName(e.target.value)}
          className="rounded-xs h-11 text-base"
        />
      </div>

      {/* Size + Oil Type — 2 col */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xs bg-muted/20 border border-border">
        <div>
          <SectionLabel>Gummy Size</SectionLabel>
          <SegmentGroup options={SIZES} value={size} onChange={setSize} />
        </div>
        <div>
          <SectionLabel>Oil Type</SectionLabel>
          <SegmentGroup options={OIL_TYPES} value={oilType} onChange={setOilType} />
        </div>
      </div>

      {/* Effect + Flavor Mode — 2 col */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xs bg-muted/20 border border-border">
        <div>
          <SectionLabel>Effect</SectionLabel>
          <SegmentGroup options={EFFECTS} value={effect} onChange={setEffect} />
        </div>
        <div>
          <SectionLabel>Flavor Mode</SectionLabel>
          <SegmentGroup options={FLAVOR_MODES} value={flavorMode} onChange={setFlavorMode} />
        </div>
      </div>

      {/* Units */}
      <div>
        <SectionLabel>Units Ordered</SectionLabel>
        <div className="flex items-center gap-2 flex-wrap">
          {UNIT_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setUnitsOrdered(p)}
              className={`px-3 py-1.5 rounded-xs text-xs font-semibold border transition-all ${
                unitsOrdered === p
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {p.toLocaleString()}
            </button>
          ))}
          <Input
            type="number"
            min={1}
            value={unitsOrdered}
            onChange={(e) => setUnitsOrdered(Number(e.target.value))}
            className="rounded-xs w-28 h-8 text-sm"
          />
        </div>
        {pricing.isRatio && pricing.testingFeeWaived && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1.5 flex items-center gap-1">
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
          <div className="flex flex-wrap gap-2 mb-2 p-2.5 rounded-xs bg-muted/30 border border-border">
            {cannabinoids.map((c) => (
              <Badge key={c.name} variant="secondary" className="rounded-xs gap-1.5 pl-2.5 pr-1.5 py-1">
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
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={effectiveKey} onValueChange={setSelectedKey}>
              <SelectTrigger className="w-auto min-w-[130px] h-9 rounded-xs text-sm">
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
            {selectedPriceAdd > 0 && (
              <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                +${selectedPriceAdd.toFixed(2)}/unit
              </span>
            )}
            <Button type="button" variant="outline" size="sm" className="rounded-xs gap-1.5" onClick={handleAddCannabinoid}>
              <Plus className="w-3.5 h-3.5" />
              {cannabinoids.length === 0 ? "Add" : "Add Another"}
            </Button>
          </div>
        )}
      </div>

      {/* Pricing card */}
      <div className="rounded-xs border border-border overflow-hidden">
        <div className="px-4 py-2.5 bg-muted/40 border-b border-border">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Live Pricing</p>
        </div>
        <div className="px-4 py-3 space-y-1.5 text-sm">
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

      <Button
        onClick={handleSave}
        disabled={isLoading || !flavorName.trim()}
        className="rounded-xs w-full h-11 gap-2 text-sm font-semibold"
      >
        <FlaskConical className="w-4 h-4" />
        {isLoading ? "Saving…" : "Save to My Line"}
      </Button>
    </div>
  );
}
