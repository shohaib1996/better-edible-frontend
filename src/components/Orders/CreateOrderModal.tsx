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
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Zap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import { useCreateOrderMutation } from "@/redux/api/orders/orders";
import { useGetAdminStorePromotionsQuery, useApplyPromotionCreditMutation } from "@/redux/api/Promotions/promotionsApi";
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
  const [applyPromoCredit, { isLoading: isApplyingPromo }] = useApplyPromotionCreditMutation();

  const { data: promoData } = useGetAdminStorePromotionsQuery(
    { storeId: store?._id ?? "" },
    { skip: !store?._id }
  );
  const promoBalance = promoData?.enrollment?.creditBalance ?? 0;

  // Post-creation credit step
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [promoCreditAmount, setPromoCreditAmount] = useState("");

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

      const result = await createOrder(orderData).unwrap();
      toast.success("Order created successfully!");

      // If store has promo credits, show apply step before redirecting
      const orderId = result?.order?._id ?? result?._id;
      if (orderId && promoBalance > 0) {
        setCreatedOrderId(orderId);
        return;
      }

      onClose();
      router.push("/admin/orders");
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to create order");
    }
  };

  async function handleApplyPromoAndClose() {
    if (!createdOrderId || !store?._id) return;
    const amount = parseFloat(promoCreditAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("Enter a valid amount"); return; }
    try {
      await applyPromoCredit({ storeId: store._id, amount, orderId: createdOrderId }).unwrap();
      toast.success(`$${amount.toFixed(2)} promo credit applied to order`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to apply credit");
      return;
    }
    setCreatedOrderId(null);
    onClose();
    router.push("/admin/orders");
  }

  function handleSkipCredit() {
    setCreatedOrderId(null);
    onClose();
    router.push("/admin/orders");
  }

  const handleClose = () => {
    setRepId("");
    setDeliveryDate("");
    setOrderItems([]);
    setCreatedOrderId(null);
    setPromoCreditAmount("");
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

        {/* Promo credit step — shown after order is created */}
        {createdOrderId && (
          <div className="flex flex-col gap-5 py-4">
            <div className="rounded-xs border border-green-200 bg-green-50 p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-green-800 font-semibold text-sm">
                <Zap className="w-4 h-4" />
                This store has ${promoBalance.toFixed(2)} in promotion credits
              </div>
              <p className="text-xs text-green-700">
                Apply promotion credits to this order to reduce the total owed.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Amount to apply ($)</label>
              <Input
                type="number"
                min={0.01}
                max={promoBalance}
                step={0.01}
                value={promoCreditAmount}
                onChange={(e) => setPromoCreditAmount(e.target.value)}
                placeholder={`Max $${promoBalance.toFixed(2)}`}
                className="rounded-xs max-w-xs"
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-1 border-t">
              <Button variant="outline" className="rounded-xs" onClick={handleSkipCredit}>
                Skip
              </Button>
              <Button
                className="rounded-xs bg-green-600 hover:bg-green-700 text-white"
                onClick={handleApplyPromoAndClose}
                disabled={isApplyingPromo || !promoCreditAmount}
              >
                {isApplyingPromo && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Apply & Close
              </Button>
            </div>
          </div>
        )}

        {!createdOrderId && <div className="space-y-4 py-3">
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
        </div>}

        {/* Footer Buttons — hidden during promo credit step */}
        {!createdOrderId && (
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
        )}
      </DialogContent>
    </Dialog>
  );
};
