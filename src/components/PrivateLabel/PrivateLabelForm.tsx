"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus, Upload } from "lucide-react";
import { useGetPrivateLabelProductsQuery } from "@/redux/api/PrivateLabel/privateLabelApi";
import { ImagePreviewModal } from "@/components/Orders/OrderPage/ImagePreviewModal";
import { cn } from "@/lib/utils";

interface FormItem {
  privateLabelType: string;
  flavor: string;
  quantity: number | "";
  unitPrice: number;
  labelFiles: File[];
  existingImages?: Array<{
    url: string;
    secureUrl: string;
    publicId: string;
    format: string;
    bytes: number;
    originalFilename: string;
  }>;
}

interface PrivateLabelFormProps {
  onChange: (formData: {
    items: FormItem[];
    discount: number;
    discountType: "flat" | "percentage";
    note: string;
  }) => void;
  initialData?: {
    items: FormItem[];
    discount: number;
    discountType: "flat" | "percentage";
    note: string;
  };
}

export const PrivateLabelForm: React.FC<PrivateLabelFormProps> = ({
  onChange,
  initialData,
}) => {
  const { data: productsData, isLoading } = useGetPrivateLabelProductsQuery({
    activeOnly: true,
  });

  const products = productsData?.products || [];

  const [items, setItems] = useState<FormItem[]>(
    initialData?.items || [
      {
        privateLabelType: "",
        flavor: "",
        quantity: "",
        unitPrice: 0,
        labelFiles: [],
      },
    ]
  );

  const [discountType, setDiscountType] = useState<"flat" | "percentage">(
    initialData?.discountType || "flat"
  );
  const [discountValue, setDiscountValue] = useState<number>(
    initialData?.discount || 0
  );
  const [note, setNote] = useState<string>(initialData?.note || "");
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    filename: string;
  } | null>(null);

  // Update state when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setItems(initialData.items);
      setDiscountType(initialData.discountType);
      setDiscountValue(initialData.discount);
      setNote(initialData.note);
    }
  }, [initialData]);

  // Calculate totals
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * item.unitPrice,
    0
  );

  const discountAmount =
    discountType === "percentage"
      ? (subtotal * discountValue) / 100
      : discountValue;

  const total = Math.max(0, subtotal - discountAmount);

  // Notify parent whenever form changes
  useEffect(() => {
    onChange({
      items,
      discount: discountValue,
      discountType,
      note,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, discountValue, discountType, note]);

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        privateLabelType: "",
        flavor: "",
        quantity: "",
        unitPrice: 0,
        labelFiles: [],
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof FormItem,
    value: any
  ) => {
    const newItems = [...items];
    if (field === "privateLabelType") {
      // Find the selected product and update unit price
      const selectedProduct = products.find((p: any) => p.name === value);
      newItems[index] = {
        ...newItems[index],
        privateLabelType: value,
        unitPrice: selectedProduct?.unitPrice || 0,
      };
    } else {
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };
    }
    setItems(newItems);
  };

  const handleFileChange = (index: number, files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const newItems = [...items];

    // Validate: max 5 files per item, 5MB each
    if (fileArray.length > 5) {
      alert("Maximum 5 files allowed per item");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    const oversizedFiles = fileArray.filter((f) => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      alert("Each file must be less than 5MB");
      return;
    }

    newItems[index].labelFiles = fileArray;
    setItems(newItems);
  };

  const handleRemoveFile = (itemIndex: number, fileIndex: number) => {
    const newItems = [...items];
    newItems[itemIndex].labelFiles = newItems[itemIndex].labelFiles.filter(
      (_, i) => i !== fileIndex
    );
    setItems(newItems);
  };

  const handleRemoveExistingImage = (itemIndex: number, imageIndex: number) => {
    const newItems = [...items];
    if (newItems[itemIndex].existingImages) {
      newItems[itemIndex].existingImages = newItems[
        itemIndex
      ].existingImages!.filter((_, i) => i !== imageIndex);
    }
    setItems(newItems);
  };

  if (isLoading) {
    return <div className="text-muted-foreground">Loading products...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Items Section */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <Label className="text-lg font-semibold">Items</Label>
          <Button
            type="button"
            onClick={handleAddItem}
            variant="outline"
            size="sm"
            className="flex items-center gap-1 rounded-xs"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <Card
              key={index}
              className="p-4 border-2 border-primary/20 bg-card rounded-xs"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-card-foreground">
                  Item #{index + 1}
                </h3>
                {items.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Type */}
                <div>
                  <Label>Product Type *</Label>
                  <Select
                    value={item.privateLabelType}
                    onValueChange={(value) =>
                      handleItemChange(index, "privateLabelType", value)
                    }
                  >
                    <SelectTrigger className="w-full bg-background rounded-xs">
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product: any) => (
                        <SelectItem key={product._id} value={product.name}>
                          {product.name} - ${product.unitPrice.toFixed(2)}/each
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {item.unitPrice > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Unit price: ${item.unitPrice.toFixed(2)}/each
                    </p>
                  )}
                </div>

                {/* Flavor */}
                <div>
                  <Label>Flavor *</Label>
                  <Input
                    value={item.flavor}
                    onChange={(e) =>
                      handleItemChange(index, "flavor", e.target.value)
                    }
                    placeholder="e.g., Strawberry Lemonade"
                    className="rounded-xs"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    min="0"
                    value={item.quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow empty string for user to clear and type
                      if (value === "") {
                        handleItemChange(index, "quantity", "");
                      } else {
                        handleItemChange(index, "quantity", parseInt(value));
                      }
                    }}
                    placeholder="Enter quantity"
                    className="rounded-xs"
                  />
                </div>

                {/* Item Total (Read-only) */}
                <div>
                  <Label>Item Total</Label>
                  <div className="h-10 px-3 py-2 bg-muted border rounded-xs font-semibold text-primary">
                    $
                    {((Number(item.quantity) || 0) * item.unitPrice).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="mt-4">
                <Label>Label Images (Max 5 files, 5MB each)</Label>
                <div className="mt-2">
                  <label
                    htmlFor={`file-upload-${index}`}
                    className="cursor-pointer"
                  >
                    <div className="border-2 border-dashed border-primary/30 rounded-xs p-4 text-center hover:border-primary transition bg-card">
                      <Upload className="w-8 h-8 mx-auto text-primary mb-2" />
                      <p className="text-sm text-card-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                    <input
                      id={`file-upload-${index}`}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileChange(index, e.target.files)}
                      className="hidden"
                    />
                  </label>

                  {/* Image Preview - Existing Images and New Files */}
                  {((item.existingImages && item.existingImages.length > 0) ||
                    item.labelFiles.length > 0) && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 gap-y-8">
                      {/* Existing Images */}
                      {item.existingImages?.map((image, imageIndex) => (
                        <div
                          key={`existing-${imageIndex}`}
                          className="relative group w-full h-20"
                        >
                          <div
                            className="cursor-pointer w-full h-full hover:opacity-80 transition-opacity"
                            onClick={() =>
                              setSelectedImage({
                                url: image.secureUrl || image.url,
                                filename:
                                  image.originalFilename ||
                                  `Label-${imageIndex + 1}.${
                                    image.format || "jpg"
                                  }`,
                              })
                            }
                          >
                            <Image
                              src={image.secureUrl || image.url}
                              alt={
                                image.originalFilename ||
                                `Label ${imageIndex + 1}`
                              }
                              fill
                              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                              className="object-cover rounded border-2 border-green-600"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveExistingImage(index, imageIndex)
                            }
                            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition z-10"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <p className="text-xs text-muted-foreground mt-1 truncate absolute -bottom-5 left-0 right-0">
                            {image.originalFilename ||
                              `Image ${imageIndex + 1}`}
                          </p>
                          <span className="absolute top-1 left-1 bg-green-600 text-white text-[10px] px-1 rounded z-10">
                            Saved
                          </span>
                        </div>
                      ))}

                      {/* New Files */}
                      {item.labelFiles.map((file, fileIndex) => (
                        <div
                          key={`new-${fileIndex}`}
                          className="relative group w-full h-20"
                        >
                          {/* Using regular img for blob URLs as Next Image doesn't support them */}
                          <div
                            className="cursor-pointer w-full h-full hover:opacity-80 transition-opacity"
                            onClick={() =>
                              setSelectedImage({
                                url: URL.createObjectURL(file),
                                filename: file.name,
                              })
                            }
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-full h-full object-cover rounded border-2 border-primary"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index, fileIndex)}
                            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition z-10"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <p className="text-xs text-muted-foreground mt-1 truncate absolute -bottom-5 left-0 right-0">
                            {file.name}
                          </p>
                          <span className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1 rounded z-10">
                            New
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Note */}
      <div>
        <Label>Note</Label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add any special instructions or notes..."
          className="mt-2 rounded-xs"
          rows={3}
        />
      </div>

      <Separator />

      {/* Order Summary */}
      <Card className="p-4 bg-card border-2 border-primary/20 rounded-xs">
        <h3 className="font-semibold text-lg mb-3 text-card-foreground">
          Order Summary
        </h3>

        {/* Items breakdown */}
        <div className="space-y-2 mb-3">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                Item {index + 1}: {item.flavor || "(no flavor)"} (
                {item.privateLabelType || "N/A"})
              </span>
              <span className="font-medium text-card-foreground">
                ${((Number(item.quantity) || 0) * item.unitPrice).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <Separator className="my-3" />

        {/* Subtotal */}
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-card-foreground">Subtotal:</span>
          <span className="font-semibold text-card-foreground">
            ${subtotal.toFixed(2)}
          </span>
        </div>

        {/* Discount */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-4">
            <Label className="text-sm">Discount Type:</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={discountType === "flat"}
                  onChange={() => setDiscountType("flat")}
                  className="cursor-pointer"
                />
                <span className="text-sm">Flat ($)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={discountType === "percentage"}
                  onChange={() => setDiscountType("percentage")}
                  className="cursor-pointer"
                />
                <span className="text-sm">Percentage (%)</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-sm w-24">Discount:</Label>
            <div className="relative flex-1">
              {discountType === "flat" && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
              )}
              <Input
                type="number"
                min="0"
                max={discountType === "percentage" ? 100 : undefined}
                value={discountValue}
                onChange={(e) =>
                  setDiscountValue(parseFloat(e.target.value) || 0)
                }
                className={cn(
                  discountType === "flat" ? "pl-7" : "pr-7",
                  "rounded-xs"
                )}
              />
              {discountType === "percentage" && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  %
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-between text-sm text-destructive">
            <span>Discount Amount:</span>
            <span className="font-medium">-${discountAmount.toFixed(2)}</span>
          </div>
        </div>

        <Separator className="my-3" />

        {/* Total */}
        <div className="flex justify-between text-lg font-bold">
          <span className="text-card-foreground">Total:</span>
          <span className="text-primary">${total.toFixed(2)}</span>
        </div>
      </Card>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        image={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </div>
  );
};
