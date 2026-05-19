"use client";

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
import { IDigitalAsset } from "@/types/digitalAssets/digitalAssets";

interface AssetArchiveDialogProps {
  target: IDigitalAsset | null;
  isLoading: boolean;
  onConfirm: (asset: IDigitalAsset) => void;
  onClose: () => void;
}

export function AssetArchiveDialog({ target, isLoading, onConfirm, onClose }: AssetArchiveDialogProps) {
  return (
    <AlertDialog open={!!target} onOpenChange={(o) => { if (!o) onClose(); }}>
      <AlertDialogContent className="rounded-xs bg-card text-card-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle>Archive this asset?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">&ldquo;{target?.title}&rdquo;</span> will no longer be visible to store users. You can restore it at any time.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xs">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => target && onConfirm(target)}
            disabled={isLoading}
          >
            {isLoading ? "Archiving…" : "Archive"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface AssetDeleteDialogProps {
  target: IDigitalAsset | null;
  isLoading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function AssetDeleteDialog({ target, isLoading, onConfirm, onClose }: AssetDeleteDialogProps) {
  return (
    <AlertDialog open={!!target} onOpenChange={(o) => { if (!o) onClose(); }}>
      <AlertDialogContent className="rounded-xs bg-card text-card-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this asset?</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-medium text-foreground">&ldquo;{target?.title}&rdquo;</span> will be permanently removed. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xs">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
