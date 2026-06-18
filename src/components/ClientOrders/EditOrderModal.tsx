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
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useGetApprovedLabelsByClientQuery } from "@/redux/api/PrivateLabel/labelApi";
import { useUpdateClientOrderMutation } from "@/redux/api/PrivateLabel/clientOrderApi";
import { DiscountType, IClientOrder } from "@/types";
import { LabelPicker } from "./LabelPicker";
import { OrderSummary } from "./OrderSummary";

interface EditOrderModalProps {
  open: boolean;
  onClose: () => void;
  order: IClientOrder;
  onSuccess: () => void;
}

export const EditOrderModal = ({ open, onClose, order, onSuccess }: EditOrderModalProps) => {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [deliveryDate, setDeliveryDate] = useState<Date | undefined>(undefined);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<DiscountType>("flat");
  const [note, setNote] = useState("");
  const [shipASAP, setShipASAP] = useState(false);

  const clientId = order.client?._id || "";

  const { data: rawLabels, isLoading: labelsLoading } = useGetApprovedLabelsByClientQuery(clientId, {
    skip: !clientId || !open,
  });
  const labels = useMemo(() => rawLabels, [rawLabels]);
  const [updateOrder, { isLoading }] = useUpdateClientOrderMutation();

  // Populate form from existing order on open
  useEffect(() => {
    if (!open || !order) return;
    const initialQtys: Record<string, number> = {};
    for (const item of order.items) {
      const labelId = typeof item.label === "string" ? item.label : item.label._id;
      initialQtys[labelId] = item.quantity;
    }
    setQuantities(initialQtys);
    setDeliveryDate(new Date(order.deliveryDate));
    setDiscount(order.discount || 0);
    setDiscountType(order.discountType || "flat");
    setNote(order.note || "");
    setShipASAP(order.shipASAP || false);
  }, [open, order]);

  const handleQuantityChange = (labelId: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [labelId]: qty }));
  };

  const orderedLabels = (labels ?? []).filter((l) => (quantities[l._id] || 0) > 0);

  const subtotal = (labels ?? []).reduce((sum, l) => {
    const qty = quantities[l._id] || 0;
    return sum + qty * (l.unitPrice || 0);
  }, 0);
  const discountAmount = discountType === "percentage" ? (subtotal * discount) / 100 : discount;
  const total = Math.max(0, subtotal - discountAmount);

  const handleSubmit = async () => {
    if (orderedLabels.length === 0) return toast.error("Please enter a quantity for at least one label");
    if (!deliveryDate) return toast.error("Please select a delivery date");
    try {
      await updateOrder({
        id: order._id,
        deliveryDate: deliveryDate.toISOString(),
        items: orderedLabels.map((l) => ({ labelId: l._id, quantity: quantities[l._id] })),
        discount,
        discountType,
        note: note || undefined,
        shipASAP,
      }).unwrap();
      toast.success("Order updated successfully!");
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to update order");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scrollbar-hidden rounded-xs border-border dark:border-white/20 dark:bg-card">
        <DialogHeader>
          <DialogTitle>Edit Order - {order.orderNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client (read-only) */}
          <div>
            <Label>Client</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {order.client?.store?.name || "Unknown Store"}
            </p>
          </div>

          <LabelPicker
            selectedClientId={clientId}
            labels={labels}
            isLoading={labelsLoading}
            quantities={quantities}
            onQuantityChange={handleQuantityChange}
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
              id="editShipASAP"
              checked={shipASAP}
              onCheckedChange={(checked) => setShipASAP(!!checked)}
              className="rounded-xs data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary"
            />
            <div>
              <Label htmlFor="editShipASAP" className="cursor-pointer font-medium">Ship ASAP</Label>
              <p className="text-xs text-muted-foreground">
                Ship as soon as ready, don&apos;t wait for delivery date
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="editNote">Notes (optional)</Label>
            <Textarea
              id="editNote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add any notes for this order..."
              rows={3}
              className="rounded-xs border-border dark:border-white/20 bg-card"
            />
          </div>

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
              disabled={isLoading || orderedLabels.length === 0 || !deliveryDate}
              className="rounded-xs bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Order
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
