"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, RefreshCw } from "lucide-react";
import { useUpdateLabelMutation } from "@/redux/api/PrivateLabel/labelApi";
import { useGetPrivateLabelProductsQuery } from "@/redux/api/PrivateLabel/privateLabelApi";
import { useGetFlavorsQuery } from "@/redux/api/flavor/flavorsApi";
import { ILabel } from "@/types";
import { EditLabelImageUpload } from "./EditLabelImageUpload";
import { LabelComponentList, type ComponentEntry } from "./LabelComponentList";
import { FlavorPicker } from "@/components/PrivateLabel/FlavorPicker";

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

  const { data: productsData } = useGetPrivateLabelProductsQuery({ activeOnly: true });
  const { data: flavorsData, isLoading: isLoadingFlavors } = useGetFlavorsQuery();
  const [updateLabel, { isLoading }] = useUpdateLabelMutation();

  const products = productsData?.products || [];
  const selectedProduct = products.find((p: { name: string }) => p.name === productType);
  const allFlavors = useMemo(
    () => [...(flavorsData?.flavors ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [flavorsData],
  );

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
      }
    } catch {
      toast.error("Failed to generate color");
    } finally {
      setIsColorLoading(false);
    }
  }

  function handleAddFlavor(name: string) {
    if (selectedFlavors.length >= 3) return;
    const updated = [...selectedFlavors, name];
    setSelectedFlavors(updated);
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
          <div className="rounded-xs border border-border p-3 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AI Recipe Data</p>

            <div>
              <Label className="mb-1.5 block">Gummy Flavors</Label>
              <p className="text-xs text-muted-foreground mb-2">Actual production flavor(s) — used for AI recipe generation</p>
              <FlavorPicker
                selectedFlavors={selectedFlavors}
                allFlavors={allFlavors}
                isLoadingFlavors={isLoadingFlavors}
                maxFlavors={3}
                onAdd={handleAddFlavor}
                onRemove={handleRemoveFlavor}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Label>Gummy Color</Label>
                {selectedFlavors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => fetchColorForFlavors(selectedFlavors)}
                    disabled={isColorLoading}
                    className="flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50"
                  >
                    {isColorLoading
                      ? <Loader2 className="w-3 h-3 animate-spin" />
                      : <RefreshCw className="w-3 h-3" />}
                    Regenerate
                  </button>
                )}
              </div>
              {gummyColorHex ? (
                <div className="flex items-center gap-2 p-2 rounded-xs border border-border bg-muted/30">
                  <span
                    className="w-6 h-6 rounded-xs border border-border shrink-0"
                    style={{ backgroundColor: gummyColorHex }}
                  />
                  <span className="text-sm font-medium">{gummyColorName || gummyColorHex}</span>
                  <span className="text-xs text-muted-foreground font-mono ml-auto">{gummyColorHex}</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  {selectedFlavors.length > 0
                    ? "Click Regenerate to auto-generate color"
                    : "Select flavors above to auto-generate a color"}
                </p>
              )}
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
