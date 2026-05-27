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

interface Props {
  target: { id: string; name: string } | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function ResetPasswordDialog({ target, onConfirm, onClose }: Props) {
  return (
    <AlertDialog open={!!target} onOpenChange={(o) => { if (!o) onClose(); }}>
      <AlertDialogContent className="rounded-xs bg-card text-card-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle>Reset password for {target?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This will clear their current password. They will need to log in using their store&apos;s ZIP code as the new password.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="rounded-xs">Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="rounded-xs bg-amber-600 text-white hover:bg-amber-700"
            onClick={onConfirm}
          >
            Reset Password
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
