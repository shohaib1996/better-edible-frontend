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
import { useCreateLabelMutation } from "@/redux/api/PrivateLabel/labelApi";
import { useGetPrivateLabelProductsQuery } from "@/redux/api/PrivateLabel/privateLabelApi";
import { Loader2, Upload, X, Plus, Trash2 } from "lucide-react";

// Helper to get user info from localStorage
const getUserFromStorage = (): {
  userId: string;
  userType: "admin" | "rep";
} | null => {
  if (typeof window === "undefined") return null;
  try {
    const storedUser = localStorage.getItem("better-user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      const userType =
        user.role === "superadmin" || user.role === "manager" ? "admin" : "rep";
      return { userId: user.id, userType };
    }
  } catch {
    console.error("Failed to parse user from localStorage");
  }
  return null;
};

interface AddLabelModalProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
  onSuccess: () => void;
}

export const AddLabelModal = ({
  open,
  onClose,
  clientId,
  onSuccess,
}: AddLabelModalProps) => {
  const [flavorName, setFlavorName] = useState("");
  const [productType, setProductType] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [cannabinoidMix, setCannabinoidMix] = useState("");
  const [color, setColor] = useState("");
  const [flavorComponents, setFlavorComponents] = useState<{ name: string; percentage: string }[]>([]);
  const [colorComponents, setColorComponents] = useState<{ name: string; percentage: string }[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const { data: productsData } = useGetPrivateLabelProductsQuery({
    activeOnly: true,
  });
  const [createLabel, { isLoading }] = useCreateLabelMutation();

  const products = productsData?.products || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/"),
    );
    if (droppedFiles.length > 0) {
      setFiles((prev) => [...prev, ...droppedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!flavorName.trim()) {
      toast.error("Please enter a flavor name");
      return;
    }
    if (!productType) {
      toast.error("Please select a product type");
      return;
    }

    try {
      const userInfo = getUserFromStorage();

      const formData = new FormData();
      formData.append("clientId", clientId);
      formData.append("flavorName", flavorName.trim());
      formData.append("productType", productType);
      if (specialInstructions.trim()) {
        formData.append("specialInstructions", specialInstructions.trim());
      }
      if (cannabinoidMix.trim()) {
        formData.append("cannabinoidMix", cannabinoidMix.trim());
      }
      if (color.trim()) {
        formData.append("color", color.trim());
      }

      if (flavorComponents.length > 0) {
        formData.append(
          "flavorComponents",
          JSON.stringify(
            flavorComponents.map((c) => ({ name: c.name.trim(), percentage: Number(c.percentage) }))
          )
        );
      }
      if (colorComponents.length > 0) {
        formData.append(
          "colorComponents",
          JSON.stringify(
            colorComponents.map((c) => ({ name: c.name.trim(), percentage: Number(c.percentage) }))
          )
        );
      }

      if (userInfo) {
        formData.append("userId", userInfo.userId);
        formData.append("userType", userInfo.userType);
      }

      files.forEach((file) => {
        formData.append("labelImages", file);
      });

      await createLabel(formData).unwrap();
      toast.success("Label created successfully!");
      onSuccess();
      onClose();
      resetForm();
    } catch (error: unknown) {
      console.error("Error creating label:", error);
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to create label");
    }
  };

  const resetForm = () => {
    setFlavorName("");
    setProductType("");
    setSpecialInstructions("");
    setCannabinoidMix("");
    setColor("");
    setFlavorComponents([]);
    setColorComponents([]);
    setFiles([]);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
              value={flavorName}
              onChange={(e) => setFlavorName(e.target.value)}
              className="rounded-xs border-border dark:border-white/20 bg-card"
            />
          </div>

          {/* Product Type */}
          <div>
            <Label htmlFor="productType">Product Type *</Label>
            <Select value={productType} onValueChange={setProductType}>
              <SelectTrigger
                id="productType"
                className="rounded-xs border-border dark:border-white/20 bg-card"
              >
                <SelectValue placeholder="Select product type" />
              </SelectTrigger>
              <SelectContent className="rounded-xs border-border dark:border-white/20 bg-card">
                {products.map(
                  (product: {
                    _id: string;
                    name: string;
                    unitPrice: number;
                  }) => (
                    <SelectItem key={product._id} value={product.name}>
                      {product.name} - ${product.unitPrice.toFixed(2)}/unit
                    </SelectItem>
                  ),
                )}
              </SelectContent>
            </Select>
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

          {/* Upload Logo */}
          <div>
            <Label>Upload Logo</Label>
            <div
              className="mt-2"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <label
                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xs cursor-pointer transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/10"
                    : "bg-muted hover:bg-muted/80 border-border dark:border-white/20"
                }`}
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className={`w-8 h-8 mb-2 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                  <p className={`text-sm ${isDragging ? "text-primary" : "text-muted-foreground"}`}>
                    {isDragging ? "Drop your logo here" : "Click or drag & drop to upload logo"}
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                />
              </label>
            </div>

            {/* File Preview */}
            {files.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {files.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-20 object-cover rounded-xs"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Flavor Components */}
          <div>
            <div className="flex items-center justify-between">
              <Label>Flavor Components</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xs border-border dark:border-white/20 h-7 text-xs"
                onClick={() => setFlavorComponents((prev) => [...prev, { name: "", percentage: "" }])}
              >
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            {flavorComponents.length > 0 && (
              <div className="space-y-2 mt-2">
                {flavorComponents.map((comp, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Name"
                      value={comp.name}
                      onChange={(e) => {
                        const updated = [...flavorComponents];
                        updated[idx].name = e.target.value;
                        setFlavorComponents(updated);
                      }}
                      className="flex-1 rounded-xs border-border dark:border-white/20 bg-card h-9"
                    />
                    <Input
                      type="number"
                      placeholder="%"
                      value={comp.percentage}
                      onChange={(e) => {
                        const updated = [...flavorComponents];
                        updated[idx].percentage = e.target.value;
                        setFlavorComponents(updated);
                      }}
                      className="w-20 rounded-xs border-border dark:border-white/20 bg-card h-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                      onClick={() => setFlavorComponents((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Color Components */}
          <div>
            <div className="flex items-center justify-between">
              <Label>Color Components</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xs border-border dark:border-white/20 h-7 text-xs"
                onClick={() => setColorComponents((prev) => [...prev, { name: "", percentage: "" }])}
              >
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            {colorComponents.length > 0 && (
              <div className="space-y-2 mt-2">
                {colorComponents.map((comp, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      placeholder="Name"
                      value={comp.name}
                      onChange={(e) => {
                        const updated = [...colorComponents];
                        updated[idx].name = e.target.value;
                        setColorComponents(updated);
                      }}
                      className="flex-1 rounded-xs border-border dark:border-white/20 bg-card h-9"
                    />
                    <Input
                      type="number"
                      placeholder="%"
                      value={comp.percentage}
                      onChange={(e) => {
                        const updated = [...colorComponents];
                        updated[idx].percentage = e.target.value;
                        setColorComponents(updated);
                      }}
                      className="w-20 rounded-xs border-border dark:border-white/20 bg-card h-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-destructive hover:text-destructive"
                      onClick={() => setColorComponents((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="rounded-xs"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Label
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
