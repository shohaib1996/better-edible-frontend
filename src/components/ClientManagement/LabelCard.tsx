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

  return (
    <>
      <Card className="p-4 rounded-xs border-border dark:border-white/20">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Top section on mobile: Image + Name + Actions */}
          <div className="flex items-start gap-4 flex-1 w-full">
            {/* Label Image Preview */}
            <div
              className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 overflow-hidden rounded-xs bg-muted cursor-pointer group border border-border dark:border-white/20"
              onClick={() => {
                if (label.labelImages && label.labelImages.length > 0) {
                  const img = label.labelImages[0];
                  setPreviewImage({
                    url: img.secureUrl || img.url,
                    filename:
                      img.originalFilename || `${label.flavorName}-label`,
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
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                  {/* Image count badge */}
                  {label.labelImages.length > 1 && (
                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                      +{label.labelImages.length - 1}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Label Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold truncate text-base sm:text-lg">
                {label.flavorName}
              </h4>
              <p className="text-sm text-muted-foreground">
                {label.productType}
              </p>
              <Badge className={`${stageColor} mt-1 rounded-xs`}>
                {stageLabel}
              </Badge>
            </div>

            {/* Actions Menu (Desktop hidden, Mobile visible) - Actually, let's keep it consistent.
                We'll just put the actions menu here or at the end.
                Original structure was single row.
                New structure:
                Mobile:
                [Image] [Title/Badge] [Menu]
                [Dropdown]

                Desktop:
                [Image] [Title/Badge] [Dropdown] [Menu]
            */}
            {/* Mobile Actions Menu (Hidden on SM) */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-xs h-8 w-8 p-0"
                  >
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
            </div>
          </div>

          {/* Bottom section on mobile: Stage Update */}
          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <div className="flex-1 sm:w-48">
              <div className="sm:hidden text-xs text-muted-foreground mb-1">
                Update Stage:
              </div>
              <Select
                value={selectedStage}
                onValueChange={handleStageChange}
                disabled={updatingStage}
              >
                <SelectTrigger className="w-full rounded-xs border-border dark:border-white/20">
                  {updatingStage ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
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

            {/* Desktop Actions Menu (Hidden on Mobile) */}
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="rounded-xs">
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
            </div>
          </div>
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
