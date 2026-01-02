"use client";

import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

interface CreatePrivateLabelOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isRepView?: boolean;
  currentRepId?: string;
}

export const CreatePrivateLabelOrderModal: React.FC<
  CreatePrivateLabelOrderModalProps
> = ({ open, onClose, onSuccess, isRepView = false, currentRepId }) => {
  const [createOrder, { isLoading }] = useCreatePrivateLabelOrderMutation();

  const [storeId, setStoreId] = useState("");
  const [repId, setRepId] = useState(isRepView ? currentRepId || "" : "");
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

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
        formDataToSend.append(
          "deliveryDate",
          format(deliveryDate, "yyyy-MM-dd")
        );
      }

      await createOrder(formDataToSend).unwrap();
      toast.success("Private label order created successfully!");

      // Reset form and close modal
      resetForm();
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast.error(error?.data?.message || "Error creating order");
    }
  };

  const resetForm = () => {
    setStoreId("");
    setRepId(isRepView ? currentRepId || "" : "");
    setDeliveryDate(undefined);
    setCalendarOpen(false);
    setFormData({
      items: [],
      discount: 0,
      discountType: "flat",
      note: "",
    });
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-4xl h-[90vh] overflow-y-auto scrollbar-hidden rounded-xs">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <span className="text-2xl">📦</span>
            Create Private Label Order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3">
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
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-2 rounded-xs",
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
                  onSelect={(date) => {
                    setDeliveryDate(date);
                    setCalendarOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Private Label Form */}
          <PrivateLabelForm
            onChange={handleFormChange}
            initialData={formData.items.length > 0 ? formData : undefined}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            className="rounded-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xs"
          >
            {isLoading ? "Creating..." : "Create Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
