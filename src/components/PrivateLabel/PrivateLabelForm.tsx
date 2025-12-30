"use client";

import React, { useState, useEffect } from "react";
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
import { cn } from "@/lib/utils";

interface FormItem {
  privateLabelType: string;
  flavor: string;
  quantity: number;
  unitPrice: number;
  labelFiles: File[];
}

interface PrivateLabelFormProps {
  onChange: (formData: {
    items: FormItem[];
    discount: number;
    discountType: "flat" | "percentage";
    note: string;
  }) => void;
}

export const PrivateLabelForm: React.FC<PrivateLabelFormProps> = ({
  onChange,
}) => {
  const { data: productsData, isLoading } = useGetPrivateLabelProductsQuery({
    activeOnly: true,
  });

  const products = productsData?.products || [];

  const [items, setItems] = useState<FormItem[]>([
    {
      privateLabelType: "",
      flavor: "",
      quantity: 1,
      unitPrice: 0,
      labelFiles: [],
    },
  ]);

  const [discountType, setDiscountType] = useState<"flat" | "percentage">(
    "flat"
  );
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [note, setNote] = useState<string>("");

  // Calculate totals
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
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
        quantity: 1,
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

  if (isLoading) {
    return <div className="text-gray-500">Loading products...</div>;
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
            className="flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </Button>
        </div>

        <div className="space-y-4">
          {items.map((item, index) => (
            <Card
              key={index}
              className="p-4 border-2 border-orange-200 bg-linear-to-r from-orange-50 to-yellow-50"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-gray-700">
                  Item #{index + 1}
                </h3>
                {items.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                    <SelectTrigger className="bg-white">
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
                    <p className="text-xs text-gray-600 mt-1">
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
                    className="bg-white"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <Label>Quantity *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      handleItemChange(
                        index,
                        "quantity",
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="bg-white"
                  />
                </div>

                {/* Item Total (Read-only) */}
                <div>
                  <Label>Item Total</Label>
                  <div className="h-10 px-3 py-2 bg-gray-100 border rounded-md font-semibold text-orange-700">
                    ${(item.quantity * item.unitPrice).toFixed(2)}
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
                    <div className="border-2 border-dashed border-orange-300 rounded-lg p-4 text-center hover:border-orange-500 transition bg-white">
                      <Upload className="w-8 h-8 mx-auto text-orange-500 mb-2" />
                      <p className="text-sm text-gray-600">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
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

                  {/* File Preview */}
                  {item.labelFiles.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                      {item.labelFiles.map((file, fileIndex) => (
                        <div key={fileIndex} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-20 object-cover rounded border-2 border-orange-300"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(index, fileIndex)}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <p className="text-xs text-gray-600 mt-1 truncate">
                            {file.name}
                          </p>
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
          className="mt-2"
          rows={3}
        />
      </div>

      <Separator />

      {/* Order Summary */}
      <Card className="p-4 bg-linear-to-r from-orange-50 to-yellow-50 border-2 border-orange-200">
        <h3 className="font-semibold text-lg mb-3 text-gray-700">
          Order Summary
        </h3>

        {/* Items breakdown */}
        <div className="space-y-2 mb-3">
          {items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-600">
                Item {index + 1}: {item.flavor || "(no flavor)"} (
                {item.privateLabelType || "N/A"})
              </span>
              <span className="font-medium">
                ${(item.quantity * item.unitPrice).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <Separator className="my-3" />

        {/* Subtotal */}
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Subtotal:</span>
          <span className="font-semibold">${subtotal.toFixed(2)}</span>
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
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
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
                  "bg-white",
                  discountType === "flat" ? "pl-7" : "pr-7"
                )}
              />
              {discountType === "percentage" && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                  %
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-between text-sm text-red-600">
            <span>Discount Amount:</span>
            <span className="font-medium">-${discountAmount.toFixed(2)}</span>
          </div>
        </div>

        <Separator className="my-3" />

        {/* Total */}
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span className="text-orange-700">${total.toFixed(2)}</span>
        </div>
      </Card>
    </div>
  );
};
