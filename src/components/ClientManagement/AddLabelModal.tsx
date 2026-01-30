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
import { Loader2, Upload, X } from "lucide-react";

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
  const [files, setFiles] = useState<File[]>([]);

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
      const formData = new FormData();
      formData.append("clientId", clientId);
      formData.append("flavorName", flavorName.trim());
      formData.append("productType", productType);

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
    setFiles([]);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
          </div>

          {/* Label Images */}
          <div>
            <Label>Label Images</Label>
            <div className="mt-2">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload label images
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
                      className="w-full h-20 object-cover rounded-md"
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

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Label
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
