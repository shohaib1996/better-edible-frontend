"use client";

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
import { useAddLabelForm } from "./useAddLabelForm";
import { ComponentListField } from "./ComponentListField";
import { LabelImageUpload } from "./LabelImageUpload";

interface Props {
  open: boolean;
  onClose: () => void;
  clientId: string;
  onSuccess: () => void;
}

export const AddLabelModal = ({ open, onClose, clientId, onSuccess }: Props) => {
  const form = useAddLabelForm(clientId, onSuccess, onClose);

  return (
    <Dialog open={open} onOpenChange={form.handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hidden rounded-xs border-border dark:border-white/20 dark:bg-card">
        <DialogHeader>
          <DialogTitle>Add New Label</DialogTitle>
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
              <SelectTrigger
                id="productType"
                className="rounded-xs border-border dark:border-white/20 bg-card"
              >
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
            <Input
              id="color"
              placeholder="e.g., Red/Pink"
              value={form.color}
              onChange={(e) => form.setColor(e.target.value)}
              className="rounded-xs border-border dark:border-white/20 bg-card"
            />
          </div>

          {/* Upload Logo */}
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
          <ComponentListField
            label="Flavor Components"
            components={form.flavorComponents}
            onChange={form.setFlavorComponents}
          />

          {/* Color Components */}
          <ComponentListField
            label="Color Components"
            components={form.colorComponents}
            onChange={form.setColorComponents}
          />

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
            <Button
              variant="outline"
              onClick={onClose}
              disabled={form.isLoading}
              className="rounded-xs border-border dark:border-white/20 bg-card"
            >
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
