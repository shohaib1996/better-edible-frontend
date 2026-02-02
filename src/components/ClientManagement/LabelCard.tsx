"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ILabel } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LABEL_STAGES,
  STAGE_LABELS,
  STAGE_COLORS,
} from "@/constants/privateLabel";
import type { LabelStage } from "@/constants/privateLabel";
import { useUpdateLabelStageMutation } from "@/redux/api/PrivateLabel/labelApi";
import { Loader2, ImageIcon, Eye } from "lucide-react";
import { ImagePreviewModal } from "@/components/Orders/OrderPage/ImagePreviewModal";

interface LabelCardProps {
  label: ILabel;
  onUpdate: () => void;
}

export const LabelCard = ({ label, onUpdate }: LabelCardProps) => {
  const [updateLabelStage, { isLoading }] = useUpdateLabelStageMutation();
  const [selectedStage, setSelectedStage] = useState<string>(
    label.currentStage,
  );
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    filename: string;
  } | null>(null);

  const stageColor =
    STAGE_COLORS[label.currentStage as LabelStage] || "bg-gray-500";
  const stageLabel =
    STAGE_LABELS[label.currentStage as LabelStage] || label.currentStage;

  const handleStageChange = async (newStage: string) => {
    if (newStage === label.currentStage) return;

    try {
      await updateLabelStage({
        id: label._id,
        stage: newStage as LabelStage,
      }).unwrap();

      setSelectedStage(newStage);
      toast.success(`Label updated to ${STAGE_LABELS[newStage as LabelStage]}`);
      onUpdate();
    } catch (error: unknown) {
      console.error("Error updating label stage:", error);
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to update label stage");
      setSelectedStage(label.currentStage);
    }
  };

  const handleImageClick = (imageUrl: string, filename: string) => {
    setPreviewImage({ url: imageUrl, filename });
  };

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center gap-4">
          {/* Label Image Preview */}
          <div
            className="relative w-20 h-20 shrink-0 overflow-hidden rounded-md bg-muted cursor-pointer group"
            onClick={() => {
              if (label.labelImages && label.labelImages.length > 0) {
                const img = label.labelImages[0];
                handleImageClick(
                  img.secureUrl || img.url,
                  img.originalFilename || label.flavorName,
                );
              }
            }}
          >
            {label.labelImages && label.labelImages.length > 0 ? (
              <>
                <img
                  src={
                    label.labelImages[0].secureUrl || label.labelImages[0].url
                  }
                  alt={label.flavorName}
                  className="w-full h-full object-cover"
                />
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="h-6 w-6 text-white" />
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Label Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate">{label.flavorName}</h4>
            <p className="text-sm text-muted-foreground">{label.productType}</p>
            <Badge className={`${stageColor} text-white mt-1`}>
              {stageLabel}
            </Badge>
          </div>

          {/* Stage Update Dropdown */}
          <div className="shrink-0 w-48">
            <label className="text-xs text-muted-foreground block mb-1">
              Update Stage:
            </label>
            <Select
              value={selectedStage}
              onValueChange={handleStageChange}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Updating...</span>
                  </div>
                ) : (
                  <SelectValue />
                )}
              </SelectTrigger>
              <SelectContent>
                {LABEL_STAGES.map((stage) => (
                  <SelectItem key={stage} value={stage}>
                    {STAGE_LABELS[stage]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </>
  );
};
