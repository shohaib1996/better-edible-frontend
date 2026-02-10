"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Loader2,
  Truck,
  MapPin,
  User,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";
import { useGetAllRepsQuery } from "@/redux/api/Rep/repApi";
import { useCreateDeliveryMutation } from "@/redux/api/Deliveries/deliveryApi";
import { toast } from "sonner";
import { IRep } from "@/types";

interface DeliveryModalProps {
  open: boolean;
  onClose: () => void;
  store: {
    _id: string;
    name: string;
    address?: string;
  } | null;
  rep?: Partial<IRep> | null;
  sampleId?: string | null;
  orderId?: string | null;
  privateLabelOrderId?: string | null;
  orderAmount?: number | null;
  onSuccess?: () => void;
}

export const DeliveryModal = ({
  open,
  onClose,
  store,
  rep: repProp,
  sampleId,
  orderId,
  privateLabelOrderId,
  orderAmount,
  onSuccess,
}: DeliveryModalProps) => {
  const { data: repsData, isLoading: repsLoading } = useGetAllRepsQuery({});
  const reps = repsData?.data || [];

  const [createDelivery, { isLoading: creating }] = useCreateDeliveryMutation();

  const [formData, setFormData] = useState({
    assignedTo: "",
    disposition: sampleId ? "sample_drop" : "delivery",
    paymentAction: "",
    amount: orderAmount ? String(orderAmount) : "",
    scheduledAt: new Date(),
    notes: "",
  });

  useEffect(() => {
    if (repProp) {
      setFormData((prev) => ({
        ...prev,
        assignedTo: repProp._id ?? "",
      }));
    }
    if (sampleId) {
      setFormData((prev) => ({
        ...prev,
        disposition: "sample_drop",
      }));
    }
    if (orderAmount) {
      setFormData((prev) => ({
        ...prev,
        amount: String(orderAmount),
      }));
    }
  }, [repProp, sampleId, orderAmount]);

  const handleChange = (key: string, value: string | Date) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!store?._id) return toast.error("Store not found");
    if (!formData.assignedTo)
      return toast.error("Please fill all required fields");

    try {
      await createDelivery({
        storeId: store._id,
        assignedTo: formData.assignedTo,
        disposition: formData.disposition,
        paymentAction: formData.paymentAction,
        amount: Number(formData.amount) || 0,
        scheduledAt: formData.scheduledAt,
        notes: formData.notes,
        ...(sampleId && { sampleId }),
        ...(orderId && { orderId }),
        ...(privateLabelOrderId && { privateLabelOrderId }),
      }).unwrap();

      toast.success("✅ Delivery created successfully");
      setFormData({
        assignedTo: "",
        disposition: "delivery",
        paymentAction: "",
        amount: "",
        scheduledAt: new Date(),
        notes: "",
      });
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error(error);
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

        {/* Store Info */}
        {store && (
          <div className="bg-linear-to-r from-primary/10 to-secondary/10 border border-primary/30 rounded-xs p-3 shadow-sm shrink-0">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <h2 className="text-base font-bold text-foreground">
                  {store.name}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {store.address || "Address not available"}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 overflow-y-auto scrollbar-hidden p-0.5 flex-1 min-h-0">
          {/* Delivery Rep */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              Delivery Rep
            </Label>
            {repProp ? (
              <div className="p-2 border border-border rounded-xs bg-muted/30">
                <p className="font-semibold text-sm text-foreground">
                  {repProp.name}
                </p>
              </div>
            ) : (
              <Select
                value={formData.assignedTo}
                onValueChange={(val) => handleChange("assignedTo", val)}
              >
                <SelectTrigger className="w-full border-border rounded-xs bg-input text-foreground focus:ring-0 focus:border-primary">
                  <SelectValue placeholder="Select Rep" />
                </SelectTrigger>
                <SelectContent className="rounded-xs">
                  {repsLoading ? (
                    <div className="p-2 text-muted-foreground text-center text-xs">
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                    </div>
                  ) : (
                    reps.map((rep: any) => (
                      <SelectItem
                        key={rep._id}
                        value={rep._id}
                        className="rounded-xs"
                      >
                        {rep.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Disposition */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-primary" />
              Disposition
            </Label>
            <Select
              value={formData.disposition}
              onValueChange={(val) => handleChange("disposition", val)}
            >
              <SelectTrigger className="w-full border-border rounded-xs bg-input text-foreground focus:ring-0 focus:border-primary">
                <SelectValue placeholder="Select Disposition" />
              </SelectTrigger>
              <SelectContent className="rounded-xs">
                <SelectItem value="delivery" className="rounded-xs">
                  Delivery
                </SelectItem>
                <SelectItem value="sample_drop" className="rounded-xs">
                  Sample Drop
                </SelectItem>
                <SelectItem value="money_pickup" className="rounded-xs">
                  Money Pickup
                </SelectItem>
                <SelectItem value="other" className="rounded-xs">
                  Other
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              Amount ($)
            </Label>
            <Input
              type="number"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              className="border border-border rounded-xs bg-input text-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-primary"
            />
          </div>

          {/* Payment Action */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Payment Action
            </Label>
            <Select
              value={formData.paymentAction}
              onValueChange={(val) => handleChange("paymentAction", val)}
            >
              <SelectTrigger className="w-full border-border rounded-xs bg-input text-foreground focus:ring-0 focus:border-primary">
                <SelectValue placeholder="Select Action" />
              </SelectTrigger>
              <SelectContent className="rounded-xs">
                <SelectItem value="collect_payment" className="rounded-xs">
                  Collect Payment
                </SelectItem>
                <SelectItem value="no_payment" className="rounded-xs">
                  No Payment
                </SelectItem>
                <SelectItem value="may_not_collect" className="rounded-xs">
                  May Not Collect
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <CalendarIcon className="h-3.5 w-3.5 text-primary" />
              Scheduled Date
            </Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal border-border rounded-xs bg-input text-foreground hover:bg-muted/50 hover:text-foreground focus:ring-0 focus:border-primary",
                      !formData.scheduledAt && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.scheduledAt
                      ? format(formData.scheduledAt, "PPP")
                      : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xs">
                  <Calendar
                    mode="single"
                    selected={formData.scheduledAt}
                    onSelect={(date) => handleChange("scheduledAt", date!)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Button
                type="button"
                variant="outline"
                className="rounded-xs bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold whitespace-nowrap px-3 dark:bg-primary dark:text-white"
                onClick={() =>
                  handleChange("scheduledAt", addDays(new Date(), 1))
                }
              >
                Tomorrow
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">
              Notes
            </Label>
            <Textarea
              placeholder="Add any notes or special instructions..."
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="border border-border rounded-xs bg-input text-foreground resize-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-primary min-h-[80px]"
              rows={3}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="border-t border-border pt-3 shrink-0">
          <Button
            onClick={handleSubmit}
            disabled={creating}
            className="w-full rounded-xs bg-primary text-primary-foreground hover:bg-primary/90 font-bold"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...
              </>
            ) : (
              "CREATE DELIVERY"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
