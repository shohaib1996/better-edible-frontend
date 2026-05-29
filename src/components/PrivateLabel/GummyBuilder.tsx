"use client";

import { useState, useMemo } from "react";
import { Plus, FlaskConical, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { calculateGummyPrice } from "@/lib/gummyPricing";
import { useCreateDraftLabelMutation } from "@/redux/api/PrivateLabel/storeLabelApi";
import type {
  GummySize,
  GummyOilType,
  GummyEffect,
  GummyFlavorMode,
  CannabinoidName,
} from "@/types/privateLabel/gummyBuilder";
import { SIZES, OIL_TYPES, EFFECTS, FLAVOR_MODES, UNIT_PRESETS } from "@/lib/gummyBuilderConfig";
import type { QueuedGummy } from "@/lib/gummyBuilderConfig";
import { SegmentGroup, SectionLabel } from "./SegmentGroup";
import { CannabinoidSelector } from "./CannabinoidSelector";
import { GummyPricingCard } from "./GummyPricingCard";
import { GummyQueue } from "./GummyQueue";

interface Props {
  storeId: string;
  onSaved: () => void;
}

export function GummyBuilder({ storeId, onSaved }: Props) {
  const [flavorName, setFlavorName] = useState("");
  const [size, setSize] = useState<GummySize>("standard");
  const [oilType, setOilType] = useState<GummyOilType>("biomax");
  const [effect, setEffect] = useState<GummyEffect>("hybrid");
  const [flavorMode, setFlavorMode] = useState<GummyFlavorMode>("single");
  const [unitsOrdered, setUnitsOrdered] = useState(630);
  const [cannabinoids, setCannabinoids] = useState<{ name: CannabinoidName; mg: number }[]>([]);
  const [queue, setQueue] = useState<QueuedGummy[]>([]);

  const [createDraft, { isLoading }] = useCreateDraftLabelMutation();

  const pricing = useMemo(
    () => calculateGummyPrice({ size, oilType, effect, flavorMode, cannabinoids, unitsOrdered }),
    [size, oilType, effect, flavorMode, cannabinoids, unitsOrdered],
  );

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

  function handleQueueCurrent() {
    if (!flavorName.trim()) { toast.error("Flavor name is required"); return; }
    if (unitsOrdered < 1) { toast.error("Units must be at least 1"); return; }
    setQueue((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        flavorName: flavorName.trim(),
        size, oilType, effect, flavorMode, cannabinoids, unitsOrdered, grandTotal,
      },
    ]);
    toast.success(`"${flavorName.trim()}" queued — configure your next gummy`);
    resetForm();
  }

  async function handleSave() {
    const hasCurrentForm = flavorName.trim() !== "";
    if (!hasCurrentForm && queue.length === 0) { toast.error("Flavor name is required"); return; }
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
        toSave.length > 1 ? `${toSave.length} gummies saved to your line` : "Gummy saved to your line",
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

      {/* Cannabinoid add-ons */}
      <CannabinoidSelector
        cannabinoids={cannabinoids}
        onAdd={(entry) => setCannabinoids((prev) => [...prev, entry])}
        onRemove={(name) => setCannabinoids((prev) => prev.filter((c) => c.name !== name))}
      />

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
