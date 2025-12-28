"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrivateLabelForm } from "./PrivateLabelForm";
import { useCreatePrivateLabelOrderMutation } from "@/redux/api/orders/orders";
import { toast } from "sonner";

interface PrivateLabelModalProps {
  open: boolean;
  onClose: () => void;
  repId?: string; // Optional - can be auto-filled from store
  onSuccess?: () => void;
}

export const PrivateLabelModal: React.FC<PrivateLabelModalProps> = ({
  open,
  onClose,
  repId,
  onSuccess,
}) => {
  const [createPrivateLabelOrder, { isLoading }] =
    useCreatePrivateLabelOrderMutation();

  const handleSubmit = async (formData: FormData) => {
    try {
      await createPrivateLabelOrder(formData).unwrap();
      toast.success("Private label order created successfully!");
      onClose();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error creating private label order:", error);
      toast.error(error?.data?.message || "Failed to create private label order");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Private Label Order</DialogTitle>
        </DialogHeader>

        <PrivateLabelForm
          repId={repId}
          onSubmit={handleSubmit}
          isSubmitting={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};
