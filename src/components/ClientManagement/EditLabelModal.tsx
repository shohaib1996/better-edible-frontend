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
import { useUpdateLabelMutation } from "@/redux/api/PrivateLabel/labelApi";
import { useGetPrivateLabelProductsQuery } from "@/redux/api/PrivateLabel/privateLabelApi";
import { ILabel } from "@/types";
import { Loader2, Upload, X } from "lucide-react";

interface EditLabelModalProps {
  open: boolean;
  onClose: () => void;
  label: ILabel;
  onSuccess: () => void;
}

export const EditLabelModal = ({
  open,
  onClose,
  label,
  onSuccess,
}: EditLabelModalProps) => {
  const [flavorName, setFlavorName] = useState(label.flavorName);
  const [productType, setProductType] = useState(label.productType);
  const [existingImages, setExistingImages] = useState<string[]>(
    label.labelImages.map((img) => img.publicId)
  );
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const { data: productsData } = useGetPrivateLabelProductsQuery({
    activeOnly: true,
  });
  const [updateLabel, { isLoading }] = useUpdateLabelMutation();

  const products = productsData?.products || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setNewFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (publicId: string) => {
    setExistingImages((prev) => prev.filter((id) => id !== publicId));
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
    if (existingImages.length === 0 && newFiles.length === 0) {
      toast.error("Please keep at least one image or upload new ones");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("flavorName", flavorName.trim());
      formData.append("productType", productType);
      formData.append("keepExistingImages", JSON.stringify(existingImages));

      newFiles.forEach((file) => {
        formData.append("labelImages", file);
      });

      await updateLabel({
        id: label._id,
        formData,
      }).unwrap();

      toast.success("Label updated successfully!");
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error("Error updating label:", error);
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to update label");
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  const selectedProduct = products.find(
    (p: { name: string }) => p.name === productType
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
            />
          </div>

          {/* Product Type */}
          <div>
            <Label htmlFor="productType">Product Type *</Label>
            <Select value={productType} onValueChange={setProductType}>
              <SelectTrigger id="productType">
                <SelectValue placeholder="Select product type" />
              </SelectTrigger>
              <SelectContent>
                {products.map(
                  (product: { _id: string; name: string; unitPrice: number }) => (
                    <SelectItem key={product._id} value={product.name}>
                      {product.name} - ${product.unitPrice.toFixed(2)}/unit
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            {selectedProduct && (
              <p className="text-sm text-muted-foreground mt-1">
                Unit price: ${selectedProduct.unitPrice.toFixed(2)}
              </p>
            )}
          </div>

          {/* Existing Images */}
          {label.labelImages.length > 0 && (
            <div>
              <Label>Existing Images</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {label.labelImages.map((img) => (
                  <div key={img.publicId} className="relative group">
                    <img
                      src={img.secureUrl || img.url}
                      alt={label.flavorName}
                      className="w-full h-20 object-cover rounded-md"
                    />
                    {existingImages.includes(img.publicId) ? (
                      <button
                        type="button"
                        onClick={() => removeExistingImage(img.publicId)}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    ) : (
                      <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center">
                        <span className="text-white text-xs">Removed</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload New Images */}
          <div>
            <Label>Add New Images</Label>
            <div className="mt-2">
              <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                <div className="flex flex-col items-center justify-center py-4">
                  <Upload className="w-6 h-6 mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Click to upload additional images
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

            {/* New Files Preview */}
            {newFiles.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {newFiles.map((file, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`New ${index + 1}`}
                      className="w-full h-20 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewFile(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Label
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
