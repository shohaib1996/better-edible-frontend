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
import { useCreateSampleMutation } from "@/redux/api/Samples/samplesApi ";

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
      const payload = {
        storeId,
        repId,
        status: "submitted",
        description,
      };

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
      <DialogContent className="sm:max-w-md rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-gray-800">
            Create Sample Record
          </DialogTitle>
        </DialogHeader>

        {/* 🏪 Store Info */}
        <div className="bg-gray-50 border rounded-md p-3 mb-4">
          <h2 className="text-base font-semibold text-gray-800">{storeName}</h2>
          <p className="text-sm text-gray-600">{storeAddress}</p>
          <p className="text-xs text-gray-500 mt-1">
            Assigned Rep: <span className="font-medium">{repName}</span>
          </p>
        </div>

        {/* 👤 Rep Selection - Removed as per user request */}

        {/* 🧾 Sample Description */}
        <div className="space-y-2 py-3">
          <Label htmlFor="description" className="text-gray-700 font-medium">
            Sample Description
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter sample details (e.g., Cannacrispy, Bliss Cannabis Syrup, Fifty One Fifty, etc.)"
            className="border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 min-h-[150px]"
          />
        </div>

        {/* Footer Buttons */}
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
