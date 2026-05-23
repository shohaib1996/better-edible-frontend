"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { calculateGummyPrice, CANNABINOID_OPTIONS, ALL_CANNABINOIDS } from "@/lib/gummyPricing";
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

type OptionBtn<T> = { value: T; label: string };

const SIZES: OptionBtn<GummySize>[] = [
  { value: "standard", label: "Standard" },
  { value: "xl", label: "XL (+$0.05)" },
];
const OIL_TYPES: OptionBtn<GummyOilType>[] = [
  { value: "biomax", label: "BioMax  — $1.75/unit" },
  { value: "rosin", label: "Rosin — $2.50/unit" },
];
const EFFECTS: OptionBtn<GummyEffect>[] = [
  { value: "hybrid", label: "Hybrid" },
  { value: "indica", label: "Indica (+$0.05)" },
  { value: "sativa", label: "Sativa (+$0.05)" },
];
const FLAVOR_MODES: OptionBtn<GummyFlavorMode>[] = [
  { value: "single", label: "Single Flavor" },
  { value: "mix", label: "Mix Flavors (+$0.05)" },
];

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
          className={`px-3 py-1.5 rounded-xs text-sm font-medium border transition-all ${
            value === o.value
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
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
  const [newCannabinoid, setNewCannabinoid] = useState<CannabinoidName>("CBD");
  const [newMg, setNewMg] = useState<number>(CANNABINOID_OPTIONS["CBD"][0]);

  const [createDraft, { isLoading }] = useCreateDraftLabelMutation();

  const pricing = useMemo(
    () => calculateGummyPrice({ size, oilType, effect, flavorMode, cannabinoids, unitsOrdered }),
    [size, oilType, effect, flavorMode, cannabinoids, unitsOrdered]
  );

  const availableMgOptions = CANNABINOID_OPTIONS[newCannabinoid];

  function handleAddCannabinoid() {
    const already = cannabinoids.find((c) => c.name === newCannabinoid);
    if (already) {
      toast.error(`${newCannabinoid} is already added`);
      return;
    }
    setCannabinoids((prev) => [...prev, { name: newCannabinoid, mg: newMg }]);
  }

  function handleRemoveCannabinoid(name: CannabinoidName) {
    setCannabinoids((prev) => prev.filter((c) => c.name !== name));
  }

  function handleChangeCannabinoidName(v: CannabinoidName) {
    setNewCannabinoid(v);
    setNewMg(CANNABINOID_OPTIONS[v][0]);
  }

  async function handleSave() {
    if (!flavorName.trim()) {
      toast.error("Flavor name is required");
      return;
    }
    if (unitsOrdered < 1) {
      toast.error("Units must be at least 1");
      return;
    }
    try {
      await createDraft({
        storeId,
        flavorName: flavorName.trim(),
        size,
        oilType,
        effect,
        flavorMode,
        cannabinoids,
        unitsOrdered,
      }).unwrap();
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
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Flavor Name
        </label>
        <Input
          placeholder="e.g. Mango Haze"
          value={flavorName}
          onChange={(e) => setFlavorName(e.target.value)}
          className="rounded-xs"
        />
      </div>

      {/* Size */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Gummy Size
        </label>
        <SegmentGroup options={SIZES} value={size} onChange={setSize} />
      </div>

      {/* Oil type */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Oil Type
        </label>
        <SegmentGroup options={OIL_TYPES} value={oilType} onChange={setOilType} />
      </div>

      {/* Effect */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Effect
        </label>
        <SegmentGroup options={EFFECTS} value={effect} onChange={setEffect} />
      </div>

      {/* Flavor mode */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Flavor Mode
        </label>
        <SegmentGroup options={FLAVOR_MODES} value={flavorMode} onChange={setFlavorMode} />
      </div>

      {/* Units */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Units Ordered
        </label>
        <Input
          type="number"
          min={1}
          value={unitsOrdered}
          onChange={(e) => setUnitsOrdered(Number(e.target.value))}
          className="rounded-xs w-40"
        />
      </div>

      {/* Cannabinoids */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Cannabinoid Add-ons <span className="normal-case font-normal">(optional — ratio products)</span>
        </label>

        {cannabinoids.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {cannabinoids.map((c) => (
              <Badge
                key={c.name}
                variant="secondary"
                className="rounded-xs gap-1.5 pl-2.5 pr-1.5 py-1"
              >
                {c.name} {c.mg}mg
                <button
                  type="button"
                  onClick={() => handleRemoveCannabinoid(c.name)}
                  className="hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={newCannabinoid}
            onChange={(e) => handleChangeCannabinoidName(e.target.value as CannabinoidName)}
            className="h-9 rounded-xs border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {ALL_CANNABINOIDS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={newMg}
            onChange={(e) => setNewMg(Number(e.target.value))}
            className="h-9 rounded-xs border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {availableMgOptions.map((mg) => (
              <option key={mg} value={mg}>
                {mg}mg
              </option>
            ))}
          </select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xs gap-1.5"
            onClick={handleAddCannabinoid}
            disabled={cannabinoids.some((c) => c.name === newCannabinoid)}
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </Button>
        </div>
      </div>

      {/* Live pricing summary */}
      <div className="rounded-xs border border-border bg-muted/40 p-4 space-y-2 text-sm">
        <div className="font-semibold text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Pricing Preview
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Unit cost</span>
          <span className="font-medium">${pricing.unitCost.toFixed(4)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Total ({unitsOrdered.toLocaleString()} units)
          </span>
          <span className="font-medium">${pricing.totalCost.toFixed(2)}</span>
        </div>
        {pricing.isRatio && (
          <div className="flex justify-between border-t border-border pt-2 mt-1">
            <span className="text-muted-foreground">Testing fee</span>
            {pricing.testingFeeWaived ? (
              <span className="text-green-600 font-medium">Waived (3,000+ units)</span>
            ) : (
              <span className="text-amber-600 font-medium">${pricing.testingFee} (pay or join pool)</span>
            )}
          </div>
        )}
      </div>

      <Button
        onClick={handleSave}
        disabled={isLoading || !flavorName.trim()}
        className="rounded-xs w-full gap-2"
      >
        <FlaskConical className="w-4 h-4" />
        {isLoading ? "Saving…" : "Save to My Line"}
      </Button>
    </div>
  );
}
