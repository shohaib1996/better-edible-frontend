"use client";

import { useState, useEffect } from "react";
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
import { useGetApprovedLabelsByClientQuery } from "@/redux/api/PrivateLabel/labelApi";
import { useUpdateClientOrderMutation } from "@/redux/api/PrivateLabel/clientOrderApi";
import { Loader2 } from "lucide-react";
import { PRODUCTION_QUANTITIES } from "@/constants/privateLabel";
import { ILabel, DiscountType, IClientOrder } from "@/types";

interface EditOrderModalProps {
  open: boolean;
  onClose: () => void;
  order: IClientOrder;
  onSuccess: () => void;
}

interface OrderItem {
  labelId: string;
  flavorName: string;
  productType: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export const EditOrderModal = ({
  open,
  onClose,
  order,
  onSuccess,
}: EditOrderModalProps) => {
  const [selectedLabels, setSelectedLabels] = useState<OrderItem[]>([]);
  const [deliveryDate, setDeliveryDate] = useState<string>("");
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<DiscountType>("flat");
  const [note, setNote] = useState<string>("");
  const [shipASAP, setShipASAP] = useState<boolean>(false);

  const clientId = order.client?._id || "";

  const { data: labels, isLoading: labelsLoading } =
    useGetApprovedLabelsByClientQuery(clientId, {
      skip: !clientId || !open,
    });
  const [updateOrder, { isLoading }] = useUpdateClientOrderMutation();

  // Initialize form with order data when modal opens
  useEffect(() => {
    if (open && order) {
      // Map order items to the local state format
      const mappedItems: OrderItem[] = order.items.map((item) => ({
        labelId: typeof item.label === "string" ? item.label : item.label._id,
        flavorName: item.flavorName,
        productType: item.productType,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
      }));
      setSelectedLabels(mappedItems);

      // Format date for input
      const date = new Date(order.deliveryDate);
      setDeliveryDate(date.toISOString().split("T")[0]);

      setDiscount(order.discount || 0);
      setDiscountType(order.discountType || "flat");
      setNote(order.note || "");
      setShipASAP(order.shipASAP || false);
    }
  }, [open, order]);

  // Handle label selection
  const handleLabelToggle = (label: ILabel) => {
    const exists = selectedLabels.find((l) => l.labelId === label._id);
    if (exists) {
      setSelectedLabels(selectedLabels.filter((l) => l.labelId !== label._id));
    } else {
      const unitPrice = label.unitPrice || 0;
      setSelectedLabels([
        ...selectedLabels,
        {
          labelId: label._id,
          flavorName: label.flavorName,
          productType: label.productType,
          quantity: PRODUCTION_QUANTITIES.HALF_BATCH,
          unitPrice,
          lineTotal: PRODUCTION_QUANTITIES.HALF_BATCH * unitPrice,
        },
      ]);
    }
  };

  // Update quantity
  const handleQuantityChange = (labelId: string, quantity: number) => {
    setSelectedLabels(
      selectedLabels.map((item) => {
        if (item.labelId === labelId) {
          return {
            ...item,
            quantity,
            lineTotal: Number((quantity * item.unitPrice).toFixed(2)),
          };
        }
        return item;
      }),
    );
  };

  // Set quick quantity (half or full batch)
  const setQuickQuantity = (labelId: string, type: "half" | "full") => {
    const quantity =
      type === "half"
        ? PRODUCTION_QUANTITIES.HALF_BATCH
        : PRODUCTION_QUANTITIES.FULL_BATCH;
    handleQuantityChange(labelId, quantity);
  };

  // Calculate totals
  const subtotal = selectedLabels.reduce(
    (sum, item) => sum + item.lineTotal,
    0,
  );
  const discountAmount =
    discountType === "percentage" ? (subtotal * discount) / 100 : discount;
  const total = Math.max(0, subtotal - discountAmount);

  // Submit order
  const handleSubmit = async () => {
    if (selectedLabels.length === 0) {
      toast.error("Please select at least one label");
      return;
    }
    if (!deliveryDate) {
      toast.error("Please select a delivery date");
      return;
    }

    try {
      await updateOrder({
        id: order._id,
        deliveryDate,
        items: selectedLabels.map((item) => ({
          labelId: item.labelId,
          quantity: item.quantity,
        })),
        discount,
        discountType,
        note: note || undefined,
        shipASAP,
      }).unwrap();

      toast.success("Order updated successfully!");
      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error("Error updating order:", error);
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to update order");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-xs border-border bg-card">
        <DialogHeader>
          <DialogTitle>Edit Order - {order.orderNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Info (Read-only) */}
          <div>
            <Label>Client</Label>
            <p className="text-sm text-muted-foreground mt-1">
              {order.client?.store?.name || "Unknown Store"}
            </p>
          </div>

          {/* Label Selection */}
          {labelsLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}

          {!labelsLoading && labels && labels.length > 0 && (
            <div>
              <Label>Select Labels *</Label>
              <div className="mt-2 space-y-2 max-h-48 overflow-y-auto border rounded-xs p-2 scrollbar-thin">
                {labels.map((label: ILabel) => (
                  <div
                    key={label._id}
                    className="flex items-center gap-3 p-2 hover:bg-accent/30 rounded-xs transition-colors"
                  >
                    <Checkbox
                      checked={selectedLabels.some(
                        (l) => l.labelId === label._id,
                      )}
                      onCheckedChange={() => handleLabelToggle(label)}
                      className="rounded-xs data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary"
                    />
                    <span className="flex-1">
                      {label.flavorName} - {label.productType} - $
                      {(label.unitPrice || 0).toFixed(2)}/unit
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!labelsLoading && labels && labels.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No approved labels found for this client.
            </p>
          )}

          {/* Quantity Inputs */}
          {selectedLabels.length > 0 && (
            <div>
              <Label>Quantities</Label>
              <div className="mt-2 space-y-3">
                {selectedLabels.map((item) => (
                  <div
                    key={item.labelId}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 border rounded-xs bg-card"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.flavorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.productType} - ${item.unitPrice.toFixed(2)}/unit
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant={
                          item.quantity === PRODUCTION_QUANTITIES.HALF_BATCH
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => setQuickQuantity(item.labelId, "half")}
                        className="rounded-xs"
                      >
                        Half (624)
                      </Button>
                      <Button
                        type="button"
                        variant={
                          item.quantity === PRODUCTION_QUANTITIES.FULL_BATCH
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => setQuickQuantity(item.labelId, "full")}
                        className="rounded-xs"
                      >
                        Full (1248)
                      </Button>
                    </div>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleQuantityChange(
                          item.labelId,
                          Number(e.target.value),
                        )
                      }
                      min={1}
                      className="w-24 rounded-xs border-border"
                    />
                    <span className="w-24 text-right font-medium">
                      ${item.lineTotal.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery Date */}
          <div>
            <Label htmlFor="editDeliveryDate">Delivery Date *</Label>
            <Input
              id="editDeliveryDate"
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="rounded-xs border-border"
            />
          </div>

          {/* Discount */}
          <div>
            <Label>Discount (for price adjustments)</Label>
            <div className="flex gap-2 mt-1">
              <Select
                value={discountType}
                onValueChange={(value: DiscountType) => setDiscountType(value)}
              >
                <SelectTrigger className="w-[140px] rounded-xs border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xs">
                  <SelectItem
                    value="flat"
                    className="rounded-xs cursor-pointer focus:bg-accent/50"
                  >
                    Flat ($)
                  </SelectItem>
                  <SelectItem
                    value="percentage"
                    className="rounded-xs cursor-pointer focus:bg-accent/50"
                  >
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
                className="flex-1 rounded-xs border-border"
              />
            </div>
          </div>

          {/* Ship ASAP Checkbox */}
          <div className="flex items-center space-x-2 p-4 border rounded-xs bg-muted/30 border-border">
            <Checkbox
              id="editShipASAP"
              checked={shipASAP}
              onCheckedChange={(checked) => setShipASAP(!!checked)}
              className="rounded-xs data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary"
            />
            <div>
              <Label
                htmlFor="editShipASAP"
                className="cursor-pointer font-medium"
              >
                Ship ASAP
              </Label>
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
              className="rounded-xs border-border"
            />
          </div>

          {/* Order Summary */}
          {selectedLabels.length > 0 && (
            <div className="p-4 border rounded-xs bg-muted/30 border-border">
              <h4 className="font-semibold mb-2">Order Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      Discount (
                      {discountType === "percentage"
                        ? `${discount}%`
                        : `$${discount}`}
                      ):
                    </span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xs border-border hover:bg-accent/50 text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isLoading || selectedLabels.length === 0 || !deliveryDate
              }
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
