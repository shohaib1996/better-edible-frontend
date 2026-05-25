"use client";

import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { useUpdateLabelMutation } from "@/redux/api/PrivateLabel/labelApi";
import { useGetPrivateLabelProductsQuery } from "@/redux/api/PrivateLabel/privateLabelApi";
import { ILabel } from "@/types";
import { LabelImageUpload } from "./LabelImageUpload";
import { LabelComponentList, type ComponentEntry } from "./LabelComponentList";

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

  const { data: productsData } = useGetPrivateLabelProductsQuery({ activeOnly: true });
  const [updateLabel, { isLoading }] = useUpdateLabelMutation();

  const products = productsData?.products || [];
  const selectedProduct = products.find((p: { name: string }) => p.name === productType);

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

          {/* Images */}
          <LabelImageUpload
            labelImages={label.labelImages}
            flavorName={flavorName}
            existingImages={existingImages}
            newFiles={newFiles}
            onRemoveExisting={(id) => setExistingImages((prev) => prev.filter((x) => x !== id))}
            onRemoveNew={(idx) => setNewFiles((prev) => prev.filter((_, i) => i !== idx))}
            onAddFiles={(files) => setNewFiles((prev) => [...prev, ...files])}
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
