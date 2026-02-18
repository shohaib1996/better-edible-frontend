"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ILabel } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  LABEL_STAGES,
  STAGE_LABELS,
  STAGE_COLORS,
} from "@/constants/privateLabel";
import type { LabelStage } from "@/constants/privateLabel";
import {
  useUpdateLabelStageMutation,
  useDeleteLabelMutation,
} from "@/redux/api/PrivateLabel/labelApi";
import {
  Loader2,
  ImageIcon,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  History,
  Beaker,
  Palette,
  Droplets,
  FileText,
  Pill,
} from "lucide-react";
import { ImagePreviewModal } from "@/components/Orders/OrderPage/ImagePreviewModal";
import { EditLabelModal } from "./EditLabelModal";
import { StageHistoryModal } from "./StageHistoryModal";

// Helper to get user info from localStorage
const getUserFromStorage = (): {
  userId: string;
  userType: "admin" | "rep";
} | null => {
  if (typeof window === "undefined") return null;
  try {
    const storedUser = localStorage.getItem("better-user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      const userType =
        user.role === "superadmin" || user.role === "manager" ? "admin" : "rep";
      return { userId: user.id, userType };
    }
  } catch {
    console.error("Failed to parse user from localStorage");
  }
  return null;
};

interface LabelCardProps {
  label: ILabel;
  onUpdate: () => void;
}

