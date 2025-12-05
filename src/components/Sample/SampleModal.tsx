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

  const [formData, setFormData] = useState({
    cannacrispy: "",
    "bliss cannabis syrup": "",
    "fifty one fifty": "",
  });

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    // check if at least one field has input
    const hasAnyValue = Object.values(formData).some((v) => v.trim() !== "");
    if (!hasAnyValue)
      return toast.error("Please fill at least one sample field.");

    try {
      const payload = {
        storeId,
        repId,
        status: "submitted",
        samples: formData,
      };

      await createSample(payload).unwrap();
      toast.success("Sample record created successfully!");
      setFormData({
        cannacrispy: "",
        "bliss cannabis syrup": "",
        "fifty one fifty": "",
      });
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

        {/* 🧾 Sample Text Areas */}
        <div className="space-y-4 py-3">
          {Object.entries(formData).map(([key, val]) => (
            <div key={key} className="space-y-1">
              <Label htmlFor={key} className="capitalize text-gray-700">
                {key}
              </Label>
              <Textarea
                id={key}
                value={val}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={`Enter details for ${key}`}
                className="border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          ))}
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
