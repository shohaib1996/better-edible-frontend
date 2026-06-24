"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreatePrivateLabelClientMutation } from "@/redux/api/PrivateLabel/privateLabelClientApi";
import { useGetAllRepsQuery } from "@/redux/api/Rep/repApi";
import { StoreSelect } from "@/components/Shared/StoreSelect";
import { Loader2 } from "lucide-react";

interface AddClientModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isRepView?: boolean;
  currentRepId?: string;
}

export const AddClientModal = ({
  open,
  onClose,
  onSuccess,
  isRepView = false,
  currentRepId,
}: AddClientModalProps) => {
  const [storeId, setStoreId] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [repId, setRepId] = useState(
    isRepView && currentRepId ? currentRepId : "",
  );
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [interval, setInterval] = useState<
    "monthly" | "bimonthly" | "quarterly"
  >("monthly");

  const { data: repsData } = useGetAllRepsQuery({}, { skip: isRepView });
  const [createClient, { isLoading }] = useCreatePrivateLabelClientMutation();

  const reps = repsData?.data || [];

  const handleSubmit = async () => {
    // Validation
    if (!storeId) {
      toast.error("Please select a store");
      return;
    }
    if (!contactEmail) {
      toast.error("Please enter a contact email");
      return;
    }

    const assignedRepId = isRepView ? currentRepId : repId;
    if (!assignedRepId) {
      toast.error("Please select a rep");
      return;
    }

    try {
      const payload: {
        storeId: string;
        contactEmail: string;
        assignedRepId: string;
        recurringSchedule?: {
          enabled: boolean;
          interval: "monthly" | "bimonthly" | "quarterly";
        };
      } = {
        storeId,
        contactEmail,
        assignedRepId: assignedRepId!,
      };

      if (recurringEnabled) {
        payload.recurringSchedule = {
          enabled: true,
          interval,
        };
      }

      await createClient(payload).unwrap();
      toast.success("Client created successfully!");
      onSuccess();
      onClose();
      resetForm();
    } catch (error: unknown) {
      console.error("Error creating client:", error);
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to create client");
    }
  };

  const resetForm = () => {
    setStoreId("");
    setContactEmail("");
    setRepId("");
    setRecurringEnabled(false);
    setInterval("monthly");
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hidden rounded-xs">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            Add New Client
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Store Selection */}
          <div className="space-y-1.5">
            <Label htmlFor="store" className="text-sm font-medium">
              Store *
            </Label>
            <StoreSelect value={storeId} onChange={setStoreId} />
          </div>

          {/* Contact Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">
              Contact Email *
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="contact@store.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="rounded-xs"
            />
          </div>

          {/* Assigned Rep - Only show for admin, auto-assign for rep */}
          {!isRepView && (
            <div className="space-y-1.5">
              <Label htmlFor="rep" className="text-sm font-medium">
                Assigned Rep *
              </Label>
              <Select value={repId} onValueChange={setRepId}>
                <SelectTrigger id="rep" className="w-full rounded-xs">
                  <SelectValue placeholder="Select a rep" />
                </SelectTrigger>
                <SelectContent className="rounded-xs scrollbar-hidden">
                  {reps.map((rep: { _id: string; name: string }) => (
                    <SelectItem key={rep._id} value={rep._id}>
                      {rep.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Recurring Schedule Section */}
          <div className="space-y-3 p-4 border border-border bg-muted/30 rounded-xs">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurringSchedule"
                checked={recurringEnabled}
                onCheckedChange={(checked) => setRecurringEnabled(!!checked)}
                className="rounded-xs border-2 border-primary/50 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
              />
              <Label
                htmlFor="recurringSchedule"
                className="cursor-pointer text-sm font-medium text-foreground"
              >
                Enable Recurring Schedule
              </Label>
            </div>

            {recurringEnabled && (
              <div className="space-y-1.5">
                <Label htmlFor="interval" className="text-sm font-medium">
                  Interval
                </Label>
                <Select
                  value={interval}
                  onValueChange={(val: "monthly" | "bimonthly" | "quarterly") =>
                    setInterval(val)
                  }
                >
                  <SelectTrigger id="interval" className="w-full rounded-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xs">
                    <SelectItem value="monthly">Once per month</SelectItem>
                    <SelectItem value="bimonthly">Every 2 months</SelectItem>
                    <SelectItem value="quarterly">Every 3 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="rounded-xs"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Client
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