export const LabelCard = ({ label, onUpdate }: LabelCardProps) => {
  const [updateLabelStage, { isLoading: updatingStage }] =
    useUpdateLabelStageMutation();
  const [deleteLabel, { isLoading: deleting }] = useDeleteLabelMutation();

  const [selectedStage, setSelectedStage] = useState<string>(
    label.currentStage,
  );
  const [previewImage, setPreviewImage] = useState<{
    url: string;
    filename: string;
  } | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const stageColor =
    STAGE_COLORS[label.currentStage as LabelStage] || "bg-gray-500";
  const stageLabel =
    STAGE_LABELS[label.currentStage as LabelStage] || label.currentStage;

  const hasDetails =
    label.cannabinoidMix ||
    label.color ||
    (label.flavorComponents && label.flavorComponents.length > 0) ||
    (label.colorComponents && label.colorComponents.length > 0) ||
    label.specialInstructions;

  const handleStageChange = async (newStage: string) => {
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
      console.error("Error updating label stage:", error);
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to update label stage");
      setSelectedStage(label.currentStage);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteLabel(label._id).unwrap();
      toast.success("Label deleted successfully");
      onUpdate();
    } catch (error: unknown) {
      console.error("Error deleting label:", error);
      const err = error as { data?: { message?: string } };
      toast.error(err.data?.message || "Failed to delete label");
    }
  };

  const ActionsMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-xs h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="rounded-xs border-border dark:border-white/20"
      >
        <DropdownMenuItem
          onClick={() => setShowEdit(true)}
          className="rounded-xs cursor-pointer"
        >
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setShowHistory(true)}
          className="rounded-xs cursor-pointer"
        >
          <History className="mr-2 h-4 w-4" />
          View History
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setShowDeleteDialog(true)}
          className="text-red-600 rounded-xs cursor-pointer focus:bg-red-50 dark:focus:bg-red-950/30"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <Card className="rounded-xs py-0 gap-0 border-border dark:border-white/20 overflow-hidden">
        {/* Top row: Image + Info + Stage + Actions */}
        <div className="flex items-start gap-4 p-4">
          {/* Label Image */}
          <div
            className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] shrink-0 overflow-hidden rounded-lg bg-muted cursor-pointer group border border-border dark:border-white/20"
            onClick={() => {
              if (label.labelImages && label.labelImages.length > 0) {
                const img = label.labelImages[0];
                setPreviewImage({
                  url: img.secureUrl || img.url,
                  filename: img.originalFilename || `${label.flavorName}-label`,
                });
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
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="h-5 w-5 text-white" />
                </div>
                {label.labelImages.length > 1 && (
                  <div className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium">
                    +{label.labelImages.length - 1}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-7 w-7 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-semibold truncate text-base leading-tight">
                  {label.flavorName}
                </h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {label.productType}
                </p>
              </div>
              {/* Mobile actions */}
              <div className="sm:hidden shrink-0">
                <ActionsMenu />
              </div>
            </div>
            <Badge
              className={`${stageColor} mt-1.5 rounded-xs text-[11px] px-2 py-0.5`}
            >
              {stageLabel}
            </Badge>
          </div>

          {/* Desktop: Stage + Actions */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <div className="w-48">
              <Select
                value={selectedStage}
                onValueChange={handleStageChange}
                disabled={updatingStage}
              >
                <SelectTrigger className="w-full rounded-xs border-border dark:border-white/20 h-9 text-sm">
                  {updatingStage ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Updating...</span>
                    </div>
                  ) : (
                    <SelectValue />
                  )}
                </SelectTrigger>
                <SelectContent className="rounded-xs border-border dark:border-white/20">
                  {LABEL_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {STAGE_LABELS[stage]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ActionsMenu />
          </div>
        </div>

        {/* Details section */}
        {hasDetails && (
          <div className="px-4 pb-4 pt-0">
            <div className="border-t border-border dark:border-white/10 pt-3">
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {label.cannabinoidMix && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Pill className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    <span className="font-medium text-foreground">
                      {label.cannabinoidMix}
                    </span>
                  </div>
                )}
                {label.color && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Palette className="h-3.5 w-3.5 shrink-0 text-pink-500" />
                    <span className="font-medium text-foreground">
                      {label.color}
                    </span>
                  </div>
                )}
                {label.flavorComponents &&
                  label.flavorComponents.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Droplets className="h-3.5 w-3.5 shrink-0 text-orange-500" />
                      <div className="flex items-center gap-1 flex-wrap">
                        {label.flavorComponents.map((c, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center bg-orange-500/10 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded text-[11px] font-medium"
                          >
                            {c.name} {c.percentage}%
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                {label.colorComponents && label.colorComponents.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Beaker className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                    <div className="flex items-center gap-1 flex-wrap">
                      {label.colorComponents.map((c, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center bg-violet-500/10 text-violet-700 dark:text-violet-400 px-1.5 py-0.5 rounded text-[11px] font-medium"
                        >
                          {c.name} {c.percentage}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {label.specialInstructions && (
                <div className="flex items-start gap-1.5 mt-2 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-500" />
                  <p className="line-clamp-2 leading-relaxed">
                    {label.specialInstructions}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile: Stage selector */}
        <div className="sm:hidden px-4 pb-4">
          <div className="text-xs text-muted-foreground mb-1.5">
            Update Stage:
          </div>
          <Select
            value={selectedStage}
            onValueChange={handleStageChange}
            disabled={updatingStage}
          >
            <SelectTrigger className="w-full rounded-xs border-border dark:border-white/20 h-9 text-sm">
              {updatingStage ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Updating...</span>
                </div>
              ) : (
                <SelectValue />
              )}
            </SelectTrigger>
            <SelectContent className="rounded-xs border-border dark:border-white/20">
              {LABEL_STAGES.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        image={previewImage}
        onClose={() => setPreviewImage(null)}
      />

      {/* Edit Modal */}
      {showEdit && (
        <EditLabelModal
          open={showEdit}
          label={label}
          onClose={() => setShowEdit(false)}
          onSuccess={onUpdate}
        />
      )}

      {/* History Modal */}
      {showHistory && (
        <StageHistoryModal
          open={showHistory}
          label={label}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-xs border-border dark:border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Label</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the label &ldquo;
              {label.flavorName}
              &rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xs border-border dark:border-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 text-white rounded-xs"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
