"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ILabel } from "@/types";
import { useBulkUpdateLabelStagesMutation } from "@/redux/api/PrivateLabel/labelApi";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowRight } from "lucide-react";
import {
  LABEL_STAGES,
  STAGE_LABELS,
  LabelStage,
} from "@/constants/privateLabel";

// Helper to get user info from localStorage
const getUserFromStorage = (): { userId: string; userType: "admin" | "rep" } | null => {
  if (typeof window === "undefined") return null;
  try {
    const storedUser = localStorage.getItem("better-user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      const userType = user.role === "superadmin" || user.role === "manager" ? "admin" : "rep";
      return { userId: user.id, userType };
    }
  } catch {
    console.error("Failed to parse user from localStorage");
  }
  return null;
};

interface BulkStageUpdateSectionProps {
  clientId: string;
  labels: ILabel[];
  onUpdate: () => void;
}

export const BulkStageUpdateSection = ({
  clientId,
  labels,
  onUpdate,
}: BulkStageUpdateSectionProps) => {
  const [selectedStage, setSelectedStage] = useState<LabelStage | "">("");
  const [bulkUpdateStages, { isLoading }] = useBulkUpdateLabelStagesMutation();

  // Get current stage (all labels should be at the same stage since they're a group)
  const currentStage = labels.length > 0 ? labels[0].currentStage : null;

  // Get available next stages (only allow forward progression)
  const currentStageIndex = currentStage
    ? LABEL_STAGES.indexOf(currentStage as LabelStage)
    : -1;
  const availableStages = LABEL_STAGES.slice(currentStageIndex + 1);

  const handleBulkUpdate = async () => {
    if (!selectedStage) {
      toast.error("Please select a stage");
      return;
    }

    const userInfo = getUserFromStorage();

    try {
      const result = await bulkUpdateStages({
        clientId,
        stage: selectedStage,
        userId: userInfo?.userId,
        userType: userInfo?.userType,
      }).unwrap();

      toast.success(`${result.updatedCount} labels updated to ${STAGE_LABELS[selectedStage]}`);
      setSelectedStage("");
      onUpdate();
    } catch (error: unknown) {
      console.error("Error updating stages:", error);
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to update stages");
    }
  };

  if (!currentStage || currentStage === "ready_for_production") {
    return null;
  }

  return (
    <Card className="p-4 bg-muted/50">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <Label className="text-sm font-medium">
            Bulk Update All Labels ({labels.length})
          </Label>
          <p className="text-xs text-muted-foreground mb-2">
            Current Stage: {STAGE_LABELS[currentStage as LabelStage]}
          </p>
          <Select
            value={selectedStage}
            onValueChange={(val) => setSelectedStage(val as LabelStage)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select next stage" />
            </SelectTrigger>
            <SelectContent>
              {availableStages.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleBulkUpdate}
          disabled={isLoading || !selectedStage}
          className="whitespace-nowrap"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="mr-2 h-4 w-4" />
          )}
          Update All Labels
        </Button>
      </div>
    </Card>
  );
};
