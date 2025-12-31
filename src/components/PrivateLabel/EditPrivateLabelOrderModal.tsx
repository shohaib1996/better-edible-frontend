"use client";

import React, { useState, useCallback, useEffect } from "react";
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
import { useUpdatePrivateLabelOrderMutation } from "@/redux/api/PrivateLabel/privateLabelApi";
import { PrivateLabelForm } from "@/components/PrivateLabel/PrivateLabelForm";
import { StoreSelect } from "@/components/Shared/StoreSelect";
import { RepSelect } from "@/components/Shared/RepSelect";
import { IPrivateLabelOrder } from "@/types";

interface EditPrivateLabelOrderModalProps {
  order: IPrivateLabelOrder | null;
  onClose: () => void;
  onSuccess: () => void;
  canEdit: boolean;
}

export const EditPrivateLabelOrderModal: React.FC<
  EditPrivateLabelOrderModalProps
> = ({ order, onClose, onSuccess, canEdit }) => {
  const [updateOrder, { isLoading }] = useUpdatePrivateLabelOrderMutation();

  const [storeId, setStoreId] = useState("");
  const [repId, setRepId] = useState("");
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

  // Populate form with existing order data when order changes
  useEffect(() => {
    if (order) {
      setStoreId(typeof order.store === "string" ? order.store : order.store._id);
      setRepId(typeof order.rep === "string" ? order.rep : order.rep._id);
      setDeliveryDate(
        order.deliveryDate ? new Date(order.deliveryDate) : undefined
      );

      // Convert order items to form items format
      const formItems = order.items.map((item) => ({
        privateLabelType: item.privateLabelType,
        flavor: item.flavor,
        quantity: item.quantity,
        unitPrice: item.unitPrice || 0,
        labelFiles: [],
        existingImages: item.labelImages || [], // Pass existing images
      }));

      setFormData({
        items: formItems,
        discount: order.discount || 0,
        discountType: order.discountType || "flat",
        note: order.note || "",
      });
    }
  }, [order]);

  const handleFormChange = useCallback((data: any) => {
    setFormData(data);
  }, []);

  const handleSubmit = async () => {
    if (!order) return;

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
      // Check if there are any files to upload or if we need to update existing images
      const hasNewFiles = formData.items.some(
        (item) => item.labelFiles && item.labelFiles.length > 0
      );
      const hasExistingImagesChanges = formData.items.some(
        (item, index) => {
          const originalImages = order.items[index]?.labelImages || [];
          const currentImages = item.existingImages || [];
          return originalImages.length !== currentImages.length;
        }
      );

      if (hasNewFiles || hasExistingImagesChanges) {
        // If there are new files or image changes, use FormData
        const formDataToSend = new FormData();

        formDataToSend.append("storeId", storeId);
        formDataToSend.append("repId", repId);

        // Items with existing images to keep
        const itemsData = formData.items.map((item) => ({
          privateLabelType: item.privateLabelType,
          flavor: item.flavor,
          quantity: item.quantity,
          keepExistingImages: item.existingImages?.map((img: any) => img.publicId) || [],
        }));
        formDataToSend.append("items", JSON.stringify(itemsData));

        // Files with indexed field names
        formData.items.forEach((item, index) => {
          if (item.labelFiles && item.labelFiles.length > 0) {
            item.labelFiles.forEach((file: File) => {
              formDataToSend.append(`labelImages_${index}`, file);
            });
          }
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

        // Send FormData directly, RTK Query will handle it properly
        await updateOrder({ id: order._id, body: formDataToSend }).unwrap();
      } else {
        // If no files or image changes, use regular JSON body with keepExistingImages
        await updateOrder({
          id: order._id,
          storeId,
          repId,
          items: formData.items.map((item) => ({
            privateLabelType: item.privateLabelType,
            flavor: item.flavor,
            quantity: item.quantity,
            keepExistingImages: item.existingImages?.map((img: any) => img.publicId) || [],
          })),
          discount: formData.discount,
          discountType: formData.discountType,
          note: formData.note,
          deliveryDate: deliveryDate
            ? format(deliveryDate, "yyyy-MM-dd")
            : undefined,
        }).unwrap();
      }

      toast.success("Order updated successfully!");
      onClose();
      onSuccess();
    } catch (error: any) {
      console.error("Error updating order:", error);
      toast.error(error?.data?.message || "Error updating order");
    }
  };

  if (!order) return null;

  return (
    <Dialog open={!!order} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span className="text-2xl">✏️</span>
            Edit Private Label Order
          </DialogTitle>
        </DialogHeader>

        {!canEdit && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
            <strong>Read Only:</strong> You don't have permission to edit this
            order.
          </div>
        )}

        <div className="space-y-4 py-3">
          {/* Store and Rep Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Store *</Label>
              <StoreSelect
                value={storeId}
                onChange={canEdit ? setStoreId : () => {}}
                initialStore={
                  order?.store && typeof order.store !== "string"
                    ? { _id: order.store._id, name: order.store.name }
                    : undefined
                }
              />
            </div>

            <div>
              <Label>Rep *</Label>
              <RepSelect value={repId} onChange={setRepId} disabled={!canEdit} />
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
                  disabled={!canEdit}
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
          <PrivateLabelForm onChange={handleFormChange} initialData={formData} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !canEdit}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? "Updating..." : "Update Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
