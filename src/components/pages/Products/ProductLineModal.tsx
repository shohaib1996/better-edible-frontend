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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { IProductLine } from "@/redux/api/ProductLines/productLinesApi";

interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "textarea";
  placeholder?: string;
  required: boolean;
  options?: string[];
}

interface ProductLineModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
  editingProductLine?: IProductLine | null;
}

export const ProductLineModal: React.FC<ProductLineModalProps> = ({
  open,
  onClose,
  onSubmit,
  isSubmitting,
  editingProductLine,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState("");
  const [active, setActive] = useState(true);
  const [pricingType, setPricingType] = useState<
    "simple" | "variants" | "multi-type"
  >("simple");
  const [variantLabels, setVariantLabels] = useState<string[]>([]);
  const [typeLabels, setTypeLabels] = useState<string[]>([]);
  const [fields, setFields] = useState<FieldConfig[]>([]);

  // Reset form when modal opens/closes or editing changes
  useEffect(() => {
    if (open) {
      if (editingProductLine) {
        setName(editingProductLine.name);
        setDescription(editingProductLine.description || "");
        setDisplayOrder(editingProductLine.displayOrder.toString());
        setActive(editingProductLine.active);
        setPricingType(editingProductLine.pricingStructure.type);
        setVariantLabels(
          editingProductLine.pricingStructure.variantLabels || []
        );
        setTypeLabels(editingProductLine.pricingStructure.typeLabels || []);
        setFields((editingProductLine.fields || []) as FieldConfig[]);
      } else {
        resetForm();
      }
    }
  }, [open, editingProductLine]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setDisplayOrder("");
    setActive(true);
    setPricingType("simple");
    setVariantLabels([]);
    setTypeLabels([]);
    setFields([]);
  };

  const handleAddVariantLabel = () => {
    setVariantLabels([...variantLabels, ""]);
  };

  const handleRemoveVariantLabel = (index: number) => {
    setVariantLabels(variantLabels.filter((_, i) => i !== index));
  };

  const handleUpdateVariantLabel = (index: number, value: string) => {
    const updated = [...variantLabels];
    updated[index] = value;
    setVariantLabels(updated);
  };

  const handleAddTypeLabel = () => {
    setTypeLabels([...typeLabels, ""]);
  };

  const handleRemoveTypeLabel = (index: number) => {
    setTypeLabels(typeLabels.filter((_, i) => i !== index));
  };

  const handleUpdateTypeLabel = (index: number, value: string) => {
    const updated = [...typeLabels];
    updated[index] = value;
    setTypeLabels(updated);
  };

  const handleAddField = () => {
    setFields([
      ...fields,
      {
        name: "",
        label: "",
        type: "text",
        placeholder: "",
        required: false,
        options: [],
      },
    ]);
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const handleUpdateField = (index: number, updates: Partial<FieldConfig>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    setFields(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!name.trim()) {
      toast.error("Product line name is required");
      return;
    }

    if (pricingType === "variants" && variantLabels.length === 0) {
      toast.error(
        "At least one variant label is required for variants pricing"
      );
      return;
    }

    if (pricingType === "multi-type" && typeLabels.length === 0) {
      toast.error("At least one type label is required for multi-type pricing");
      return;
    }

    // Check if all variant/type labels are filled
    if (pricingType === "variants" && variantLabels.some((v) => !v.trim())) {
      toast.error("All variant labels must be filled");
      return;
    }

    if (pricingType === "multi-type" && typeLabels.some((t) => !t.trim())) {
      toast.error("All type labels must be filled");
      return;
    }

    // Build payload
    const payload: any = {
      name: name.trim(),
      description: description.trim(),
      displayOrder: displayOrder ? parseInt(displayOrder) : 0,
      active,
      pricingStructure: {
        type: pricingType,
        variantLabels: pricingType === "variants" ? variantLabels : [],
        typeLabels: pricingType === "multi-type" ? typeLabels : [],
      },
      fields: fields.map((f) => ({
        name: f.name,
        label: f.label,
        type: f.type,
        placeholder: f.placeholder || "",
        required: f.required,
        options: f.type === "select" ? f.options : [],
      })),
    };

    if (editingProductLine) {
      payload.id = editingProductLine._id;
    }

    await onSubmit(payload);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hidden rounded-xs">
        <DialogHeader>
          <DialogTitle>
            {editingProductLine ? "Edit Product Line" : "Add Product Line"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Product Line Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Cannacrispy"
                className="rounded-xs"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the product line"
                className="rounded-xs"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  placeholder="0"
                  className="rounded-xs"
                />
              </div>

              <div>
                <Label htmlFor="active">Status</Label>
                <Select
                  value={active ? "active" : "inactive"}
                  onValueChange={(value) => setActive(value === "active")}
                >
                  <SelectTrigger className="rounded-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xs">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Pricing Structure */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold text-lg">Pricing Structure</h3>

            <div>
              <Label htmlFor="pricingType">Pricing Type *</Label>
              <Select
                value={pricingType}
                onValueChange={(value: any) => setPricingType(value)}
              >
                <SelectTrigger className="rounded-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xs">
                  <SelectItem value="simple">
                    Simple (single price + discount)
                  </SelectItem>
                  <SelectItem value="variants">
                    Variants (multiple dosage/size options)
                  </SelectItem>
                  <SelectItem value="multi-type">
                    Multi-Type (strain/type options)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Variant Labels */}
            {pricingType === "variants" && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Variant Labels</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddVariantLabel}
                    className="rounded-xs"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Variant
                  </Button>
                </div>
                {variantLabels.map((label, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={label}
                      onChange={(e) =>
                        handleUpdateVariantLabel(index, e.target.value)
                      }
                      placeholder="e.g., 100Mg"
                      className="rounded-xs"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveVariantLabel(index)}
                      className="rounded-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {variantLabels.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No variants added yet. Click "Add Variant" to add one.
                  </p>
                )}
              </div>
            )}

            {/* Type Labels */}
            {pricingType === "multi-type" && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Type Labels</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTypeLabel}
                    className="rounded-xs"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add Type
                  </Button>
                </div>
                {typeLabels.map((label, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={label}
                      onChange={(e) =>
                        handleUpdateTypeLabel(index, e.target.value)
                      }
                      placeholder="e.g., hybrid, indica, sativa"
                      className="rounded-xs"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveTypeLabel(index)}
                      className="rounded-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {typeLabels.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No types added yet. Click "Add Type" to add one.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Custom Fields */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Custom Fields</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddField}
                className="rounded-xs"
              >
                <Plus className="w-4 h-4 mr-1" /> Add Field
              </Button>
            </div>

            {fields.map((field, index) => (
              <div
                key={index}
                className="p-4 border rounded-xs space-y-3 bg-secondary/10"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-sm">Field {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveField(index)}
                    className="rounded-xs"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Field Name</Label>
                    <Input
                      value={field.name}
                      onChange={(e) =>
                        handleUpdateField(index, { name: e.target.value })
                      }
                      placeholder="e.g., subProductLine"
                      className="rounded-xs"
                    />
                  </div>

                  <div>
                    <Label>Field Label</Label>
                    <Input
                      value={field.label}
                      onChange={(e) =>
                        handleUpdateField(index, { label: e.target.value })
                      }
                      placeholder="e.g., Sub Product Line"
                      className="rounded-xs"
                    />
                  </div>

                  <div>
                    <Label>Field Type</Label>
                    <Select
                      value={field.type}
                      onValueChange={(value: any) =>
                        handleUpdateField(index, { type: value })
                      }
                    >
                      <SelectTrigger className="rounded-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xs">
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="select">Select</SelectItem>
                        <SelectItem value="textarea">Textarea</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Placeholder</Label>
                    <Input
                      value={field.placeholder}
                      onChange={(e) =>
                        handleUpdateField(index, {
                          placeholder: e.target.value,
                        })
                      }
                      placeholder="Optional placeholder text"
                      className="rounded-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`required-${index}`}
                    checked={field.required}
                    onChange={(e) =>
                      handleUpdateField(index, { required: e.target.checked })
                    }
                    className="w-4 h-4 rounded-xs"
                  />
                  <Label htmlFor={`required-${index}`}>Required field</Label>
                </div>
              </div>
            ))}

            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No custom fields added yet. Click "Add Field" to add one.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xs"
            >
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {editingProductLine ? "Update" : "Create"} Product Line
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
