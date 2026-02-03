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
}

export const AddClientModal = ({
  open,
  onClose,
  onSuccess,
}: AddClientModalProps) => {
  const [storeId, setStoreId] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [repId, setRepId] = useState("");
  const [recurringEnabled, setRecurringEnabled] = useState(false);
  const [interval, setInterval] = useState<
    "monthly" | "bimonthly" | "quarterly"
  >("monthly");

  const { data: repsData } = useGetAllRepsQuery({});
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
    if (!repId) {
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
        assignedRepId: repId,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Store Selection */}
          <div>
            <Label htmlFor="store">Store *</Label>
            <StoreSelect value={storeId} onChange={setStoreId} />
          </div>

          {/* Contact Email */}
          <div>
            <Label htmlFor="email">Contact Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="contact@store.com"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>

          {/* Assigned Rep */}
          <div>
            <Label htmlFor="rep">Assigned Rep *</Label>
            <Select value={repId} onValueChange={setRepId}>
              <SelectTrigger id="rep">
                <SelectValue placeholder="Select a rep" />
              </SelectTrigger>
              <SelectContent>
                {reps.map((rep: { _id: string; name: string }) => (
                  <SelectItem key={rep._id} value={rep._id}>
                    {rep.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recurring Schedule Section */}
          <div className="space-y-2 p-4 border rounded-md">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurringSchedule"
                checked={recurringEnabled}
                onCheckedChange={(checked) => setRecurringEnabled(!!checked)}
              />
              <Label htmlFor="recurringSchedule" className="cursor-pointer">
                Enable Recurring Schedule
              </Label>
            </div>

            {recurringEnabled && (
              <div>
                <Label htmlFor="interval">Interval</Label>
                <Select
                  value={interval}
                  onValueChange={(val: "monthly" | "bimonthly" | "quarterly") =>
                    setInterval(val)
                  }
                >
                  <SelectTrigger id="interval">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Once per month</SelectItem>
                    <SelectItem value="bimonthly">Every 2 months</SelectItem>
                    <SelectItem value="quarterly">Every 3 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Client
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
