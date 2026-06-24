"use client";

import { ILabel } from "@/types";
import { GummyVisual } from "@/components/PrivateLabel/GummyVisual";
import { hexToHueRotation } from "@/lib/useGummyBuilder";
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
import { LABEL_STAGES, STAGE_LABELS } from "@/constants/privateLabel";
import { Loader2, MoreVertical, Pencil, Trash2, History } from "lucide-react";
import { ImagePreviewModal } from "@/components/Orders/OrderPage/ImagePreviewModal";
import { EditLabelModal } from "./EditLabelModal";
import { StageHistoryModal } from "./StageHistoryModal";
import { LabelCardImage } from "./LabelCardImage";
import { LabelCardDetails } from "./LabelCardDetails";
import { useLabelCard } from "@/lib/useLabelCard";

interface LabelCardProps {
  label: ILabel;
  onUpdate: () => void;
}

export const LabelCard = ({ label, onUpdate }: LabelCardProps) => {
  const gummyHue = label.gummyColorHex ? hexToHueRotation(label.gummyColorHex) : 0;

  const {
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
  } = useLabelCard({ label, onUpdate });

  const StageSelect = ({ className }: { className?: string }) => (
    <Select value={selectedStage} onValueChange={handleStageChange} disabled={updatingStage}>
      <SelectTrigger className={`rounded-xs border-border dark:border-white/20 h-9 text-sm ${className ?? ""}`}>
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
  );

  const ActionsMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-xs h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xs border-border dark:border-white/20">
        <DropdownMenuItem onClick={() => setShowEdit(true)} className="rounded-xs cursor-pointer">
          <Pencil className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setShowHistory(true)} className="rounded-xs cursor-pointer">
          <History className="mr-2 h-4 w-4" /> View History
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setShowDeleteDialog(true)}
          className="text-red-600 rounded-xs cursor-pointer focus:bg-red-50 dark:focus:bg-red-950/30"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <Card className="rounded-xs py-0 gap-0 border-border dark:border-white/20 overflow-hidden">
        {/* Top row: Image + Info + Stage + Actions */}
        <div className="flex items-start gap-4 p-4">
          <LabelCardImage label={label} onPreview={setPreviewImage} />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-semibold truncate text-base leading-tight">{label.flavorName}</h4>
                <p className="text-sm text-muted-foreground mt-0.5">{label.productType}</p>
              </div>
              <div className="sm:hidden shrink-0">
                <ActionsMenu />
              </div>
            </div>
            <Badge className={`${stageColor} mt-1.5 rounded-xs text-[11px] px-2 py-0.5`}>
              {stageLabel}
            </Badge>

            {/* Gummy color info */}
            {label.gummyColorHex && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <span
                  className="w-3 h-3 rounded-full border border-border shrink-0"
                  style={{ backgroundColor: label.gummyColorHex }}
                />
                <span className="font-mono text-[10px] bg-muted border border-border rounded-xs px-1.5 py-0.5">
                  {label.gummyColorHex.toUpperCase()}
                </span>
                {label.gummyColorName && (
                  <span className="text-[11px] text-muted-foreground">{label.gummyColorName}</span>
                )}
              </div>
            )}

            {/* Selected flavor badges */}
            {(label.selectedFlavors ?? []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {(label.selectedFlavors ?? []).map((f) => (
                  <Badge
                    key={f}
                    className="rounded-xs text-[10px] px-1.5 py-0 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10"
                  >
                    {f}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Gummy visual (desktop) */}
          {label.gummyColorHex && (
            <div className="hidden sm:flex flex-col items-center gap-1 shrink-0">
              <GummyVisual size={label.size ?? "standard"} hue={gummyHue} compact />
              <span
                className="w-3 h-3 rounded-full border border-border"
                style={{ backgroundColor: label.gummyColorHex }}
                title={label.gummyColorName ?? label.gummyColorHex}
              />
            </div>
          )}

          {/* Desktop: Stage + Actions */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <div className="w-48">
              <StageSelect />
            </div>
            <ActionsMenu />
          </div>
        </div>

        {/* Missing AI recipe data warning */}
        {(!label.gummyColorHex || !(label.selectedFlavors ?? []).length) && (
          <div className="mx-4 mb-3 flex items-center justify-between gap-2 rounded-xs bg-amber-400/10 border border-amber-400/30 px-3 py-2">
            <span className="text-xs text-amber-800 dark:text-amber-400">
              AI recipe data missing — flavor and/or color not set
            </span>
            <button
              type="button"
              onClick={() => setShowEdit(true)}
              className="shrink-0 text-xs font-semibold text-amber-800 dark:text-amber-400 underline underline-offset-2 hover:opacity-70"
            >
              Fix Now
            </button>
          </div>
        )}

        {/* Details */}
        {hasDetails && <LabelCardDetails label={label} />}

        {/* Mobile: Stage selector */}
        <div className="sm:hidden px-4 pb-4">
          <div className="text-xs text-muted-foreground mb-1.5">Update Stage:</div>
          <StageSelect className="w-full" />
        </div>
      </Card>

      <ImagePreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />

      {showEdit && (
        <EditLabelModal
          open={showEdit}
          label={label}
          onClose={() => setShowEdit(false)}
          onSuccess={onUpdate}
        />
      )}

      {showHistory && (
        <StageHistoryModal
          open={showHistory}
          label={label}
          onClose={() => setShowHistory(false)}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-xs border-border dark:border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Label</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the label &ldquo;{label.flavorName}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xs border-border dark:border-white/20">Cancel</AlertDialogCancel>
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
