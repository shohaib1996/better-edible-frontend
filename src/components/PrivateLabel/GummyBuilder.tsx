"use client";

import { useState, useMemo } from "react";
import { Plus, FlaskConical, CheckCircle2, ChevronsUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { calculateGummyPrice } from "@/lib/gummyPricing";
import { useCreateDraftLabelMutation } from "@/redux/api/PrivateLabel/storeLabelApi";
import { useGetFlavorsQuery } from "@/redux/api/flavor/flavorsApi";
import type {
  GummySize,
  GummyOilType,
  GummyEffect,
  GummyFlavorMode,
  CannabinoidName,
} from "@/types/privateLabel/gummyBuilder";
import {
  SIZES,
  OIL_TYPES,
  EFFECTS,
  FLAVOR_MODES,
  UNIT_OPTIONS,
  CUSTOM_FLAVOR_KEY,
} from "@/lib/gummyBuilderConfig";
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
  const [flavorOpen, setFlavorOpen] = useState(false);
  const [flavorDropdown, setFlavorDropdown] = useState("");
  const [flavorName, setFlavorName] = useState("");

  const { data: flavorsData, isLoading: isLoadingFlavors } = useGetFlavorsQuery();
  const flavors = useMemo(
    () => [...(flavorsData?.flavors ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [flavorsData],
  );
  const [size, setSize] = useState<GummySize>("standard");
  const [oilType, setOilType] = useState<GummyOilType>("biomax");
  const [effect, setEffect] = useState<GummyEffect>("hybrid");
  const [flavorMode, setFlavorMode] = useState<GummyFlavorMode>("single");
  const [unitsOrdered, setUnitsOrdered] = useState(UNIT_OPTIONS[0]);
  const [cannabinoids, setCannabinoids] = useState<{ name: CannabinoidName; mg: number }[]>([]);
  const [queue, setQueue] = useState<QueuedGummy[]>([]);

  const isCustomFlavor = flavorDropdown === CUSTOM_FLAVOR_KEY;
  const effectiveFlavorName = isCustomFlavor ? flavorName : flavorDropdown;

  const [createDraft, { isLoading }] = useCreateDraftLabelMutation();

  const pricing = useMemo(
    () => calculateGummyPrice({ size, oilType, effect, flavorMode, cannabinoids, unitsOrdered }),
    [size, oilType, effect, flavorMode, cannabinoids, unitsOrdered],
  );

  const grandTotal = pricing.totalCost + (pricing.testingFeeWaived ? 0 : pricing.testingFee);

  function handleFlavorSelect(value: string) {
    setFlavorDropdown(value);
    if (value !== CUSTOM_FLAVOR_KEY) setFlavorName(value);
    else setFlavorName("");
    setFlavorOpen(false);
  }

  function resetForm() {
    setFlavorDropdown("");
    setFlavorName("");
    setSize("standard");
    setOilType("biomax");
    setEffect("hybrid");
    setFlavorMode("single");
    setUnitsOrdered(UNIT_OPTIONS[0]);
    setCannabinoids([]);
  }

  function handleQueueCurrent() {
    if (!effectiveFlavorName.trim()) { toast.error("Flavor name is required"); return; }
    setQueue((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        flavorName: effectiveFlavorName.trim(),
        size, oilType, effect, flavorMode, cannabinoids, unitsOrdered, grandTotal,
      },
    ]);
    toast.success(`"${effectiveFlavorName.trim()}" queued — configure your next gummy`);
    resetForm();
  }

  async function handleSave() {
    const hasCurrentForm = effectiveFlavorName.trim() !== "";
    if (!hasCurrentForm && queue.length === 0) { toast.error("Flavor name is required"); return; }

    const toSave: QueuedGummy[] = [
      ...queue,
      ...(hasCurrentForm
        ? [{ id: "current", flavorName: effectiveFlavorName.trim(), size, oilType, effect, flavorMode, cannabinoids, unitsOrdered, grandTotal }]
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

  const totalQueued = queue.length + (effectiveFlavorName.trim() ? 1 : 0);

  return (
    <div className="space-y-4">

      {/* Gummy visualization */}
      <div className="flex justify-center">
        <img
          src="/images/gummy-preview.png"
          alt="Gummy"
          className="h-36 w-auto object-contain"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      </div>

      {/* Flavor */}
      <div>
        <SectionLabel>Flavor</SectionLabel>
        <Popover open={flavorOpen} onOpenChange={setFlavorOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={flavorOpen}
              className={cn(
                "w-full justify-between rounded-xs h-10 text-sm font-normal",
                !flavorDropdown && "text-muted-foreground",
              )}
            >
              {isCustomFlavor
                ? (flavorName || "Other (custom)…")
                : (flavorDropdown || "Select a flavor…")}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] p-0 rounded-xs"
            align="start"
          >
            <Command className="rounded-xs">
              <CommandInput placeholder="Search flavors…" className="h-10" />
              <CommandList className="max-h-64">
                <CommandEmpty>
                  {isLoadingFlavors ? "Loading flavors…" : "No flavors found."}
                </CommandEmpty>
                <CommandGroup>
                  {flavors.map((f) => (
                    <CommandItem
                      key={f.flavorId}
                      value={f.name}
                      onSelect={handleFlavorSelect}
                      className="rounded-xs"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          flavorDropdown === f.name ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {f.name}
                    </CommandItem>
                  ))}
                  <CommandItem
                    value={CUSTOM_FLAVOR_KEY}
                    onSelect={handleFlavorSelect}
                    className="rounded-xs text-muted-foreground italic"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        flavorDropdown === CUSTOM_FLAVOR_KEY ? "opacity-100" : "opacity-0",
                      )}
                    />
                    Other (enter custom)…
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {isCustomFlavor && (
          <Input
            className="rounded-xs h-11 text-base mt-2"
            placeholder="Enter custom flavor name"
            value={flavorName}
            onChange={(e) => setFlavorName(e.target.value)}
            autoFocus
          />
        )}
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
        <Select value={String(unitsOrdered)} onValueChange={(v) => setUnitsOrdered(Number(v))}>
          <SelectTrigger className="rounded-xs h-12 text-base">
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
          disabled={isLoading || !effectiveFlavorName.trim()}
          className="rounded-xs flex-1 h-12 gap-2 text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Add Another Gummy
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading || (!effectiveFlavorName.trim() && queue.length === 0)}
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
