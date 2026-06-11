"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ILabel } from "@/types";
import { STAGE_LABELS, STAGE_COLORS } from "@/constants/privateLabel";
import type { LabelStage } from "@/constants/privateLabel";
import {
  useUpdateLabelStageMutation,
  useDeleteLabelMutation,
} from "@/redux/api/PrivateLabel/labelApi";
import { getUserFromStorage } from "@/lib/getUserFromStorage";

export function useLabelCard({ label, onUpdate }: { label: ILabel; onUpdate: () => void }) {
  const [updateLabelStage, { isLoading: updatingStage }] = useUpdateLabelStageMutation();
  const [deleteLabel, { isLoading: deleting }] = useDeleteLabelMutation();

  const [selectedStage, setSelectedStage] = useState<string>(label.currentStage);
  const [previewImage, setPreviewImage] = useState<{ url: string; filename: string } | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const stageColor = STAGE_COLORS[label.currentStage as LabelStage] || "bg-gray-500";
  const stageLabel = STAGE_LABELS[label.currentStage as LabelStage] || label.currentStage;

  const hasDetails =
    label.cannabinoidMix ||
    label.color ||
    (label.flavorComponents && label.flavorComponents.length > 0) ||
    (label.colorComponents && label.colorComponents.length > 0) ||
    label.specialInstructions ||
    label.size ||
    label.oilType ||
    label.effect ||
    (label.cannabinoids && label.cannabinoids.length > 0) ||
    label.unitsOrdered ||
    label.unitCost ||
    label.totalCost;

  async function handleStageChange(newStage: string) {
    if (newStage === label.currentStage) return;
    const userInfo = getUserFromStorage();
    try {
      await updateLabelStage({
        id: label._id,
        stage: newStage as LabelStage,
        userId: userInfo?.userId,
        userType: userInfo?.userType,
      }).unwrap();
      setSelectedStage(newStage);
      toast.success(`Label updated to ${STAGE_LABELS[newStage as LabelStage]}`);
      onUpdate();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to update label stage");
      setSelectedStage(label.currentStage);
    }
  }

  async function handleDelete() {
    try {
      await deleteLabel(label._id).unwrap();
      toast.success("Label deleted successfully");
      onUpdate();
    } catch (error: unknown) {
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to delete label");
    }
  }

  return {
    selectedStage,
    previewImage, setPreviewImage,
    showEdit, setShowEdit,
    showHistory, setShowHistory,
    showDeleteDialog, setShowDeleteDialog,
    stageColor, stageLabel,
    hasDetails,
    updatingStage,
    deleting,
    handleStageChange,
    handleDelete,
  };
}
