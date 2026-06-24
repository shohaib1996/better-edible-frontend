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
import { Loader2, CalendarIcon, CheckCircle2, FlaskConical, ShoppingCart, Minus, Plus, AlertTriangle, Tag, Percent, Zap, X, Gift } from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useGetMyLabelsQuery } from "@/redux/api/PrivateLabel/storeLabelApi";
import { usePlaceOrderMutation } from "@/redux/api/PrivateLabel/storeOrderApi";
import { useGetPrivateLabelProductsQuery } from "@/redux/api/PrivateLabel/privateLabelApi";
import { useGetStorePromotionsQuery, useValidatePromoCodeMutation } from "@/redux/api/Promotions/promotionsApi";
import type { IStoreDraftLabel } from "@/types/privateLabel/gummyBuilder";
import type { IPromotion, IValidatePromoResult } from "@/types/promotions/promotions";

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
  const [codeInput, setCodeInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<IValidatePromoResult | null>(null);
  const [promoError, setPromoError] = useState("");

  const { data, isLoading } = useGetMyLabelsQuery(
    { storeId, stageGroup: "approved", limit: 50 },
    { skip: !open || !storeId }
  );
  const { data: productsData } = useGetPrivateLabelProductsQuery(
    { activeOnly: true },
    { skip: !open }
  );
  const { data: promosData } = useGetStorePromotionsQuery(
    { storeId },
    { skip: !open || !storeId }
  );
  const [validateCode, { isLoading: isValidating }] = useValidatePromoCodeMutation();
  const [placeOrder, { isLoading: isSubmitting }] = usePlaceOrderMutation();

  const approvedLabels = data?.labels ?? [];
  const products = productsData?.products ?? [];
  const publicPromos = promosData?.promotions ?? [];

  function isMissingRecipeData(label: IStoreDraftLabel) {
    return !label.gummyColorHex || !(label.selectedFlavors ?? []).length;
  }

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
  const discountAmount = appliedPromo
    ? appliedPromo.type === "flat"
      ? Math.min(appliedPromo.value, subtotal)
      : parseFloat(((subtotal * appliedPromo.value) / 100).toFixed(2))
    : 0;
  const orderTotal = parseFloat((subtotal - discountAmount).toFixed(2));

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
    setCodeInput("");
    setAppliedPromo(null);
    setPromoError("");
  }

  async function applyPromoDirectly(promo: IPromotion) {
    if (promo.minOrderAmount && subtotal < promo.minOrderAmount) {
      setPromoError(
        `"${promo.name}" requires a minimum order of $${promo.minOrderAmount.toFixed(2)} (current subtotal: $${subtotal.toFixed(2)})`
      );
      return;
    }
    // If the promo has a code, validate server-side to catch usage-limit issues
    if (promo.code) {
      await handleApplyCode(promo.code);
      return;
    }
    // Codeless (auto-apply / ID-only) promos — apply directly
    setAppliedPromo({
      promotionId: promo._id,
      code: promo.code,
      name: promo.name,
      type: promo.type,
      value: promo.value,
      discount: 0,
    });
    setPromoError("");
  }

  async function handleApplyCode(code: string) {
    const c = code.trim();
    if (!c) return;
    setPromoError("");
    try {
      const result = await validateCode({ code: c, storeId, orderTotal: subtotal }).unwrap();
      setAppliedPromo(result);
      setCodeInput("");
    } catch (err: unknown) {
      const e = err as { data?: { message?: string } };
      setPromoError(e.data?.message ?? "Invalid promo code");
    }
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
        ...(appliedPromo?.code
          ? { promoCode: appliedPromo.code }
          : appliedPromo?.promotionId
          ? { promotionId: appliedPromo.promotionId }
          : {}),
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
    const labelsWithMissingData = selectedLabels.filter(isMissingRecipeData);
    if (labelsWithMissingData.length > 0) {
      const names = labelsWithMissingData.map((l) => l.flavorName).join(", ");
      toast.error(`Fix AI recipe data before ordering: ${names}`);
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-xs scrollbar-hidden bg-card border-border dark:border-white/20">
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
              <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5 scrollbar-hidden">
                {approvedLabels.map((label) => {
                  const isSelected = (quantities[label._id] ?? 0) > 0;
                  const missingData = isMissingRecipeData(label);
                  return (
                    <div
                      key={label._id}
                      className={cn(
                        "rounded-xs border p-3 transition-colors",
                        missingData
                          ? "border-amber-300 dark:border-amber-700 bg-amber-400/5 opacity-70 cursor-not-allowed"
                          : isSelected
                          ? "border-primary bg-primary/5 dark:bg-primary/10"
                          : "border-border bg-background/40 hover:border-primary/40 hover:bg-muted/50 cursor-pointer"
                      )}
                    >
                      <div
                        className="flex items-center gap-3"
                        onClick={() => !isSelected && !missingData && toggleLabel(label)}
                      >
                        {/* Checkbox */}
                        <button
                          disabled={missingData}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!missingData) toggleLabel(label);
                          }}
                          className={cn(
                            "w-5 h-5 rounded-xs border-2 shrink-0 flex items-center justify-center transition-colors",
                            missingData
                              ? "border-muted-foreground/20 bg-muted/40 cursor-not-allowed"
                              : isSelected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/40 hover:border-primary/60"
                          )}
                        >
                          {isSelected && !missingData && (
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

                      {/* Missing recipe data warning */}
                      {isMissingRecipeData(label) && (
                        <div className="mt-2 flex items-center gap-1.5 rounded-xs bg-amber-400/10 border border-amber-400/30 px-2.5 py-1.5">
                          <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="text-xs text-amber-800 dark:text-amber-400">
                            AI recipe data missing — go to My Labels to fix before ordering
                          </span>
                        </div>
                      )}

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

          {/* ── Promotions ── */}
          <>
            <Separator />
              <div className="space-y-3">
                <p className="text-sm font-semibold">Promotions</p>

                {/* Applied promo banner */}
                {appliedPromo && (
                  <div className="flex items-center justify-between gap-3 rounded-xs bg-green-50 dark:bg-green-950/30 border border-green-300 dark:border-green-700 px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-green-800 dark:text-green-300 truncate">
                          {appliedPromo.name}
                          {appliedPromo.code && (
                            <span className="ml-1.5 font-mono font-bold">{appliedPromo.code}</span>
                          )}
                        </p>
                        {subtotal > 0 && (
                          <p className="text-xs text-green-700 dark:text-green-400">
                            Saves ${discountAmount.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setAppliedPromo(null)}
                      className="shrink-0 p-1 rounded-xs text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Available public promos */}
                {!appliedPromo && publicPromos.length > 0 && (
                  <div className="space-y-1.5">
                    {publicPromos.map((promo) => (
                      <button
                        key={promo._id}
                        type="button"
                        onClick={() => applyPromoDirectly(promo)}
                        className="w-full text-left flex items-center gap-3 rounded-xs border border-border bg-background/40 hover:border-primary/50 hover:bg-primary/5 active:bg-primary/10 transition-colors px-3 py-2.5 cursor-pointer"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-medium truncate">{promo.name}</span>
                            <span className="inline-flex items-center gap-1 rounded-xs bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700 px-1.5 py-0.5 text-[10px] font-semibold shrink-0">
                              {promo.type === "flat" ? <Tag className="w-2.5 h-2.5" /> : <Percent className="w-2.5 h-2.5" />}
                              {promo.type === "flat" ? `$${promo.value} off` : `${promo.value}% off`}
                            </span>
                            {promo.storeIds.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-violet-600 dark:text-violet-400 shrink-0">
                                <Gift className="w-2.5 h-2.5" /> Personal
                              </span>
                            )}
                            {promo.autoApply && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-purple-600 dark:text-purple-400 shrink-0">
                                <Zap className="w-2.5 h-2.5" /> Auto-applied
                              </span>
                            )}
                          </div>
                          {promo.description && (
                            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{promo.description}</p>
                          )}
                          {promo.minOrderAmount && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Min. order ${promo.minOrderAmount.toFixed(2)}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-primary font-medium shrink-0">Apply →</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Manual code input */}
                {!appliedPromo && (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Promo code"
                      value={codeInput}
                      onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setPromoError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && handleApplyCode(codeInput)}
                      className="rounded-xs h-9 text-sm font-mono tracking-wide"
                    />
                    <Button
                      variant="outline"
                      className="rounded-xs h-9 px-4 shrink-0"
                      onClick={() => handleApplyCode(codeInput)}
                      disabled={!codeInput.trim() || isValidating}
                    >
                      {isValidating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                    </Button>
                  </div>
                )}
                {promoError && (
                  <p className="text-xs text-destructive">{promoError}</p>
                )}
              </div>
          </>

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
                  {appliedPromo && discountAmount > 0 && (
                    <div className="flex items-center justify-between px-3 py-2 text-xs text-green-700 dark:text-green-400">
                      <span>
                        Discount
                        {appliedPromo.code && (
                          <span className="ml-1 font-mono font-semibold">({appliedPromo.code})</span>
                        )}
                      </span>
                      <span className="font-semibold tabular-nums">−${discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-3 py-2.5 bg-muted/60 dark:bg-muted/40">
                    <span className="text-sm font-bold">Total</span>
                    <span className="text-sm font-bold text-primary tabular-nums">
                      ${orderTotal.toFixed(2)}
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
