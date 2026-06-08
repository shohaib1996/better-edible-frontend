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

const SOURCE_HUE = 55;
const COLOR_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/store/labels/gummy-color`;

function hexToHueRotation(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === r)      h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else                h = (r - g) / delta + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  return ((h - SOURCE_HUE) % 360 + 360) % 360;
}

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
  const [isColorLoading, setIsColorLoading] = useState(false);
  const [colorInfo, setColorInfo] = useState<{ hex: string; name: string; rationale: string; rgb: { r: number; g: number; b: number } } | null>(null);
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

  async function fetchColorForFlavors(flavors: string[]) {
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
        setGummyHue(hexToHueRotation(hex));
        setColorInfo({ hex, name: data.name, rationale: data.rationale, rgb: data.rgb });
      }
    } catch {
      // silently fail — keep current hue
    } finally {
      setIsColorLoading(false);
    }
  }

  function handleFlavorModeChange(mode: GummyFlavorMode) {
    setFlavorMode(mode);
    if (mode === "single" && selectedFlavors.length > 1) {
      const trimmed = selectedFlavors.slice(0, 1);
      setSelectedFlavors(trimmed);
      fetchColorForFlavors(trimmed);
    }
  }

  function handleAddFlavor(name: string) {
    if (selectedFlavors.length >= maxFlavors) return;
    const updated = [...selectedFlavors, name];
    setSelectedFlavors(updated);
    fetchColorForFlavors(updated);
  }

  function handleRemoveFlavor(name: string) {
    const updated = selectedFlavors.filter((f) => f !== name);
    setSelectedFlavors(updated);
    if (updated.length > 0) fetchColorForFlavors(updated);
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
    setColorInfo(null);
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
    isColorLoading,
    colorInfo,
    // handlers
    handleFlavorModeChange,
    handleAddFlavor,
    handleRemoveFlavor,
    handleQueueCurrent,
    handleSave,
  };
}
