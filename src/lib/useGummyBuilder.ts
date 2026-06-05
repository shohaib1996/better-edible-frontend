"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
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
import { UNIT_OPTIONS } from "@/lib/gummyBuilderConfig";
import type { QueuedGummy } from "@/lib/gummyBuilderConfig";

export const MAX_MIX_FLAVORS = 3;

export function useGummyBuilder({ storeId, onSaved }: { storeId: string; onSaved: () => void }) {
  const [flavorName, setFlavorName] = useState("");
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [size, setSize] = useState<GummySize>("standard");
  const [oilType, setOilType] = useState<GummyOilType>("biomax");
  const [effect, setEffect] = useState<GummyEffect>("hybrid");
  const [flavorMode, setFlavorMode] = useState<GummyFlavorMode>("single");
  const [unitsOrdered, setUnitsOrdered] = useState(UNIT_OPTIONS[0]);
  const [cannabinoids, setCannabinoids] = useState<{ name: CannabinoidName; mg: number }[]>([]);
  const [gummyHue, setGummyHue] = useState(0);
  const [queue, setQueue] = useState<QueuedGummy[]>([]);

  const { data: flavorsData, isLoading: isLoadingFlavors } = useGetFlavorsQuery();
  const allFlavors = useMemo(
    () => [...(flavorsData?.flavors ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [flavorsData],
  );

  const maxFlavors = flavorMode === "mix" ? MAX_MIX_FLAVORS : 1;

  const [createDraft, { isLoading: isSaving }] = useCreateDraftLabelMutation();

  const pricing = useMemo(
    () => calculateGummyPrice({ size, oilType, effect, flavorMode, cannabinoids, unitsOrdered }),
    [size, oilType, effect, flavorMode, cannabinoids, unitsOrdered],
  );
  const grandTotal = pricing.totalCost + (pricing.testingFeeWaived ? 0 : pricing.testingFee);
  const totalQueued = queue.length + (flavorName.trim() ? 1 : 0);

  function handleFlavorModeChange(mode: GummyFlavorMode) {
    setFlavorMode(mode);
    if (mode === "single" && selectedFlavors.length > 1) {
      setSelectedFlavors(selectedFlavors.slice(0, 1));
    }
  }

  function handleAddFlavor(name: string) {
    if (selectedFlavors.length >= maxFlavors) return;
    setSelectedFlavors((prev) => [...prev, name]);
  }

  function handleRemoveFlavor(name: string) {
    setSelectedFlavors((prev) => prev.filter((f) => f !== name));
  }

  function resetForm() {
    setFlavorName("");
    setSelectedFlavors([]);
    setSize("standard");
    setOilType("biomax");
    setEffect("hybrid");
    setFlavorMode("single");
    setUnitsOrdered(UNIT_OPTIONS[0]);
    setCannabinoids([]);
    setGummyHue(0);
  }

  function handleQueueCurrent() {
    if (!flavorName.trim()) { toast.error("Flavor name is required"); return; }
    setQueue((prev) => [
      ...prev,
      { id: Date.now().toString(), flavorName: flavorName.trim(), size, oilType, effect, flavorMode, cannabinoids, unitsOrdered, grandTotal, gummyHue },
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
        ? [{ id: "current", flavorName: flavorName.trim(), size, oilType, effect, flavorMode, cannabinoids, unitsOrdered, grandTotal, gummyHue }]
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

  return {
    // form state
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
    // flavor library
    allFlavors,
    isLoadingFlavors,
    maxFlavors,
    // pricing
    pricing,
    grandTotal,
    // queue
    totalQueued,
    isSaving,
    // handlers
    handleFlavorModeChange,
    handleAddFlavor,
    handleRemoveFlavor,
    handleQueueCurrent,
    handleSave,
  };
}
