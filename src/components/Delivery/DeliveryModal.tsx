"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Truck } from "lucide-react";
import { useGetAllRepsQuery } from "@/redux/api/Rep/repApi";
import { useCreateDeliveryMutation } from "@/redux/api/Deliveries/deliveryApi";
import { toast } from "sonner";
import { IRep } from "@/types";
import { DeliveryStoreInfo } from "./DeliveryStoreInfo";
import { DeliveryRepField } from "./DeliveryRepField";
import { DeliveryDispositionField } from "./DeliveryDispositionField";
import { DeliveryAmountFields } from "./DeliveryAmountFields";
import { DeliveryScheduleField } from "./DeliveryScheduleField";

interface DeliveryModalProps {
  open: boolean;
  onClose: () => void;
  store: { _id: string; name: string; address?: string } | null;
  rep?: Partial<IRep> | null;
  sampleId?: string | null;
  orderId?: string | null;
  privateLabelOrderId?: string | null;
  clientOrderId?: string | null;
  orderAmount?: number | null;
  onSuccess?: () => void;
}

const defaultForm = {
  assignedTo: "",
  disposition: ["delivery"] as string[],
  paymentAction: "",
  amount: "",
  moneyPickupAmount: "",
  scheduledAt: new Date(),
  notes: "",
};

export const DeliveryModal = ({
  open,
  onClose,
  store,
  rep: repProp,
  sampleId,
  orderId,
  privateLabelOrderId,
  clientOrderId,
  orderAmount,
  onSuccess,
}: DeliveryModalProps) => {
  const { data: repsData, isLoading: repsLoading } = useGetAllRepsQuery({});
  const reps = repsData?.data || [];
  const [createDelivery, { isLoading: creating }] = useCreateDeliveryMutation();

  const [formData, setFormData] = useState({
    ...defaultForm,
    disposition: sampleId ? ["sample_drop"] : ["delivery"],
    amount: orderAmount ? String(orderAmount) : "",
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      ...(repProp?._id && { assignedTo: repProp._id }),
      ...(sampleId && { disposition: ["sample_drop"] }),
      ...(orderAmount && { amount: String(orderAmount) }),
    }));
  }, [repProp, sampleId, orderAmount]);

  const handleChange = (key: string, value: string | Date) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleDispositionToggle = (value: string) => {
    setFormData((prev) => {
      const updated = prev.disposition.includes(value)
        ? prev.disposition.filter((d) => d !== value)
        : [...prev.disposition, value];
      return { ...prev, disposition: updated };
    });
  };

  const handleSubmit = async () => {
    if (!store?._id) return toast.error("Store not found");
    if (!formData.assignedTo) return toast.error("Please fill all required fields");

    try {
      const d = new Date(formData.scheduledAt);
      const utcMidnight = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

      await createDelivery({
        storeId: store._id,
        assignedTo: formData.assignedTo,
        disposition: formData.disposition,
        paymentAction: formData.paymentAction,
        amount: Number(formData.amount) || 0,
        moneyPickupAmount: Number(formData.moneyPickupAmount) || 0,
        scheduledAt: utcMidnight.toISOString(),
        notes: formData.notes,
        ...(sampleId && { sampleId }),
        ...(orderId && { orderId }),
        ...((clientOrderId || privateLabelOrderId) && {
          clientOrderId: clientOrderId || privateLabelOrderId,
        }),
      }).unwrap();

      toast.success("✅ Delivery created successfully");
      setFormData({ ...defaultForm });
      onSuccess?.();
      onClose();
    } catch {
      toast.error("Failed to create delivery");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] bg-background border-border rounded-xs flex flex-col">
        <DialogHeader className="border-b border-border pb-3 shrink-0">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <Truck className="h-5 w-5 text-primary" />
            Create Delivery
          </DialogTitle>
        </DialogHeader>

        {store && <DeliveryStoreInfo store={store} />}

        <div className="space-y-3 overflow-y-auto scrollbar-hidden p-0.5 flex-1 min-h-0">
          <DeliveryRepField
            repProp={repProp}
            assignedTo={formData.assignedTo}
            reps={reps}
            repsLoading={repsLoading}
            onChange={(val) => handleChange("assignedTo", val)}
          />

          <DeliveryDispositionField
            disposition={formData.disposition}
            onToggle={handleDispositionToggle}
          />

          <DeliveryAmountFields
            showDelivery={formData.disposition.includes("delivery")}
            showMoneyPickup={formData.disposition.includes("money_pickup")}
            amount={formData.amount}
            moneyPickupAmount={formData.moneyPickupAmount}
            onChange={handleChange}
          />

          {/* Payment Action */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Payment Action</Label>
            <Select value={formData.paymentAction} onValueChange={(val) => handleChange("paymentAction", val)}>
              <SelectTrigger className="w-full border-border rounded-xs bg-input text-foreground focus:ring-0 focus:border-primary">
                <SelectValue placeholder="Select Action" />
              </SelectTrigger>
              <SelectContent className="rounded-xs">
                <SelectItem value="collect_payment" className="rounded-xs">Collect Payment</SelectItem>
                <SelectItem value="no_payment" className="rounded-xs">No Payment</SelectItem>
                <SelectItem value="may_not_collect" className="rounded-xs">May Not Collect</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DeliveryScheduleField
            scheduledAt={formData.scheduledAt}
            onChange={(date) => handleChange("scheduledAt", date)}
          />

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Notes</Label>
            <Textarea
              placeholder="Add any notes or special instructions..."
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="border border-border rounded-xs bg-input text-foreground resize-none focus-visible:outline-none focus-visible:ring-0 focus-visible:border-primary min-h-20"
              rows={3}
            />
          </div>
        </div>

        <div className="border-t border-border pt-3 shrink-0">
          <Button
            onClick={handleSubmit}
            disabled={creating}
            className="w-full rounded-xs bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
          >
            {creating ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</>
            ) : (
              "CREATE DELIVERY"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
