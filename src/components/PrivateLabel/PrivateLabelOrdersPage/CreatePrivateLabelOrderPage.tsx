"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Package } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useCreatePrivateLabelOrderMutation } from "@/redux/api/PrivateLabel/privateLabelApi";
import { PrivateLabelForm } from "@/components/PrivateLabel/PrivateLabelForm";
import { StoreSelect } from "@/components/Shared/StoreSelect";
import { RepSelect } from "@/components/Shared/RepSelect";

interface CreatePrivateLabelOrderPageProps {
  isRepView?: boolean;
  currentRepId?: string;
}

export const CreatePrivateLabelOrderPage: React.FC<
  CreatePrivateLabelOrderPageProps
> = ({ isRepView = false, currentRepId }) => {
  const router = useRouter();
  const [createOrder, { isLoading }] = useCreatePrivateLabelOrderMutation();

  const [storeId, setStoreId] = useState("");
  const [repId, setRepId] = useState(isRepView ? currentRepId || "" : "");
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();

  const [formData, setFormData] = useState<{
    items: any[];
    discount: number;
    discountType: "flat" | "percentage";
    note: string;
  }>({
    items: [],
    discount: 0,
    discountType: "flat",
    note: "",
  });

  const handleFormChange = useCallback((data: any) => {
    setFormData(data);
  }, []);

  const handleSubmit = async () => {
    // Validation
    if (!storeId) {
      toast.error("Please select a store");
      return;
    }

    if (!repId) {
      toast.error("Please select a rep");
      return;
    }

    if (formData.items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    // Validate items
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.privateLabelType) {
        toast.error(`Item ${i + 1}: Please select a product type`);
        return;
      }
      if (!item.flavor) {
        toast.error(`Item ${i + 1}: Please enter a flavor`);
        return;
      }
      if (item.quantity < 1) {
        toast.error(`Item ${i + 1}: Quantity must be at least 1`);
        return;
      }
    }

    try {
      // Create FormData for file upload
      const formDataToSend = new FormData();

      formDataToSend.append("storeId", storeId);
      formDataToSend.append("repId", repId);

      // Items without files
      const itemsData = formData.items.map((item) => ({
        privateLabelType: item.privateLabelType,
        flavor: item.flavor,
        quantity: item.quantity,
      }));
      formDataToSend.append("items", JSON.stringify(itemsData));

      // Files with indexed field names
      formData.items.forEach((item, index) => {
        item.labelFiles.forEach((file: File) => {
          formDataToSend.append(`labelImages_${index}`, file);
        });
      });

      formDataToSend.append("discount", formData.discount.toString());
      formDataToSend.append("discountType", formData.discountType);

      if (formData.note) {
        formDataToSend.append("note", formData.note);
      }

      if (deliveryDate) {
        formDataToSend.append("deliveryDate", format(deliveryDate, "yyyy-MM-dd"));
      }

      await createOrder(formDataToSend).unwrap();
      toast.success("Private label order created successfully!");

      // Navigate back
      if (isRepView) {
        router.push("/rep/private-label-orders");
      } else {
        router.push("/admin/private-label-orders");
      }
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast.error(error?.data?.message || "Error creating order");
    }
  };

  const handleCancel = () => {
    if (isRepView) {
      router.push("/rep/private-label-orders");
    } else {
      router.push("/admin/private-label-orders");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-8 h-8 text-orange-600" />
            Create Private Label Order
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Fill out the details to create a new private label order
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Store and Rep Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Store *</Label>
              <StoreSelect
                value={storeId}
                onChange={setStoreId}
                onStoreSelect={(store) => {
                  if (store?.rep && !isRepView) {
                    // Auto-fill rep from store if not in rep view
                    const repIdFromStore =
                      typeof store.rep === "string" ? store.rep : store.rep._id;
                    if (repIdFromStore) {
                      setRepId(repIdFromStore);
                    }
                  }
                }}
              />
            </div>

            <div>
              <Label>Rep *</Label>
              <RepSelect
                value={repId}
                onChange={setRepId}
                disabled={isRepView} // Disable if rep view (pre-filled)
              />
            </div>
          </div>

          {/* Delivery Date */}
          <div>
            <Label>Delivery Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-2",
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
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Private Label Form */}
          <PrivateLabelForm onChange={handleFormChange} />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? "Creating..." : "Create Order"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CreatePrivateLabelOrderPage;
