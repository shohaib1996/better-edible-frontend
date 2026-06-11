"use client";

import { useRef, useEffect, useMemo, useState } from "react";
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
import { Loader2, ChevronsUpDown, Search, X, RefreshCw, Plus } from "lucide-react";
import { useAddLabelForm, type AddLabelInitialValues, ALL_CANNABINOIDS, CANNABINOID_OPTIONS, CANNABINOID_PRICES } from "./useAddLabelForm";
import { LabelComponentList } from "./LabelComponentList";
import { LabelImageUpload } from "./LabelImageUpload";

interface Props {
  open: boolean;
  onClose: () => void;
  clientId: string;
  onSuccess: () => void;
  initialValues?: AddLabelInitialValues;
  title?: string;
}

export const AddLabelModal = ({ open, onClose, clientId, onSuccess, initialValues, title }: Props) => {
  const form = useAddLabelForm(clientId, onSuccess, onClose, initialValues);

  // Flavor dropdown local state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Cannabinoid add-form local state
  const [cbName, setCbName] = useState("");
  const [cbMg, setCbMg] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const maxFlavors = 3;

  const filteredFlavors = useMemo(
    () =>
      form.allFlavors.filter(
        (f) =>
          !form.selectedFlavors.includes(f.name) &&
          f.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [form.allFlavors, form.selectedFlavors, search],
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setSearch("");
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    if (dropdownOpen) setTimeout(() => searchRef.current?.focus(), 50);
  }, [dropdownOpen]);

  function handleAddFlavor(name: string) {
    form.handleAddFlavor(name);
    setSearch("");
    if (form.selectedFlavors.length + 1 >= maxFlavors) setDropdownOpen(false);
  }

  const canAddMore = form.selectedFlavors.length < maxFlavors;

  return (
    <Dialog open={open} onOpenChange={form.handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hidden rounded-xs border-border dark:border-white/20 dark:bg-card">
        <DialogHeader>
          <DialogTitle>{title ?? "Add New Label"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Flavor Name */}
          <div>
            <Label htmlFor="flavorName">Flavor Name *</Label>
            <Input
              id="flavorName"
              placeholder="e.g., Mango Blast"
              value={form.flavorName}
              onChange={(e) => form.setFlavorName(e.target.value)}
              className="rounded-xs border-border dark:border-white/20 bg-card"
            />
          </div>

          {/* Product Type */}
          <div>
            <Label htmlFor="productType">Product Type *</Label>
            <Select value={form.productType} onValueChange={form.setProductType}>
              <SelectTrigger id="productType" className="rounded-xs border-border dark:border-white/20 bg-card">
                <SelectValue placeholder="Select product type" />
              </SelectTrigger>
              <SelectContent className="rounded-xs border-border dark:border-white/20 bg-card">
                {form.products.map((product: { _id: string; name: string; unitPrice: number }) => (
                  <SelectItem key={product._id} value={product.name}>
                    {product.name} - ${product.unitPrice.toFixed(2)}/unit
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cannabinoid Mix */}
          <div>
            <Label htmlFor="cannabinoidMix">Cannabinoid Mix</Label>
            <Input
              id="cannabinoidMix"
              placeholder="e.g., 10mg THC BIOMAX"
              value={form.cannabinoidMix}
              onChange={(e) => form.setCannabinoidMix(e.target.value)}
              className="rounded-xs border-border dark:border-white/20 bg-card"
            />
          </div>

          {/* Color */}
          <div>
            <Label htmlFor="color">Color</Label>
            <div className="relative mt-1">
              {form.gummyColorHex && (
                <span
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-xs border border-border shrink-0"
                  style={{ backgroundColor: form.gummyColorHex }}
                />
              )}
              <Input
                id="color"
                placeholder="e.g., Red/Pink"
                value={form.color}
                onChange={(e) => form.setColor(e.target.value)}
                className={`rounded-xs border-border dark:border-white/20 bg-card ${form.gummyColorHex ? "pl-10" : ""}`}
              />
            </div>
          </div>

          {/* AI Recipe Data */}
          <div className="rounded-xs border border-primary/30 bg-primary/5 dark:bg-primary/10 p-3 space-y-3">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              <p className="text-xs font-semibold text-primary uppercase tracking-wide">AI Recipe Data</p>
            </div>

            {/* Flavor Picker */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Gummy Flavors</Label>
                <span className="text-[10px] text-muted-foreground">
                  {form.selectedFlavors.length} / {maxFlavors}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Actual production flavor(s) — used for AI recipe generation</p>

              <div ref={dropdownRef} className="relative">
                <button
                  type="button"
                  disabled={!canAddMore}
                  onClick={() => { setDropdownOpen((v) => !v); setSearch(""); }}
                  className="w-full flex items-center justify-between gap-2 rounded-xs border border-border bg-card px-3 h-10 text-sm text-muted-foreground hover:bg-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span>{!canAddMore ? `${maxFlavors} flavor${maxFlavors > 1 ? "s" : ""} selected` : "Select flavor…"}</span>
                  <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </button>

                {dropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xs border border-border bg-popover shadow-md overflow-hidden">
                    <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                      <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <input
                        ref={searchRef}
                        type="text"
                        placeholder="Search flavors…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {form.isLoadingFlavors ? (
                        <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-muted-foreground">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading flavors…
                        </div>
                      ) : filteredFlavors.length === 0 ? (
                        <p className="px-3 py-2.5 text-xs text-muted-foreground italic">
                          {search ? `No results for "${search}"` : "No more flavors to add"}
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

              {form.selectedFlavors.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {form.selectedFlavors.map((f) => (
                    <Badge key={f} variant="secondary" className="rounded-xs gap-1.5 pl-2.5 pr-1.5 py-1 text-xs">
                      {f}
                      <button type="button" onClick={() => form.handleRemoveFlavor(f)} className="hover:text-destructive transition-colors">
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
                {form.selectedFlavors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => form.fetchColorForFlavors(form.selectedFlavors)}
                    disabled={form.isColorLoading}
                    className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50 transition-opacity"
                  >
                    {form.isColorLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                    Regenerate
                  </button>
                )}
              </div>
              {form.isColorLoading ? (
                <div className="flex items-center gap-2 rounded-xs border border-border bg-card px-3 h-12 text-xs text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Generating color from flavors…
                </div>
              ) : form.gummyColorHex ? (
                <div className="flex items-center gap-3 rounded-xs border border-border bg-card px-3 py-2.5">
                  <span className="w-8 h-8 rounded-xs border border-border shrink-0 shadow-sm" style={{ backgroundColor: form.gummyColorHex }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{form.gummyColorName || "Custom"}</p>
                    <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{form.gummyColorHex.toUpperCase()}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center rounded-xs border border-dashed border-primary/30 bg-card px-3 h-12">
                  <p className="text-xs text-muted-foreground">
                    {form.selectedFlavors.length > 0 ? "Click Regenerate to auto-generate a color" : "Select flavors above to auto-generate a color"}
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
                <Select value={form.gummySize} onValueChange={(v) => form.setGummySize(v as "standard" | "xl")}>
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
                <Select value={form.gummyOilType} onValueChange={(v) => form.setGummyOilType(v as "biomax" | "rosin")}>
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
                <Select value={form.gummyEffect} onValueChange={(v) => form.setGummyEffect(v as "hybrid" | "indica" | "sativa")}>
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
              {form.gummyCannabinoids.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.gummyCannabinoids.map((c) => (
                    <span key={c.name} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-xs bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-700 dark:text-blue-300">
                      {c.name} {c.mg}mg
                      {c.priceAdd > 0 && <span className="opacity-60">+${c.priceAdd.toFixed(2)}</span>}
                      <button type="button" onClick={() => form.removeCannabinoid(c.name)} className="hover:text-destructive ml-0.5">
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
                        {mg}mg +${(CANNABINOID_PRICES[cbName as keyof typeof CANNABINOID_PRICES]?.[mg] ?? 0).toFixed(2)}/unit
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
                  onClick={() => {
                    if (cbName && cbMg) {
                      form.addCannabinoid(cbName, parseInt(cbMg, 10));
                      setCbName("");
                      setCbMg("");
                    }
                  }}
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
                  value={form.unitsOrdered}
                  onChange={(e) => form.setUnitsOrdered(e.target.value)}
                  className="rounded-xs border-border dark:border-white/20 bg-card h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Unit Cost ($)</Label>
                <div className="rounded-xs border border-border bg-muted/40 h-9 px-3 flex items-center text-sm font-medium tabular-nums">
                  {form.unitCost ? `$${parseFloat(form.unitCost).toFixed(4)}` : <span className="text-muted-foreground text-xs">Set oil type</span>}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Total Cost ($)</Label>
                <div className="rounded-xs border border-border bg-muted/40 h-9 px-3 flex items-center text-sm font-semibold tabular-nums text-primary">
                  {form.totalCost ? `$${parseFloat(form.totalCost).toFixed(2)}` : <span className="text-muted-foreground font-normal text-xs">Enter units</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Upload Logos */}
          <div>
            <Label>Upload Logo</Label>
            <div className="mt-2">
              <LabelImageUpload
                files={form.files}
                isDragging={form.isDragging}
                onFileChange={form.handleFileChange}
                onDragOver={form.handleDragOver}
                onDragLeave={form.handleDragLeave}
                onDrop={form.handleDrop}
                onRemove={form.removeFile}
              />
            </div>
          </div>

          {/* Flavor Components */}
          <LabelComponentList label="Flavor Components" items={form.flavorComponents} onChange={form.setFlavorComponents} />

          {/* Color Components */}
          <LabelComponentList label="Color Components" items={form.colorComponents} onChange={form.setColorComponents} />

          {/* Special Instructions */}
          <div>
            <Label htmlFor="specialInstructions">Special Instructions</Label>
            <textarea
              id="specialInstructions"
              placeholder="Enter any special instructions for this label..."
              value={form.specialInstructions}
              onChange={(e) => form.setSpecialInstructions(e.target.value)}
              rows={3}
              className="flex w-full rounded-xs border border-border dark:border-white/20 bg-card px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={form.isLoading} className="rounded-xs border-border dark:border-white/20 bg-card">
              Cancel
            </Button>
            <Button onClick={form.handleSubmit} disabled={form.isLoading} className="rounded-xs">
              {form.isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Label
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
