"use client";

import { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/src/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/src/components/ui/select";

import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCreateFollowupMutation } from "@/src/redux/api/Followups/followupsApi";

interface FollowUpModalProps {
  open: boolean;
  onClose: () => void;
  storeId: string;
  repId: string;
}

const INTEREST_OPTIONS = [
  "Basic Interest Level",
  "Expressed some interest in ordering",
  "Expressed high interest in ordering",
  "Hasn't expressed interest after multiple attempts",
  "Active Customer",
];

export const FollowUpModal = ({
  open,
  onClose,
  storeId,
  repId,
}: FollowUpModalProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [interestLevel, setInterestLevel] = useState("");
  const [comments, setComments] = useState("");

  const [createFollowup, { isLoading }] = useCreateFollowupMutation();

  const resetForm = () => {
    setDate(undefined);
    setInterestLevel("");
    setComments("");
  };

  const handleSubmit = async () => {
    if (!date) return toast.error("Please select a follow-up date.");

    try {
      await createFollowup({
        followupDate: date,
        interestLevel,
        comments,
        store: storeId,
        rep: repId,
      }).unwrap();

      toast.success("Follow-up created!");
      resetForm();
      onClose();
    } catch {
      toast.error("Failed to create follow-up");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Follow-Up</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-3">
          {/* Date Picker */}
          <div className="flex flex-col space-y-2">
            <Label>Follow-Up Date</Label>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={`justify-start text-left font-normal ${
                    !date ? "text-muted-foreground" : ""
                  }`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>

              <PopoverContent className="p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Interest Level Dropdown */}
          <div className="flex flex-col space-y-2">
            <Label>Interest Level</Label>
            <Select value={interestLevel} onValueChange={setInterestLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Select interest level" />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {INTEREST_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Comments */}
          <div className="flex flex-col space-y-2">
            <Label>Comments</Label>
            <Textarea
              placeholder="Write additional notes..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Follow-Up
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
