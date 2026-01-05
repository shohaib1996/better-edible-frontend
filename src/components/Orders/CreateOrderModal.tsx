"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { useCreateOrderMutation } from "@/redux/api/orders/orders";
import { RepSelect } from "@/components/Shared/RepSelect";
import { OrderForm } from "@/components/Orders/OrderForm";
import { IStore } from "@/types";

interface CreateOrderModalProps {
  open: boolean;
  onClose: () => void;
  store: IStore | null;
}

export const CreateOrderModal = ({
  open,
  onClose,
  store,
}: CreateOrderModalProps) => {
  const router = useRouter();
  const [createOrder, { isLoading: creating }] = useCreateOrderMutation();

  // Form state
  const [repId, setRepId] = useState<string>("");
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [orderTotals, setOrderTotals] = useState({
    totalCases: 0,
    totalPrice: 0,
    discount: 0,
    finalTotal: 0,
    discountType: "flat" as "flat" | "percent",
    discountValue: 0,
    note: "",
  });

  // Initialize rep from store when modal opens
  React.useEffect(() => {
    if (open && store) {
      // Handle different rep formats: IRep object, string ID, or null
      const storeRepId = store.rep?._id || "";
      setRepId(storeRepId);
    }
  }, [open, store]);

  const onOrderFormChange = useCallback((items: any[], totals: any) => {
    setOrderItems(items);
    setOrderTotals((prev) => ({ ...prev, ...totals }));
  }, []);

  const handleSubmit = async () => {
    // Validation
    if (!store?._id) {
      toast.error("Store information is missing");
      return;
    }
    if (!repId) {
      toast.error("Please select a rep");
      return;
    }
    if (orderItems.length === 0) {
      toast.error("Please add at least one product to the order");
      return;
    }

    try {
      const orderData = {
        storeId: store._id,
        repId,
        deliveryDate,
        items: orderItems,
        subtotal: orderTotals.totalPrice,
        discountType: orderTotals.discountType,
        discountValue: orderTotals.discountValue,
        total: orderTotals.finalTotal,
        note: orderTotals.note,
      };

      await createOrder(orderData).unwrap();
      toast.success("Order created successfully!");

      // Close modal
      onClose();

      // Redirect to orders page
      router.push("/admin/orders");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to create order");
    }
  };

  const handleClose = () => {
    // Reset form
    setRepId("");
    setDeliveryDate("");
    setOrderItems([]);
    setOrderTotals({
      totalCases: 0,
      totalPrice: 0,
      discount: 0,
      finalTotal: 0,
      discountType: "flat",
      discountValue: 0,
      note: "",
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-hidden rounded-xs bg-background text-foreground border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold tracking-tight text-foreground">
            Create Order for {store?.name || "Store"}
          </DialogTitle>
          {store?.address && (
            <p className="text-sm text-muted-foreground">{store.address}</p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* Rep Selection */}
          <div className="space-y-1">
            <Label htmlFor="repId">Assigned Rep</Label>
            <RepSelect value={repId} onChange={setRepId} />
          </div>

          {/* Delivery Date */}
          <div className="space-y-1">
            <Label htmlFor="deliveryDate" className="text-muted-foreground">
              Delivery Date <span className="text-xs">(Optional)</span>
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-xs border-input bg-background hover:bg-accent hover:text-accent-foreground",
                    !deliveryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deliveryDate ? (
                    format(new Date(deliveryDate), "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xs">
                <Calendar
                  mode="single"
                  selected={deliveryDate ? new Date(deliveryDate) : undefined}
                  onSelect={(date) =>
                    setDeliveryDate(date ? format(date, "yyyy-MM-dd") : "")
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Order Form */}
          <OrderForm
            initialItems={[]}
            initialDiscountType="flat"
            initialDiscountValue={0}
            initialNote=""
            onChange={onOrderFormChange}
          />
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={creating}
            className="rounded-xs bg-accent text-accent-foreground hover:bg-accent/90 border-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={creating}
            className="rounded-xs bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {creating ? "Creating..." : "Create Order"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
