"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { IRep } from "@/types";

interface AssignStoresModalProps {
  open: boolean;
  onClose: () => void;
  onAssign: (repId: string) => void;
  allReps: IRep[];
  repsLoading: boolean;
  assigning: boolean;
}

export const AssignStoresModal = ({
  open,
  onClose,
  onAssign,
  allReps,
  repsLoading,
  assigning,
}: AssignStoresModalProps) => {
  const [selectedRep, setSelectedRep] = useState<string>("");

  const handleAssign = () => {
    if (selectedRep) {
      onAssign(selectedRep);
      setSelectedRep("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-xs">
        <DialogHeader>
          <DialogTitle>Select a Rep to Assign Stores</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-hidden mt-4">
          {repsLoading ? (
            <Loader2 className="animate-spin mx-auto h-6 w-6 text-muted-foreground" />
          ) : (
            allReps.map((rep) => (
              <label
                key={rep._id}
                className="flex items-center space-x-3 border rounded-xs p-2 hover:bg-muted cursor-pointer"
              >
                <input
                  type="radio"
                  name="repSelect"
                  checked={selectedRep === rep._id}
                  onChange={() => setSelectedRep(rep._id)}
                />
                <span className="text-sm font-medium">{rep.name}</span>
              </label>
            ))
          )}
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xs cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={assigning || !selectedRep}
            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xs cursor-pointer"
          >
            {assigning ? (
              <Loader2 className="animate-spin h-4 w-4 mr-1" />
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
