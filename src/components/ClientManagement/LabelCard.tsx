"use client";

import { ILabel } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { STAGE_LABELS, STAGE_COLORS } from "@/constants/privateLabel";
import type { LabelStage } from "@/constants/privateLabel";

interface LabelCardProps {
  label: ILabel;
  onUpdate: () => void;
}

export const LabelCard = ({ label, onUpdate }: LabelCardProps) => {
  const stageColor =
    STAGE_COLORS[label.currentStage as LabelStage] || "bg-gray-500";
  const stageLabel =
    STAGE_LABELS[label.currentStage as LabelStage] || label.currentStage;

  return (
    <Card className="p-4">
      <div className="space-y-2">
        {/* Label Image Preview */}
        {label.labelImages && label.labelImages.length > 0 && (
          <div className="aspect-square w-full max-w-[150px] mx-auto overflow-hidden rounded-md bg-muted">
            <img
              src={label.labelImages[0].secureUrl || label.labelImages[0].url}
              alt={label.flavorName}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Label Info */}
        <div className="text-center">
          <h4 className="font-semibold">{label.flavorName}</h4>
          <p className="text-sm text-muted-foreground">{label.productType}</p>
        </div>

        {/* Stage Badge */}
        <div className="flex justify-center">
          <Badge className={`${stageColor} text-white`}>{stageLabel}</Badge>
        </div>
      </div>
    </Card>
  );
};
