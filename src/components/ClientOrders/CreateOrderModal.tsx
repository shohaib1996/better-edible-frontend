"use client";

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, CalendarIcon } from "lucide-react";
import { format, addDays, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useGetClientsWithApprovedLabelsQuery } from "@/redux/api/PrivateLabel/privateLabelClientApi";
import { useGetApprovedLabelsByClientQuery } from "@/redux/api/PrivateLabel/labelApi";
import { useCreateClientOrderMutation } from "@/redux/api/PrivateLabel/clientOrderApi";
import { DiscountType } from "@/types";
import { ImagePreviewModal } from "@/components/Orders/OrderPage/ImagePreviewModal";
import { ClientSearchCombobox } from "./ClientSearchCombobox";
import { LabelPicker } from "./LabelPicker";
import { OrderSummary } from "./OrderSummary";
import { EarlyDateWarningDialog } from "./EarlyDateWarningDialog";

// Kept for external consumers that may import this type
export interface OrderItem {
  labelId: string;
  flavorName: string;
  productType: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  labelImageUrl?: string;
}

interface CreateOrderModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateOrderModal = ({ open, onClose, onSuccess }: CreateOrderModalProps) => {
  const defaultDeliveryDate = addDays(startOfDay(new Date()), 14);

  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  // labelId → quantity (0 means not ordered)
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(defaultDeliveryDate);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<DiscountType>("flat");
  const [note, setNote] = useState("");
  const [shipASAP, setShipASAP] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ url: string; filename: string } | null>(null);
  const [showEarlyDateWarning, setShowEarlyDateWarning] = useState(false);

  const { data: clients, isLoading: clientsLoading } = useGetClientsWithApprovedLabelsQuery({
    search: clientSearchQuery || undefined,
    limit: 10,
  });
  const { data: rawLabels, isLoading: labelsLoading } = useGetApprovedLabelsByClientQuery(
    selectedClientId,
    { skip: !selectedClientId }
  );
  // Show ALL ready_for_production labels. $0 ones are shown as disabled (pricing not configured).
  // Must be memoized: inline map/filter creates a new reference every render and would cause
  // the quantities useEffect to loop infinitely.
  const labels = useMemo(() => rawLabels, [rawLabels]);
  const [createOrder, { isLoading }] = useCreateClientOrderMutation();

  // Reset quantities when client changes
  useEffect(() => {
    setQuantities({});
  }, [selectedClientId]);

  // Pre-fill 140 for labels that have a price; skip $0 ones (not orderable)
  useEffect(() => {
    if (!labels || labels.length === 0) return;
    setQuantities((prev) => {
      const next = { ...prev };
      for (const label of labels) {
        if (!(label._id in next) && (label.unitPrice || 0) > 0) {
          next[label._id] = 140;
        }
      }
      return next;
    });
  }, [labels]);

  const handleQuantityChange = (labelId: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [labelId]: qty }));
  };

  // Items that actually have a quantity > 0
  const orderedLabels = (labels ?? []).filter((l) => (quantities[l._id] || 0) > 0);

  const subtotal = (labels ?? []).reduce((sum, l) => {
    const qty = quantities[l._id] || 0;
    return sum + qty * (l.unitPrice || 0);
  }, 0);
  const discountAmount = discountType === "percentage" ? (subtotal * discount) / 100 : discount;
  const total = Math.max(0, subtotal - discountAmount);

  const isEarlyDeliveryDate = (date: Date | undefined) => {
    if (!date) return false;
    return startOfDay(date) < startOfDay(addDays(new Date(), 14));
  };

  const handleSubmit = async () => {
    if (!selectedClientId) return toast.error("Please select a client");
    if (orderedLabels.length === 0) return toast.error("Please enter a quantity for at least one label");
    if (!deliveryDate) return toast.error("Please select a delivery date");
    if (isEarlyDeliveryDate(deliveryDate)) {
      setShowEarlyDateWarning(true);
      return;
    }
    await submitOrder();
  };

  const submitOrder = async () => {
    try {
      let userId: string | undefined;
      let userType: "admin" | "rep" | undefined;
      try {
        const storedUser = localStorage.getItem("better-user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          userId = user.id;
          userType = user.role === "superadmin" || user.role === "manager" ? "admin" : "rep";
        }
      } catch { /* ignore */ }

      await createOrder({
        clientId: selectedClientId,
        deliveryDate: deliveryDate!.toISOString(),
        items: orderedLabels.map((l) => ({ labelId: l._id, quantity: quantities[l._id] })),
        discount,
        discountType,
        note: note || undefined,
        shipASAP,
        userId,
        userType,
      }).unwrap();

      toast.success("Order created successfully!");
      onSuccess();
      onClose();
      resetForm();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to create order");
    }
  };

  const resetForm = () => {
    setSelectedClientId("");
    setQuantities({});
    setDeliveryDate(addDays(startOfDay(new Date()), 14));
    setDiscount(0);
    setDiscountType("flat");
    setNote("");
    setShipASAP(false);
    setClientSearchQuery("");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hidden rounded-xs border-border dark:border-white/20 dark:bg-card">
          <DialogHeader>
            <DialogTitle>Create New Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Client */}
            <ClientSearchCombobox
              clients={clients}
              isLoading={clientsLoading}
              selectedClientId={selectedClientId}
              searchQuery={clientSearchQuery}
              onSearchChange={setClientSearchQuery}
              onSelect={setSelectedClientId}
            />

            {/* Labels + quantities (single step) */}
            <LabelPicker
              selectedClientId={selectedClientId}
              labels={labels}
              isLoading={labelsLoading}
              quantities={quantities}
              onQuantityChange={handleQuantityChange}
              onPreviewImage={(url, filename) => setPreviewImage({ url, filename })}
            />

            {/* Delivery Date */}
            <div>
              <Label>Delivery Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal rounded-xs border-border dark:border-white/20 bg-card hover:bg-muted/50 hover:text-foreground",
                      !deliveryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {deliveryDate ? format(deliveryDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 rounded-xs border-border dark:border-white/20 bg-card"
                  align="start"
                >
                  <Calendar mode="single" selected={deliveryDate} onSelect={setDeliveryDate} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Discount */}
            <div>
              <Label>Discount (for price adjustments)</Label>
              <div className="flex gap-2 mt-1">
                <Select value={discountType} onValueChange={(v: DiscountType) => setDiscountType(v)}>
                  <SelectTrigger className="w-[140px] rounded-xs border-border dark:border-white/20 bg-card">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xs border-border dark:border-white/20 bg-card">
                    <SelectItem value="flat" className="rounded-xs cursor-pointer focus:bg-accent/50">
                      Flat ($)
                    </SelectItem>
                    <SelectItem value="percentage" className="rounded-xs cursor-pointer focus:bg-accent/50">
                      Percentage (%)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  min={0}
                  max={discountType === "percentage" ? 100 : undefined}
                  className="flex-1 rounded-xs border-border dark:border-white/20 bg-card"
                />
              </div>
            </div>

            {/* Ship ASAP */}
            <div className="flex items-center space-x-2 p-4 border rounded-xs bg-card border-border dark:border-white/20">
              <Checkbox
                id="shipASAP"
                checked={shipASAP}
                onCheckedChange={(checked) => {
                  const on = !!checked;
                  setShipASAP(on);
                  if (on) {
                    const twoWeeksOut = addDays(startOfDay(new Date()), 14);
                    setDeliveryDate(twoWeeksOut);
                    toast.info(`Delivery date set to ${format(twoWeeksOut, "PPP")} (2 weeks). You can adjust it if needed.`);
                  }
                }}
                className="rounded-xs data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary"
              />
              <div>
                <Label htmlFor="shipASAP" className="cursor-pointer font-medium">Ship ASAP</Label>
                <p className="text-xs text-muted-foreground">
                  Ship as soon as ready, don&apos;t wait for delivery date
                </p>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="note">Notes (optional)</Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add any notes for this order..."
                rows={3}
                className="rounded-xs border-border dark:border-white/20 bg-card"
              />
            </div>

            {/* Summary — only when at least one label has a qty */}
            {orderedLabels.length > 0 && (
              <OrderSummary
                subtotal={subtotal}
                discount={discount}
                discountType={discountType}
                discountAmount={discountAmount}
                total={total}
              />
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-xs border-border dark:border-white/20 bg-card hover:bg-accent/50 text-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !selectedClientId || orderedLabels.length === 0 || !deliveryDate}
                className="rounded-xs bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Order
              </Button>
            </div>
          </div>
        </DialogContent>

        <ImagePreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />
      </Dialog>

      <EarlyDateWarningDialog
        open={showEarlyDateWarning}
        onOpenChange={setShowEarlyDateWarning}
        onConfirm={() => {
          setShowEarlyDateWarning(false);
          submitOrder();
        }}
      />
    </>
  );
};
