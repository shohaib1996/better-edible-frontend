"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw, ChevronsUpDown, Search, X, Plus } from "lucide-react";
import { useUpdateLabelMutation } from "@/redux/api/PrivateLabel/labelApi";
import { calculateGummyPrice, CANNABINOID_PRICES, ALL_CANNABINOIDS, CANNABINOID_OPTIONS } from "@/lib/gummyPricing";
import type { CannabinoidName } from "@/types/privateLabel/gummyBuilder";
import { useGetPrivateLabelProductsQuery } from "@/redux/api/PrivateLabel/privateLabelApi";
import { useGetFlavorsQuery } from "@/redux/api/flavor/flavorsApi";
import { ILabel } from "@/types";
import { EditLabelImageUpload } from "./EditLabelImageUpload";
import { LabelComponentList, type ComponentEntry } from "./LabelComponentList";

const COLOR_API_URL = `${process.env.NEXT_PUBLIC_API_URL}/store/labels/gummy-color`;

interface EditLabelModalProps {
  open: boolean;
  onClose: () => void;
  label: ILabel;
  onSuccess: () => void;
}

export const EditLabelModal = ({ open, onClose, label, onSuccess }: EditLabelModalProps) => {
  const [flavorName, setFlavorName] = useState(label.flavorName);
  const [productType, setProductType] = useState(label.productType);
  const [specialInstructions, setSpecialInstructions] = useState(label.specialInstructions || "");
  const [cannabinoidMix, setCannabinoidMix] = useState(label.cannabinoidMix || "");
  const [color, setColor] = useState(label.color || "");
  const [flavorComponents, setFlavorComponents] = useState<ComponentEntry[]>(
    (label.flavorComponents || []).map((c) => ({ name: c.name, percentage: String(c.percentage) }))
  );
  const [colorComponents, setColorComponents] = useState<ComponentEntry[]>(
    (label.colorComponents || []).map((c) => ({ name: c.name, percentage: String(c.percentage) }))
  );
  const [existingImages, setExistingImages] = useState<string[]>(
    label.labelImages.map((img) => img.publicId)
  );
  const [newFiles, setNewFiles] = useState<File[]>([]);

  // AI recipe data
  const [selectedFlavors, setSelectedFlavors] = useState<string[]>(label.selectedFlavors || []);
  const [gummyColorHex, setGummyColorHex] = useState(label.gummyColorHex || "");
  const [gummyColorName, setGummyColorName] = useState(label.gummyColorName || "");
  const [isColorLoading, setIsColorLoading] = useState(false);
  const [flavorDropdownOpen, setFlavorDropdownOpen] = useState(false);
  const [flavorSearch, setFlavorSearch] = useState("");
  const flavorDropdownRef = useRef<HTMLDivElement>(null);
  const flavorSearchRef = useRef<HTMLInputElement>(null);

  // Gummy spec
  const [gummySize, setGummySize] = useState<"standard" | "xl" | "">(label.size ?? "");
  const [gummyOilType, setGummyOilType] = useState<"biomax" | "rosin" | "">(label.oilType ?? "");
  const [gummyEffect, setGummyEffect] = useState<"hybrid" | "indica" | "sativa" | "">(label.effect ?? "");
  const [gummyCannabinoids, setGummyCannabinoids] = useState<{ name: string; mg: number; priceAdd: number }[]>(label.cannabinoids ?? []);
  const [unitsOrdered, setUnitsOrdered] = useState(label.unitsOrdered != null ? String(label.unitsOrdered) : "");
  const [unitCost, setUnitCost] = useState(label.unitCost != null ? String(label.unitCost) : "");
  const [totalCost, setTotalCost] = useState(label.totalCost != null ? String(label.totalCost) : "");

  // Cannabinoid add-form local state
  const [cbName, setCbName] = useState("");
  const [cbMg, setCbMg] = useState("");

  // Auto-calculate unitCost + totalCost from gummy spec
  useEffect(() => {
    if (!gummyOilType) return;
    const u = parseFloat(unitsOrdered);
    const result = calculateGummyPrice({
      size: gummySize || "standard",
      oilType: gummyOilType,
      effect: gummyEffect || "hybrid",
      cannabinoids: gummyCannabinoids.map((c) => ({ name: c.name as CannabinoidName, mg: c.mg })),
      unitsOrdered: isNaN(u) || u <= 0 ? 0 : u,
    });
    setUnitCost(String(result.unitCost));
    if (!isNaN(u) && u > 0) setTotalCost(String(result.totalCost));
  }, [gummySize, gummyOilType, gummyEffect, gummyCannabinoids, unitsOrdered]);

  const { data: productsData } = useGetPrivateLabelProductsQuery({ activeOnly: true });
  const { data: flavorsData, isLoading: isLoadingFlavors } = useGetFlavorsQuery();
  const [updateLabel, { isLoading }] = useUpdateLabelMutation();

  const products = productsData?.products || [];
  const selectedProduct = products.find((p: { name: string }) => p.name === productType);
  const allFlavors = useMemo(
    () => [...(flavorsData?.flavors ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [flavorsData],
  );

  const filteredFlavors = useMemo(
    () =>
      allFlavors.filter(
        (f) =>
          !selectedFlavors.includes(f.name) &&
          f.name.toLowerCase().includes(flavorSearch.toLowerCase()),
      ),
    [allFlavors, selectedFlavors, flavorSearch],
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (flavorDropdownRef.current && !flavorDropdownRef.current.contains(e.target as Node)) {
        setFlavorDropdownOpen(false);
        setFlavorSearch("");
      }
    }
    if (flavorDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [flavorDropdownOpen]);

  useEffect(() => {
    if (flavorDropdownOpen) setTimeout(() => flavorSearchRef.current?.focus(), 50);
  }, [flavorDropdownOpen]);

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
      if (data?.hex && /^#[0-9A-Fa-f]{6}$/.test(data.hex)) {
        setGummyColorHex(data.hex);
        setGummyColorName(data.name || "");
        if (data.name) setColor(data.name);
      }
    } catch {
      toast.error("Failed to generate color");
    } finally {
      setIsColorLoading(false);
    }
  }

  const maxFlavors = 3;

  function handleAddFlavor(name: string) {
    if (selectedFlavors.length >= maxFlavors) return;
    const updated = [...selectedFlavors, name];
    setSelectedFlavors(updated);
    setFlavorSearch("");
    if (updated.length >= maxFlavors) setFlavorDropdownOpen(false);
    fetchColorForFlavors(updated);
  }

  function handleRemoveFlavor(name: string) {
    const updated = selectedFlavors.filter((f) => f !== name);
    setSelectedFlavors(updated);
    if (updated.length > 0) {
      fetchColorForFlavors(updated);
    } else {
      setGummyColorHex("");
      setGummyColorName("");
    }
  }

  function addCannabinoid() {
    const mg = parseInt(cbMg, 10);
    if (!cbName || mg <= 0) return;
    const priceAdd = CANNABINOID_PRICES[cbName as CannabinoidName]?.[mg] ?? 0;
    setGummyCannabinoids((prev) => [
      ...prev.filter((c) => c.name !== cbName),
      { name: cbName, mg, priceAdd },
    ]);
    setCbName("");
    setCbMg("");
  }

  const handleSubmit = async () => {
    if (!flavorName.trim()) return toast.error("Please enter a flavor name");
    if (!productType) return toast.error("Please select a product type");
    if (existingImages.length === 0 && newFiles.length === 0)
      return toast.error("Please keep at least one image or upload new ones");

    try {
      const formData = new FormData();
      formData.append("flavorName", flavorName.trim());
      formData.append("productType", productType);
      formData.append("specialInstructions", specialInstructions.trim());
      formData.append("cannabinoidMix", cannabinoidMix.trim());
      formData.append("color", color.trim());
      formData.append(
        "flavorComponents",
        JSON.stringify(flavorComponents.map((c) => ({ name: c.name.trim(), percentage: Number(c.percentage) })))
      );
      formData.append(
        "colorComponents",
        JSON.stringify(colorComponents.map((c) => ({ name: c.name.trim(), percentage: Number(c.percentage) })))
      );
      formData.append("keepExistingImages", JSON.stringify(existingImages));
      newFiles.forEach((file) => formData.append("labelImages", file));
      formData.append("selectedFlavors", JSON.stringify(selectedFlavors));
      if (gummyColorHex) formData.append("gummyColorHex", gummyColorHex);
      if (gummyColorName) formData.append("gummyColorName", gummyColorName);
      // Gummy spec
      formData.append("size", gummySize);
      formData.append("oilType", gummyOilType);
      formData.append("effect", gummyEffect);
      formData.append("cannabinoids", JSON.stringify(gummyCannabinoids));
      if (unitsOrdered) formData.append("unitsOrdered", unitsOrdered);
      if (unitCost) formData.append("unitCost", unitCost);
      if (totalCost) formData.append("totalCost", totalCost);

      await updateLabel({ id: label._id, formData }).unwrap();
      toast.success("Label updated successfully!");
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to update label");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hidden rounded-xs border-border dark:border-white/20 dark:bg-card">
        <DialogHeader>
          <DialogTitle>Edit Label</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Flavor Name */}
          <div>
            <Label htmlFor="flavorName">Flavor Name *</Label>
            <Input
              id="flavorName"
              placeholder="e.g., Mango Blast"
              value={flavorName}
              onChange={(e) => setFlavorName(e.target.value)}
              className="rounded-xs border-border dark:border-white/20 bg-card"
            />
          </div>

          {/* Product Type */}
          <div>
            <Label htmlFor="productType">Product Type *</Label>
            <Select value={productType} onValueChange={setProductType}>
              <SelectTrigger id="productType" className="rounded-xs border-border dark:border-white/20 bg-card">
                <SelectValue placeholder="Select product type" />
              </SelectTrigger>
              <SelectContent className="rounded-xs border-border dark:border-white/20 bg-card">
                {products.map((product: { _id: string; name: string; unitPrice: number }) => (
                  <SelectItem key={product._id} value={product.name}>
                    {product.name} - ${product.unitPrice.toFixed(2)}/unit
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProduct && (
              <p className="text-sm text-muted-foreground mt-1">
                Unit price: ${selectedProduct.unitPrice.toFixed(2)}
              </p>
            )}
          </div>

          {/* Cannabinoid Mix */}
          <div>
            <Label htmlFor="cannabinoidMix">Cannabinoid Mix</Label>
            <Input
              id="cannabinoidMix"
              placeholder="e.g., 10mg THC BIOMAX"
              value={cannabinoidMix}
              onChange={(e) => setCannabinoidMix(e.target.value)}
              className="rounded-xs border-border dark:border-white/20 bg-card"
            />
          </div>

          {/* Color */}
          <div>
            <Label htmlFor="color">Color</Label>
            <Input
              id="color"
              placeholder="e.g., Red/Pink"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="rounded-xs border-border dark:border-white/20 bg-card"
            />
          </div>

          {/* AI Recipe Data */}
          <div className="rounded-xs border border-primary/30 bg-primary/5 dark:bg-primary/10 p-3 space-y-3">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">AI Recipe Data</p>
            </div>

            {/* Gummy Flavors */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Gummy Flavors</Label>
                <span className="text-[10px] text-muted-foreground">{selectedFlavors.length} / {maxFlavors}</span>
              </div>
              <p className="text-xs text-muted-foreground">Actual production flavor(s) — used for AI recipe generation</p>

              <div ref={flavorDropdownRef} className="relative">
                <button
                  type="button"
                  disabled={selectedFlavors.length >= maxFlavors}
                  onClick={() => { setFlavorDropdownOpen((v) => !v); setFlavorSearch(""); }}
                  className="w-full flex items-center justify-between gap-2 rounded-xs border border-border bg-card px-3 h-10 text-sm text-muted-foreground hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span>{selectedFlavors.length >= maxFlavors ? `${maxFlavors} flavor${maxFlavors > 1 ? "s" : ""} selected` : "Select flavor…"}</span>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </button>

                {flavorDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xs border border-border bg-popover shadow-md overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                      <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <input
                        ref={flavorSearchRef}
                        type="text"
                        placeholder="Search flavors…"
                        value={flavorSearch}
                        onChange={(e) => setFlavorSearch(e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {isLoadingFlavors ? (
                        <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading flavors…
                        </div>
                      ) : filteredFlavors.length === 0 ? (
                        <p className="px-3 py-2.5 text-xs text-muted-foreground italic">
                          {flavorSearch ? `No results for "${flavorSearch}"` : "No more flavors to add"}
                        </p>
                      ) : (
                        filteredFlavors.map((f) => (
                          <button
                            key={f.flavorId}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleAddFlavor(f.name)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            {f.name}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {selectedFlavors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {selectedFlavors.map((f) => (
                    <Badge key={f} variant="secondary" className="rounded-xs gap-1.5 pl-2.5 pr-1.5 py-1 text-xs">
                      {f}
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
            </div>

            {/* Gummy Color */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Gummy Color</Label>
                {selectedFlavors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => fetchColorForFlavors(selectedFlavors)}
                    disabled={isColorLoading}
                    className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50 transition-opacity"
                  >
                    {isColorLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Regenerate
                  </button>
                )}
              </div>
              {isColorLoading ? (
                <div className="flex items-center gap-2 rounded-xs border border-border bg-background px-3 h-12 text-xs text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Generating color from flavors…
                </div>
              ) : gummyColorHex ? (
                <div className="flex items-center gap-3 rounded-xs border border-border bg-card px-3 py-2.5">
                  <span
                    className="w-8 h-8 rounded-xs border border-border shrink-0 shadow-sm"
                    style={{ backgroundColor: gummyColorHex }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{gummyColorName || "Custom"}</p>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{gummyColorHex.toUpperCase()}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center rounded-xs border border-dashed border-primary/30 bg-card px-3 h-12">
                  <p className="text-xs text-muted-foreground">
                    {selectedFlavors.length > 0 ? "Click Regenerate to auto-generate a color" : "Select flavors above to auto-generate a color"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Gummy Spec */}
          <div className="rounded-xs border border-border p-3 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gummy Spec</p>

            {/* Size / Oil Type / Effect */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Size</Label>
                <Select value={gummySize} onValueChange={(v) => setGummySize(v as "standard" | "xl")}>
                  <SelectTrigger className="rounded-xs border-border dark:border-white/20 bg-card h-9 text-sm">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xs border-border dark:border-white/20 bg-card">
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="xl">XL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Oil Type</Label>
                <Select value={gummyOilType} onValueChange={(v) => setGummyOilType(v as "biomax" | "rosin")}>
                  <SelectTrigger className="rounded-xs border-border dark:border-white/20 bg-card h-9 text-sm">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xs border-border dark:border-white/20 bg-card">
                    <SelectItem value="biomax">BioMax</SelectItem>
                    <SelectItem value="rosin">Rosin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Effect</Label>
                <Select value={gummyEffect} onValueChange={(v) => setGummyEffect(v as "hybrid" | "indica" | "sativa")}>
                  <SelectTrigger className="rounded-xs border-border dark:border-white/20 bg-card h-9 text-sm">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xs border-border dark:border-white/20 bg-card">
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="indica">Indica</SelectItem>
                    <SelectItem value="sativa">Sativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Cannabinoid add-ons */}
            <div className="space-y-2">
              <Label className="text-xs">Cannabinoid Add-ons</Label>
              {gummyCannabinoids.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {gummyCannabinoids.map((c) => (
                    <span key={c.name} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-xs bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300">
                      {c.name} {c.mg}mg
                      {c.priceAdd > 0 && <span className="opacity-60">+${c.priceAdd.toFixed(2)}</span>}
                      <button
                        type="button"
                        onClick={() => setGummyCannabinoids((prev) => prev.filter((cb) => cb.name !== c.name))}
                        className="hover:text-destructive ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Select value={cbName} onValueChange={(v) => { setCbName(v); setCbMg(""); }}>
                  <SelectTrigger className="rounded-xs border-border dark:border-white/20 bg-card h-9 text-sm flex-1">
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xs border-border dark:border-white/20 bg-card">
                    {ALL_CANNABINOIDS.map((n) => (
                      <SelectItem key={n} value={n}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={cbMg} onValueChange={setCbMg} disabled={!cbName}>
                  <SelectTrigger className="rounded-xs border-border dark:border-white/20 bg-card h-9 text-sm w-36">
                    <SelectValue placeholder="mg" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xs border-border dark:border-white/20 bg-card">
                    {(CANNABINOID_OPTIONS[cbName as keyof typeof CANNABINOID_OPTIONS] ?? []).map((mg) => (
                      <SelectItem key={mg} value={String(mg)}>
                        {mg}mg +${(CANNABINOID_PRICES[cbName as CannabinoidName]?.[mg] ?? 0).toFixed(2)}/unit
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xs border-border dark:border-white/20 bg-card h-9 shrink-0"
                  disabled={!cbName || !cbMg}
                  onClick={addCannabinoid}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />Add
                </Button>
              </div>
            </div>

            {/* Pricing — auto-calculated from spec */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Units Ordered</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="e.g. 630"
                  value={unitsOrdered}
                  onChange={(e) => setUnitsOrdered(e.target.value)}
                  className="rounded-xs border-border dark:border-white/20 bg-card h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unit Cost ($)</Label>
                <div className="rounded-xs border border-border bg-muted/40 h-9 px-3 flex items-center text-sm font-medium tabular-nums">
                  {unitCost ? `$${parseFloat(unitCost).toFixed(4)}` : <span className="text-muted-foreground text-xs">Set oil type</span>}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Total Cost ($)</Label>
                <div className="rounded-xs border border-border bg-muted/40 h-9 px-3 flex items-center text-sm font-semibold tabular-nums text-primary">
                  {totalCost ? `$${parseFloat(totalCost).toFixed(2)}` : <span className="text-muted-foreground font-normal text-xs">Enter units</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <EditLabelImageUpload
            labelImages={label.labelImages}
            existingImages={existingImages}
            newFiles={newFiles}
            onRemoveExisting={(id: string) => setExistingImages((prev) => prev.filter((x) => x !== id))}
            onRemoveNew={(idx: number) => setNewFiles((prev) => prev.filter((_, i) => i !== idx))}
            onAddFiles={(files: File[]) => setNewFiles((prev) => [...prev, ...files])}
          />

          {/* Flavor Components */}
          <LabelComponentList
            label="Flavor Components"
            items={flavorComponents}
            onChange={setFlavorComponents}
          />

          {/* Color Components */}
          <LabelComponentList
            label="Color Components"
            items={colorComponents}
            onChange={setColorComponents}
          />

          {/* Special Instructions */}
          <div>
            <Label htmlFor="specialInstructions">Special Instructions</Label>
            <textarea
              id="specialInstructions"
              placeholder="Enter any special instructions for this label..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              rows={3}
              className="flex w-full rounded-xs border border-border dark:border-white/20 bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xs border-border dark:border-white/20 bg-card"
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="rounded-xs">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Label
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
