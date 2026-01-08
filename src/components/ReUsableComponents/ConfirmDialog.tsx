"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  triggerText?: string;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "outline";
  onConfirm: () => void;
  disabled?: boolean;
}

export function ConfirmDialog({
  triggerText,
  trigger,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Yes, Confirm",
  cancelText = "Cancel",
  variant = "destructive",
  onConfirm,
  disabled,
}: ConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            className="cursor-pointer rounded-xs"
            variant={variant}
            size="sm"
            disabled={disabled}
          >
            {triggerText}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-xs">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-secondary text-white hover:bg-secondary/90 dark:bg-secondary dark:text-white dark:hover:bg-secondary/80 cursor-pointer rounded-xs border-none">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            className={
              variant === "destructive"
                ? "bg-destructive text-white hover:bg-destructive/90 cursor-pointer rounded-xs"
                : "bg-primary text-white hover:bg-primary/90 cursor-pointer rounded-xs"
            }
            onClick={onConfirm}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
