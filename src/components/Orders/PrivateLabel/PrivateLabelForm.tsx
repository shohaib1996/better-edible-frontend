"use client";

import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StoreSelect } from "@/components/Shared/StoreSelect";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { LabelUploader } from "./LabelUploader";
import { RepSelect } from "@/components/Shared/RepSelect";

// Pricing configuration (should match backend)
const PRIVATE_LABEL_PRICING = {
  BIOMAX: {
    unitPrice: 45.0,
    defaultQuantity: 100,
  },
  Rosin: {
    unitPrice: 55.0,
    defaultQuantity: 100,
  },
};

interface PrivateLabelFormProps {
  repId?: string; // Make optional since it can be auto-filled
  onSubmit: (formData: FormData) => void;
  isSubmitting?: boolean;
}

export const PrivateLabelForm: React.FC<PrivateLabelFormProps> = ({
  repId: initialRepId,
  onSubmit,
  isSubmitting = false,
}) => {
  const [storeId, setStoreId] = useState("");
  const [repId, setRepId] = useState(initialRepId || ""); // Local rep state
  const [privateLabelType, setPrivateLabelType] = useState<"BIOMAX" | "Rosin">(
    "BIOMAX"
  );
  const [flavor, setFlavor] = useState("");
  const [quantity, setQuantity] = useState(
    PRIVATE_LABEL_PRICING.BIOMAX.defaultQuantity
  );
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();
  const [discount, setDiscount] = useState(0);
  const [note, setNote] = useState("");
  const [labelFiles, setLabelFiles] = useState<File[]>([]);

  // Calculate totals
  const pricing = PRIVATE_LABEL_PRICING[privateLabelType];
  const subtotal = quantity * pricing.unitPrice;
  const total = Math.max(0, subtotal - discount);

  // Update quantity default when product type changes
  useEffect(() => {
    setQuantity(PRIVATE_LABEL_PRICING[privateLabelType].defaultQuantity);
  }, [privateLabelType]);

  // Handler for when store is selected - auto-fill rep
  const handleStoreSelect = (selectedStoreId: string, store?: any) => {
    setStoreId(selectedStoreId);
    // If store has a rep assigned, auto-fill it
    if (store?.rep) {
      const repIdValue =
        typeof store.rep === "string" ? store.rep : store.rep._id;
      setRepId(repIdValue);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Create FormData for file upload
    const formData = new FormData();
    formData.append("repId", repId);
    formData.append("storeId", storeId);
    formData.append("privateLabelType", privateLabelType);
    formData.append("flavor", flavor);
    formData.append("quantity", quantity.toString());
    formData.append("discount", discount.toString());

    if (deliveryDate) {
      formData.append("deliveryDate", format(deliveryDate, "yyyy-MM-dd"));
    }

    if (note) {
      formData.append("note", note);
    }

    // Append label files
    labelFiles.forEach((file) => {
      formData.append("labelImages", file);
    });

    onSubmit(formData);
  };

  const isFormValid =
    storeId && repId && privateLabelType && flavor.trim() !== "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Store Selection */}
      <div className="space-y-2">
        <Label htmlFor="store">Store *</Label>
        <StoreSelect
          value={storeId}
          onChange={(id) => setStoreId(id)}
          onStoreSelect={(store) => handleStoreSelect(store._id, store)}
        />
      </div>

      {/* Rep Selection */}
      <div className="space-y-2">
        <Label htmlFor="rep">Rep *</Label>
        <RepSelect value={repId} onChange={setRepId} />
      </div>

      {/* Product Type */}
      <div className="space-y-2">
        <Label>Product Type *</Label>
        <RadioGroup
          value={privateLabelType}
          onValueChange={(value) =>
            setPrivateLabelType(value as "BIOMAX" | "Rosin")
          }
        >
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="BIOMAX" id="biomax" />
              <Label htmlFor="biomax" className="cursor-pointer font-normal">
                BIOMAX Gummy
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="Rosin" id="rosin" />
              <Label htmlFor="rosin" className="cursor-pointer font-normal">
                Rosin Gummy
              </Label>
            </div>
          </div>
        </RadioGroup>
      </div>

      {/* Flavor */}
      <div className="space-y-2">
        <Label htmlFor="flavor">Flavor *</Label>
        <Input
          id="flavor"
          placeholder="Enter flavor (e.g., Strawberry Lemonade)"
          value={flavor}
          onChange={(e) => setFlavor(e.target.value)}
          required
        />
      </div>

      {/* Label Images Upload */}
      <div className="space-y-2">
        <Label>Label Images</Label>
        <LabelUploader
          files={labelFiles}
          onFilesChange={setLabelFiles}
          maxFiles={5}
          maxSizeMB={5}
        />
      </div>

      {/* Quantity */}
      <div className="space-y-2">
        <Label htmlFor="quantity">Quantity (cases)</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value) || 0)}
        />
      </div>

      {/* Delivery Date */}
      <div className="space-y-2">
        <Label>Delivery Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !deliveryDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {deliveryDate ? (
                format(deliveryDate, "PPP")
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={deliveryDate}
              onSelect={setDeliveryDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Note */}
      <div className="space-y-2">
        <Label htmlFor="note">Note</Label>
        <Textarea
          id="note"
          placeholder="Add any special notes or instructions..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
        />
      </div>

      <Separator />

      {/* Order Summary */}
      <Card className="p-4 bg-gray-50 border">
        <h3 className="font-semibold mb-3">Order Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Unit Price:</span>
            <span className="font-medium">${pricing.unitPrice.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Quantity:</span>
            <span className="font-medium">{quantity} cases</span>
          </div>

          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="discount" className="text-sm">
              Discount
            </Label>
            <Input
              id="discount"
              type="number"
              min="0"
              max={subtotal}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              className="h-8"
            />
          </div>

          <div className="flex justify-between text-sm text-gray-600">
            <span>Discount:</span>
            <span>- ${discount.toFixed(2)}</span>
          </div>

          <Separator />

          <div className="flex justify-between font-semibold text-emerald-700">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={!isFormValid || isSubmitting}>
          {isSubmitting ? "Creating Order..." : "Create Private Label Order"}
        </Button>
      </div>
    </form>
  );
};
