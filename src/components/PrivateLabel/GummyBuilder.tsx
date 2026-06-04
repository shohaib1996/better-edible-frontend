"use client";

import { useState, useMemo } from "react";
import { FlaskConical, CheckCircle2, ChevronsUpDown, Check, X, Plus, Layers } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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
} from "@/lib/gummyBuilderConfig";
import type { QueuedGummy } from "@/lib/gummyBuilderConfig";
import { SegmentGroup, SectionLabel } from "./SegmentGroup";
import { CannabinoidSelector } from "./CannabinoidSelector";
import { GummyPricingCard } from "./GummyPricingCard";
import { GummyQueue } from "./GummyQueue";

const MAX_MIX_FLAVORS = 3;

interface Props {
  storeId: string;
  onSaved: () => void;
}

export function GummyBuilder({ storeId, onSaved }: Props) {
  const [flavorName, setFlavorName] = useState("");
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [flavorOpen, setFlavorOpen] = useState(false);

  const [size, setSize] = useState<GummySize>("standard");
  const [oilType, setOilType] = useState<GummyOilType>("biomax");
  const [effect, setEffect] = useState<GummyEffect>("hybrid");
  const [flavorMode, setFlavorMode] = useState<GummyFlavorMode>("single");
  const [unitsOrdered, setUnitsOrdered] = useState(UNIT_OPTIONS[0]);
  const [cannabinoids, setCannabinoids] = useState<{ name: CannabinoidName; mg: number }[]>([]);
  const [queue, setQueue] = useState<QueuedGummy[]>([]);

  const { data: flavorsData, isLoading: isLoadingFlavors } = useGetFlavorsQuery();
  const allFlavors = useMemo(
    () => [...(flavorsData?.flavors ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [flavorsData],
  );

  // In single mode max 1 flavor; in mix mode max 3
  const maxFlavors = flavorMode === "mix" ? MAX_MIX_FLAVORS : 1;
  const canAddFlavor = selectedFlavors.length < maxFlavors;
  const availableFlavors = allFlavors.filter((f) => !selectedFlavors.includes(f.name));

  const [createDraft, { isLoading }] = useCreateDraftLabelMutation();

  const pricing = useMemo(
    () => calculateGummyPrice({ size, oilType, effect, flavorMode, cannabinoids, unitsOrdered }),
    [size, oilType, effect, flavorMode, cannabinoids, unitsOrdered],
  );
  const grandTotal = pricing.totalCost + (pricing.testingFeeWaived ? 0 : pricing.testingFee);

  function handleFlavorModeChange(mode: GummyFlavorMode) {
    setFlavorMode(mode);
    // Trim to 1 when switching back to single
    if (mode === "single" && selectedFlavors.length > 1) {
      setSelectedFlavors(selectedFlavors.slice(0, 1));
    }
  }

  function handleAddFlavor(name: string) {
    if (!canAddFlavor) return;
    setSelectedFlavors((prev) => [...prev, name]);
    setFlavorOpen(false);
  }

  function handleRemoveFlavor(name: string) {
    setSelectedFlavors((prev) => prev.filter((f) => f !== name));
  }

  const totalQueued = queue.length + (flavorName.trim() ? 1 : 0);

  function resetForm() {
    setFlavorName("");
    setSelectedFlavors([]);
    setSize("standard");
    setOilType("biomax");
    setEffect("hybrid");
    setFlavorMode("single");
    setUnitsOrdered(UNIT_OPTIONS[0]);
    setCannabinoids([]);
  }

  function handleQueueCurrent() {
    if (!flavorName.trim()) { toast.error("Flavor name is required"); return; }
    setQueue((prev) => [
      ...prev,
      { id: Date.now().toString(), flavorName: flavorName.trim(), size, oilType, effect, flavorMode, cannabinoids, unitsOrdered, grandTotal },
    ]);
    toast.success(`"${flavorName.trim()}" added — configure your next gummy`);
    resetForm();
  }

  async function handleSave() {
    const hasCurrentForm = flavorName.trim() !== "";
    if (!hasCurrentForm && queue.length === 0) { toast.error("Flavor name is required"); return; }

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

      {/* Flavor Name */}
      <div>
        <SectionLabel>Flavor Name</SectionLabel>
        <Input
          className="rounded-xs h-10 text-sm"
          placeholder="e.g. Tropical Wave, Mango Madness…"
          value={flavorName}
          onChange={(e) => setFlavorName(e.target.value)}
        />
      </div>

      {/* Flavors — from production library */}
      <div>
        <SectionLabel>
          Flavors{" "}
          <span className="normal-case font-normal text-muted-foreground/60 tracking-normal">
            {flavorMode === "mix" ? `(up to ${MAX_MIX_FLAVORS})` : "(select from library)"}
          </span>
        </SectionLabel>

        {/* Selected flavor chips */}
        {selectedFlavors.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selectedFlavors.map((f) => (
              <Badge key={f} variant="secondary" className="rounded-xs gap-1.5 pl-2.5 pr-1.5 py-1">
                <span className="text-xs font-medium">{f}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFlavor(f)}
                  className="hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Add flavor combobox — hidden when limit reached */}
        {canAddFlavor && (
          <Popover open={flavorOpen} onOpenChange={setFlavorOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={flavorOpen}
                className="w-full justify-between rounded-xs h-10 text-sm font-normal text-muted-foreground"
              >
                {selectedFlavors.length === 0 ? "Search flavors…" : "Add another flavor…"}
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
                    {availableFlavors.map((f) => (
                      <CommandItem
                        key={f.flavorId}
                        value={f.name}
                        onSelect={handleAddFlavor}
                        className="rounded-xs"
                      >
                        <Check className="mr-2 h-4 w-4 opacity-0" />
                        {f.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}

        {!canAddFlavor && (
          <p className="text-xs text-muted-foreground mt-1">
            Maximum {maxFlavors} flavor{maxFlavors > 1 ? "s" : ""} selected.
          </p>
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
          <SegmentGroup options={FLAVOR_MODES} value={flavorMode} onChange={handleFlavorModeChange} />
        </div>
      </div>

      {/* Units */}
      <div>
        <SectionLabel>Units Ordered</SectionLabel>
        <Select value={String(unitsOrdered)} onValueChange={(v) => setUnitsOrdered(Number(v))}>
          <SelectTrigger className="rounded-xs h-10 text-sm">
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
          disabled={isLoading || !flavorName.trim()}
          className="rounded-xs flex-1 h-12 gap-2 text-sm font-semibold"
        >
          <Layers className="w-4 h-4" />
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
