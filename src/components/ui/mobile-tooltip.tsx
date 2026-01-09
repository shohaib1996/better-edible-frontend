"use client";

import * as React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MobileTooltipProps {
  children: React.ReactNode;
  content: string;
  side?: "top" | "right" | "bottom" | "left";
  delayDuration?: number;
}

/**
 * Enhanced tooltip component that works on both desktop (hover) and mobile (long-press)
 * - Desktop: Shows on hover
 * - Mobile: Shows on long-press (touch and hold for 500ms)
 */
export function MobileTooltip({
  children,
  content,
  side = "top",
  delayDuration = 0,
}: MobileTooltipProps) {
  const [open, setOpen] = React.useState(false);
  const [isTouch, setIsTouch] = React.useState(false);
  const touchTimerRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  // Detect if device supports touch
  React.useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  const handleTouchStart = () => {
    if (!isTouch) return;

    // Long-press detection: show tooltip after 500ms
    touchTimerRef.current = setTimeout(() => {
      setOpen(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (!isTouch) return;

    // Clear timer if user lifts finger before 500ms
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }

    // Keep tooltip visible for 2 seconds after showing
    if (open) {
      setTimeout(() => setOpen(false), 2000);
    }
  };

  const handleTouchMove = () => {
    // Cancel tooltip if user moves finger (not a long-press)
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
      }
    };
  }, []);

  return (
    <Tooltip open={open} onOpenChange={setOpen} delayDuration={delayDuration}>
      <TooltipTrigger
        asChild
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} className="rounded-xs">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
