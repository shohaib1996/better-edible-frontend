"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  useCreateFollowupMutation,
  useUpdateFollowupMutation,
} from "@/redux/api/Followups/followupsApi";
import { IFollowUp } from "@/types";
import { RepSelect } from "@/components/Shared/RepSelect";
import { useUser } from "@/redux/hooks/useAuth";

interface ManageFollowUpModalProps {
  open: boolean;
  onClose: () => void;
  followup?: IFollowUp | null; // If present, we are editing
  storeId?: string; // Required for creating
  repId?: string; // Required for creating (used by reps, optional for admins)
  showRepSelect?: boolean; // If true, show rep assignment dropdown (admin mode)
}

const INTEREST_OPTIONS = [
  "Basic Interest Level",
  "Expressed some interest in ordering",
  "Expressed high interest in ordering",
  "Hasn't expressed interest after multiple attempts",
  "Active Customer",
];

export const ManageFollowUpModal = ({
  open,
  onClose,
  followup,
  storeId,
  repId,
  showRepSelect = false,
}: ManageFollowUpModalProps) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [interestLevel, setInterestLevel] = useState("");
  const [comments, setComments] = useState("");
  const [selectedRepId, setSelectedRepId] = useState<string>("");

  const user = useUser();

  const [createFollowup, { isLoading: isCreating }] =
    useCreateFollowupMutation();
  const [updateFollowup, { isLoading: isUpdating }] =
    useUpdateFollowupMutation();

  const isLoading = isCreating || isUpdating;
  const isEditing = !!followup;

  useEffect(() => {
    if (followup) {
      setDate(
        followup.followupDate ? new Date(followup.followupDate) : undefined
      );
      setInterestLevel(followup.interestLevel || "");
      setComments(followup.comments || "");
      // Set selected rep if editing and showRepSelect is true
      if (showRepSelect && followup.rep?._id) {
        setSelectedRepId(followup.rep._id);
      }
    } else {
      // Reset form when opening in create mode
      if (open) {
        setDate(undefined);
        setInterestLevel("");
        setComments("");
        setSelectedRepId("");
      }
    }
  }, [followup, open, showRepSelect]);

  const handleSubmit = async () => {
    if (!date) return toast.error("Please select a follow-up date.");

    // Validate rep selection when showRepSelect is true
    if (showRepSelect && !selectedRepId && !isEditing) {
      return toast.error("Please select a rep to assign this follow-up.");
    }

    try {
      const formattedDate = format(date, "yyyy-MM-dd");

      if (isEditing && followup) {
        const updateData: any = {
          followupDate: formattedDate,
          interestLevel,
          comments,
        };
        // If admin is editing and changes rep assignment
        if (showRepSelect && selectedRepId) {
          updateData.rep = selectedRepId;
        }
        await updateFollowup({
          id: followup._id,
          data: updateData,
        }).unwrap();
        toast.success("Follow-up updated!");
      } else {
        if (!storeId) {
          return toast.error("Missing store information.");
        }
        // Determine which rep ID to use
        const finalRepId = showRepSelect ? selectedRepId : repId;
        if (!finalRepId) {
          return toast.error("Missing rep information.");
        }
        await createFollowup({
          followupDate: formattedDate,
          interestLevel,
          comments,
          store: storeId,
          rep: finalRepId,
        }).unwrap();
        toast.success("Follow-up created!");
      }
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(
        isEditing ? "Failed to update follow-up" : "Failed to create follow-up"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-background border-border rounded-xs p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/20">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {isEditing ? "Edit Follow-Up" : "Create Follow-Up"}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-5">
          {/* Date Picker */}
          <div className="flex flex-col space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Follow-Up Date
            </Label>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-border rounded-xs bg-input text-foreground hover:bg-muted/50 hover:text-foreground",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>

              <PopoverContent className="p-0 rounded-xs border-border">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="rounded-xs bg-background"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Interest Level Dropdown */}
          <div className="flex flex-col space-y-2">
            <Label className="text-sm font-medium text-foreground">
              Interest Level
            </Label>
            <Select value={interestLevel} onValueChange={setInterestLevel}>
              <SelectTrigger className="w-full border-border rounded-xs bg-input text-foreground focus:ring-primary">
                <SelectValue placeholder="Select interest level" />
              </SelectTrigger>
              <SelectContent
                position="popper"
                align="start"
                className="rounded-xs border-border"
              >
                {INTEREST_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt}
                    value={opt}
                    className="rounded-xs focus:bg-accent focus:text-accent-foreground"
                  >
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assign To (Admin Only) */}
          {showRepSelect && (
            <div className="flex flex-col space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Assign To <span className="text-destructive">*</span>
              </Label>
              <RepSelect value={selectedRepId} onChange={setSelectedRepId} />
            </div>
          )}

          {/* Comments */}
          <div className="flex flex-col space-y-2">
            <Label className="text-sm font-medium text-foreground">Note</Label>
            <Textarea
              placeholder="Write additional notes..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="min-h-[100px] border-border rounded-xs bg-input text-foreground resize-none focus-visible:ring-primary"
            />
          </div>
        </div>

        <DialogFooter className="px-6 py-4 bg-muted/20 border-t border-border gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-xs border-border hover:bg-muted/50"
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="rounded-xs bg-primary text-primary-foreground hover:bg-primary/90 ml-2 shadow-sm"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? "Save Changes" : "Save Follow-Up"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
