"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { IPrivateLabelProduct } from "@/types";

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    unitPrice: number;
    description?: string;
    isActive: boolean;
  }) => void;
  product?: IPrivateLabelProduct | null;
  isSubmitting?: boolean;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  product,
  isSubmitting = false,
}) => {
  const [name, setName] = useState("");
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<{
    name?: string;
    unitPrice?: string;
  }>({});

  // Populate form when editing
  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setUnitPrice(product.unitPrice || 0);
      setDescription(product.description || "");
      setIsActive(product.isActive ?? true);
    } else {
      // Reset form for new product
      setName("");
      setUnitPrice(0);
      setDescription("");
      setIsActive(true);
    }
    setErrors({});
  }, [product, open]);

  const validate = () => {
    const newErrors: { name?: string; unitPrice?: string } = {};

    if (!name.trim()) {
      newErrors.name = "Product name is required";
    }

    if (unitPrice <= 0) {
      newErrors.unitPrice = "Unit price must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      unitPrice,
      description: description.trim() || undefined,
      isActive,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-xs">
        <DialogHeader>
          <DialogTitle>
            {product ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Product Name */}
          <div>
            <Label htmlFor="name">
              Product Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., BIOMAX, Rosin, Delta-8"
              className="mt-2 rounded-xs"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1">{errors.name}</p>
            )}
          </div>

          {/* Unit Price */}
          <div>
            <Label htmlFor="unitPrice">
              Unit Price <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-2">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                $
              </span>
              <Input
                id="unitPrice"
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="pl-7 rounded-xs"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                per unit/case
              </span>
            </div>
            {errors.unitPrice && (
              <p className="text-red-500 text-xs mt-1">{errors.unitPrice}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter product description (optional)"
              className="mt-2 rounded-xs"
              rows={3}
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <Label htmlFor="isActive">Active Status</Label>
            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <span className="text-sm text-gray-600">
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xs"
          >
            {isSubmitting
              ? "Saving..."
              : product
              ? "Save Changes"
              : "Add Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
