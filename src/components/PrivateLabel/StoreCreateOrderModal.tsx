"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, CalendarIcon, CheckCircle2, FlaskConical, ShoppingCart, Minus, Plus } from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useGetMyLabelsQuery } from "@/redux/api/PrivateLabel/storeLabelApi";
import { usePlaceOrderMutation } from "@/redux/api/PrivateLabel/storeOrderApi";
import { useGetPrivateLabelProductsQuery } from "@/redux/api/PrivateLabel/privateLabelApi";
import type { IStoreDraftLabel } from "@/types/privateLabel/gummyBuilder";

interface StoreCreateOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  storeId: string;
}

export function StoreCreateOrderModal({
  open,
  onClose,
  onSuccess,
  storeId,
}: StoreCreateOrderModalProps) {
  const defaultDate = addDays(startOfDay(new Date()), 14);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(defaultDate);
  const [showEarlyWarning, setShowEarlyWarning] = useState(false);

  const { data, isLoading } = useGetMyLabelsQuery(
    { storeId, stageGroup: "approved", limit: 50 },
    { skip: !open || !storeId }
  );
  const { data: productsData } = useGetPrivateLabelProductsQuery(
    { activeOnly: true },
    { skip: !open }
  );
  const [placeOrder, { isLoading: isSubmitting }] = usePlaceOrderMutation();

  const approvedLabels = data?.labels ?? [];
  const products = productsData?.products ?? [];

  function getUnitPrice(label: IStoreDraftLabel): number {
    if (label.unitCost) return label.unitCost;
    const product = products.find(
      (p) => p.name.toLowerCase() === (label.productType ?? "").toLowerCase()
    );
    return product?.unitPrice ?? 0;
  }

  const selectedLabels = approvedLabels.filter((l) => (quantities[l._id] ?? 0) > 0);
  const subtotal = selectedLabels.reduce(
    (sum, l) => sum + getUnitPrice(l) * (quantities[l._id] ?? 0),
    0
  );

  function toggleLabel(label: IStoreDraftLabel) {
    setQuantities((prev) => {
      if ((prev[label._id] ?? 0) > 0) {
        const next = { ...prev };
        delete next[label._id];
        return next;
      }
      return { ...prev, [label._id]: 140 };
    });
  }

  function setQty(labelId: string, value: number) {
    const clamped = Math.max(1, value || 1);
    setQuantities((prev) => ({ ...prev, [labelId]: clamped }));
  }

  function handleReset() {
    setQuantities({});
    setDeliveryDate(defaultDate);
    setShowEarlyWarning(false);
  }

  function handleClose() {
    handleReset();
    onClose();
  }

  async function submitOrder() {
    const items = selectedLabels.map((l) => ({
      labelId: l._id,
      quantity: quantities[l._id],
    }));
    try {
      await placeOrder({
        storeId,
        items,
        deliveryDate: (deliveryDate ?? defaultDate).toISOString(),
      }).unwrap();
      toast.success("Order placed successfully!");
      handleReset();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      toast.error(e.data?.message ?? "Failed to place order");
    }
  }

  function handleSubmit() {
    if (selectedLabels.length === 0) {
      toast.error("Select at least one label to order");
      return;
    }
    if (!deliveryDate) {
      toast.error("Please select a delivery date");
      return;
    }
    const minDate = addDays(startOfDay(new Date()), 14);
    if (deliveryDate < minDate) {
      setShowEarlyWarning(true);
      return;
    }
    submitOrder();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              Place an Order
            </DialogTitle>
          </DialogHeader>

          {/* ── Label selection ── */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Select Approved Labels</p>

            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading approved labels…
              </div>
            ) : approvedLabels.length === 0 ? (
              <div className="rounded-xs border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
                No approved labels available for ordering yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
                {approvedLabels.map((label) => {
                  const isSelected = (quantities[label._id] ?? 0) > 0;
                  return (
                    <div
                      key={label._id}
                      className={cn(
                        "rounded-xs border p-3 transition-colors",
                        isSelected
                          ? "border-primary bg-primary/5 dark:bg-primary/10"
                          : "border-border hover:border-primary/40 hover:bg-muted/30 cursor-pointer"
                      )}
                    >
                      <div
                        className="flex items-center gap-3"
                        onClick={() => !isSelected && toggleLabel(label)}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLabel(label);
                          }}
                          className={cn(
                            "w-5 h-5 rounded-xs border-2 shrink-0 flex items-center justify-center transition-colors",
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/40 hover:border-primary/60"
                          )}
                        >
                          {isSelected && (
                            <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                          )}
                        </button>

                        {/* Label info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <FlaskConical className="w-3.5 h-3.5 text-primary shrink-0" />
                            <span className="font-semibold text-sm truncate">{label.flavorName}</span>
                          </div>
                          <div className="flex gap-1 mt-1 flex-wrap">
                            <Badge variant="outline" className="rounded-xs text-[10px] h-4 px-1.5 py-0">
                              {label.oilType === "rosin" ? "Rosin" : "BioMax"}
                            </Badge>
                            <Badge variant="outline" className="rounded-xs text-[10px] h-4 px-1.5 py-0">
                              {label.size === "xl" ? "XL" : "Standard"}
                            </Badge>
                          </div>
                        </div>

                        {/* Unit price */}
                        <div className="text-right shrink-0 text-xs text-muted-foreground">
                          ${getUnitPrice(label).toFixed(3)}<span className="text-[10px]">/unit</span>
                        </div>
                      </div>

                      {/* Quantity row — only when selected */}
                      {isSelected && (
                        <div className="mt-3 flex items-center gap-2 justify-between">
                          <span className="text-xs text-muted-foreground">Quantity</span>
                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="outline"
                              size="icon"
                              className="w-7 h-7 rounded-xs"
                              onClick={() => setQty(label._id, (quantities[label._id] ?? 1) - 70)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              min={1}
                              value={quantities[label._id] ?? ""}
                              onChange={(e) => setQty(label._id, parseInt(e.target.value, 10))}
                              className="w-24 h-7 text-center rounded-xs text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="w-7 h-7 rounded-xs"
                              onClick={() => setQty(label._id, (quantities[label._id] ?? 0) + 70)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <span className="text-xs font-semibold tabular-nums text-primary">
                            ${(getUnitPrice(label) * (quantities[label._id] ?? 0)).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* ── Delivery date ── */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">Requested Delivery Date</p>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start font-normal rounded-xs",
                    !deliveryDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deliveryDate ? format(deliveryDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xs" align="start">
                <Calendar
                  mode="single"
                  selected={deliveryDate}
                  onSelect={setDeliveryDate}
                  disabled={(date) => date < startOfDay(new Date())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* ── Order summary ── */}
          {selectedLabels.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-semibold">Order Summary</p>
                <div className="rounded-xs border border-border overflow-hidden divide-y divide-border">
                  {selectedLabels.map((label) => (
                    <div
                      key={label._id}
                      className="flex items-center justify-between px-3 py-2 text-xs"
                    >
                      <span className="text-muted-foreground truncate">{label.flavorName}</span>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="tabular-nums">
                          {(quantities[label._id] ?? 0).toLocaleString()} units
                        </span>
                        <span className="font-semibold tabular-nums">
                          ${(getUnitPrice(label) * (quantities[label._id] ?? 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between px-3 py-2.5 bg-muted/40">
                    <span className="text-sm font-bold">Total</span>
                    <span className="text-sm font-bold text-primary tabular-nums">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── Actions ── */}
          <div className="flex gap-2 justify-end pt-1">
            <Button
              variant="outline"
              className="rounded-xs"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="rounded-xs"
              onClick={handleSubmit}
              disabled={isSubmitting || selectedLabels.length === 0}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Place Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Early delivery date warning ── */}
      <AlertDialog open={showEarlyWarning} onOpenChange={setShowEarlyWarning}>
        <AlertDialogContent className="rounded-xs border-border dark:border-white/20 bg-secondary dark:bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Early Delivery Date</AlertDialogTitle>
            <AlertDialogDescription>
              The requested delivery date is less than 14 days away (
              {deliveryDate ? format(deliveryDate, "PPP") : "selected date"}). Production lead time
              may not allow fulfillment by this date. Do you want to proceed anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xs border-border dark:border-white/20 bg-card hover:bg-accent/50">
              Change Date
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xs"
              onClick={() => {
                setShowEarlyWarning(false);
                submitOrder();
              }}
            >
              Proceed Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
