"use client";

import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useGetFlavorsQuery } from "@/redux/api/flavor/flavorsApi";
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
import { LabelCardView } from "./LabelCardView";
import { LabelCardEdit } from "./LabelCardEdit";

const COLOR_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/store/labels/gummy-color`;

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

  const [updateDraft, { isLoading: isSaving }] = useUpdateDraftLabelMutation();
  const [deleteDraft, { isLoading: isDeleting }] = useDeleteDraftLabelMutation();

  const editPricing = useMemo(
    () => calculateGummyPrice({ size, oilType, effect, cannabinoids, unitsOrdered: units }),
    [size, oilType, effect, cannabinoids, units],
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

  if (!editing) {
    return (
      <LabelCardView
        label={label}
        isDeleting={isDeleting}
        onEdit={() => setEditing(true)}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <LabelCardEdit
      flavorName={flavorName}
      setFlavorName={setFlavorName}
      size={size}
      setSize={setSize}
      oilType={oilType}
      setOilType={setOilType}
      effect={effect}
      setEffect={setEffect}
      units={units}
      setUnits={setUnits}
      selectedFlavors={selectedFlavors}
      allFlavors={allFlavors}
      isLoadingFlavors={isLoadingFlavors}
      colorHex={colorHex}
      colorName={colorName}
      isColorLoading={isColorLoading}
      cannabinoids={cannabinoids}
      effectiveKey={effectiveKey}
      selectedKey={selectedKey}
      setSelectedKey={setSelectedKey}
      editPricing={editPricing}
      isSaving={isSaving}
      onAddFlavor={handleAddFlavor}
      onRemoveFlavor={handleRemoveFlavor}
      onAddCannabinoid={handleAddCannabinoid}
      onRemoveCannabinoid={handleRemoveCannabinoid}
      onSave={handleSave}
      onCancel={handleCancel}
    />
  );
}
