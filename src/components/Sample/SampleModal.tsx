"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCreateSampleMutation } from "@/redux/api/Samples/samplesApi";

interface SampleModalProps {
  open: boolean;
  onClose: () => void;
  storeId: string;
  storeName: string;
  storeAddress: string;
  repId: string;
  repName: string;
}

export const SampleModal = ({
  open,
  onClose,
  storeId,
  storeName,
  storeAddress,
  repId,
  repName,
}: SampleModalProps) => {
  const [createSample, { isLoading }] = useCreateSampleMutation();

  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!description.trim())
      return toast.error("Please enter sample description.");

    try {
      const payload: any = {
        storeId,
        repId,
        status: "submitted",
        description,
      };

      // Attach createdBy info from logged-in user
      try {
        const storedUser = localStorage.getItem("better-user");
        if (storedUser) {
          const user = JSON.parse(storedUser);
          const uType =
            user.role === "superadmin" || user.role === "manager"
              ? "admin"
              : "rep";
          payload.userId = user.id;
          payload.userType = uType;
        }
      } catch {
        // ignore parse errors
      }

      await createSample(payload).unwrap();
      toast.success("Sample record created successfully!");
      setDescription("");
      onClose();
    } catch (err: any) {
      console.error("Error creating sample:", err);
      toast.error(err?.data?.message || "Failed to create sample record");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-xs">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-foreground">
            Create Sample Record
          </DialogTitle>
        </DialogHeader>

        {/* 🏪 Store Info */}
        <div className="bg-secondary/30 dark:bg-secondary/10 border border-border rounded-xs p-3 mb-4">
          <h2 className="text-base font-semibold text-foreground">{storeName}</h2>
          <p className="text-sm text-muted-foreground">{storeAddress}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Assigned Rep: <span className="font-medium text-primary">{repName}</span>
          </p>
        </div>

        {/* 👤 Rep Selection - Removed as per user request */}

        {/* 🧾 Sample Description */}
        <div className="space-y-2 py-3">
          <Label htmlFor="description" className="text-foreground font-medium">
            Sample Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter sample details (e.g., Cannacrispy, Bliss Cannabis Syrup, Fifty One Fifty, etc.)"
            className="border border-accent focus:border-primary focus:ring-2 focus:ring-primary/20 min-h-[150px] rounded-xs"
          />
        </div>

        {/* Footer Buttons */}
        <DialogFooter className="pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xs"
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
