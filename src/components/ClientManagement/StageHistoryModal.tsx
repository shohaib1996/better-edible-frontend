"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ILabel, IStageHistoryEntry } from "@/types";
import {
  STAGE_LABELS,
  STAGE_COLORS,
  LabelStage,
} from "@/constants/privateLabel";

interface StageHistoryModalProps {
  open: boolean;
  label: ILabel;
  onClose: () => void;
}

export const StageHistoryModal = ({
  open,
  label,
  onClose,
}: StageHistoryModalProps) => {
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
    }
  };

  // Reverse the history to show newest first
  const reversedHistory = [...label.stageHistory].reverse();

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stage History - {label.flavorName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Stage */}
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">Current Stage</p>
            <div className="flex items-center gap-2 mt-1">
              <div
                className={`h-3 w-3 rounded-full ${
                  STAGE_COLORS[label.currentStage as LabelStage] ||
                  "bg-gray-500"
                }`}
              />
              <span className="font-medium">
                {STAGE_LABELS[label.currentStage as LabelStage] ||
                  label.currentStage}
              </span>
            </div>
          </div>

          {/* History Timeline */}
          {reversedHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No history available yet.
            </p>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />

              {/* History entries */}
              <div className="space-y-4">
                {reversedHistory.map(
                  (entry: IStageHistoryEntry, index: number) => (
                    <div key={index} className="flex gap-4 relative">
                      {/* Dot */}
                      <div
                        className={`w-6 h-6 rounded-full shrink-0 ${
                          STAGE_COLORS[entry.stage as LabelStage] ||
                          "bg-gray-500"
                        } border-2 border-background z-10 flex items-center justify-center`}
                      >
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-4">
                        <p className="font-medium">
                          {STAGE_LABELS[entry.stage as LabelStage] ||
                            entry.stage}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(entry.changedAt).toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Changed by:{" "}
                          {entry.changedBy?.name
                            ? `${entry.changedBy.name}${entry.changedBy.email ? ` (${entry.changedBy.email})` : ""}`
                            : "Unknown"}
                        </p>
                        {entry.notes && (
                          <p className="text-sm mt-2 p-2 bg-muted rounded-md italic">
                            &ldquo;{entry.notes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Label Info */}
          <div className="border-t pt-4 mt-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Product Type:</span>
                <p className="font-medium">{label.productType}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span>
                <p className="font-medium">
                  {new Date(label.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
