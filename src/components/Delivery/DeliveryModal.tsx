"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { Calendar } from "@/src/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/src/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import { format } from "date-fns";
import { useGetAllRepsQuery } from "@/src/redux/api/Rep/repApi";
import { useCreateDeliveryMutation } from "@/src/redux/api/Deliveries/deliveryApi";
import { toast } from "sonner";

interface DeliveryModalProps {
  open: boolean;
  onClose: () => void;
  store: {
    _id: string;
    name: string;
    address?: string;
  } | null;
}

export const DeliveryModal = ({ open, onClose, store }: DeliveryModalProps) => {
  const { data: repsData, isLoading: repsLoading } = useGetAllRepsQuery({});
  const reps = repsData?.data || [];

  const [createDelivery, { isLoading: creating }] = useCreateDeliveryMutation();

  const [formData, setFormData] = useState({
    assignedTo: "",
    disposition: "delivery",
    paymentAction: "",
    amount: "",
    scheduledAt: new Date(),
    notes: "",
  });

  const handleChange = (key: string, value: string | Date) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!store?._id) return toast.error("Store not found");
    if (!formData.assignedTo || !formData.paymentAction)
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
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Failed to create delivery");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            🚚 Create Delivery
          </DialogTitle>
        </DialogHeader>

        {/* 🏪 Store Info */}
        {store && (
          <div className="bg-gray-50 border rounded-md p-3 mb-4">
            <h2 className="text-base font-semibold text-gray-800">
              {store.name}
            </h2>
            <p className="text-sm text-gray-600">
              {store.address || "Address not available"}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {/* Delivery Rep */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Delivery Rep
            </label>
            <Select
              value={formData.assignedTo}
              onValueChange={(val) => handleChange("assignedTo", val)}
            >
              <SelectTrigger className="w-full border border-gray-300">
                <SelectValue placeholder="Select Rep" />
              </SelectTrigger>
              <SelectContent>
                {repsLoading ? (
                  <div className="p-2 text-gray-500 text-center">Loading...</div>
                ) : (
                  reps.map((rep: any) => (
                    <SelectItem key={rep._id} value={rep._id}>
                      {rep.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Disposition */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Disposition
            </label>
            <Select
              value={formData.disposition}
              onValueChange={(val) => handleChange("disposition", val)}
            >
              <SelectTrigger className="w-full border border-gray-300">
                <SelectValue placeholder="Select Disposition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="sample_drop">Sample Drop</SelectItem>
                <SelectItem value="money_pickup">Money Pickup</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Amount ($)</label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={formData.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              className="border border-gray-300"
            />
          </div>

          {/* Payment Action */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">
              Payment Action
            </label>
            <Select
              value={formData.paymentAction}
              onValueChange={(val) => handleChange("paymentAction", val)}
            >
              <SelectTrigger className="w-full border border-gray-300">
                <SelectValue placeholder="Select Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="collect_payment">Collect Payment</SelectItem>
                <SelectItem value="no_payment">No Payment</SelectItem>
                <SelectItem value="may_not_collect">May Not Collect</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Picker */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border border-gray-300",
                    !formData.scheduledAt && "text-gray-400"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.scheduledAt
                    ? format(formData.scheduledAt, "PPP")
                    : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.scheduledAt}
                  onSelect={(date) => handleChange("scheduledAt", date!)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Note</label>
            <Textarea
              placeholder="Add any note..."
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              className="border border-gray-300"
            />
          </div>

          {/* Submit */}
          <div className="pt-3">
            <Button
              onClick={handleSubmit}
              disabled={creating}
              className="w-full flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                </>
              ) : (
                "SUBMIT"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
