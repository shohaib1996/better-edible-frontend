"use client";

import { format, differenceInCalendarDays } from "date-fns";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Column } from "@/components/ReUsableComponents/DataTable";
import type { IFollowUp } from "@/types";
import { toLocalDate } from "@/lib/followupUtils";

export function useFollowUpColumns(onEdit: (f: IFollowUp) => void): Column<IFollowUp>[] {
  return [
    {
      key: "store",
      header: "Store",
      className: "min-w-[200px]",
      render: (f) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{f.store?.name}</span>
          <span className="text-xs text-muted-foreground">{f.store?.address}</span>
        </div>
      ),
    },
    {
      key: "rep",
      header: "Rep",
      render: (f) => (
        <span className="text-primary font-medium">{f.rep?.name}</span>
      ),
    },
    {
      key: "followupDate",
      header: "Follow-up Date",
      render: (f) => {
        const dateStr = (f as any).followupDate as string | undefined;
        const local = toLocalDate(dateStr);
        return (
          <span className="text-foreground">
            {dateStr && local ? format(local, "MMM dd, yyyy") : "No date"}
          </span>
        );
      },
    },
    {
      key: "delay",
      header: "Delay",
      render: (f) => {
        const dateStr = (f as any).followupDate as string | undefined;
        const local = toLocalDate(dateStr);
        const delay = local ? Math.max(0, differenceInCalendarDays(new Date(), local)) : 0;
        return delay > 0 ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-xs bg-accent/20 text-accent font-medium text-sm">
            {delay} day{delay > 1 ? "s" : ""}
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
            On time
          </span>
        );
      },
    },
    {
      key: "comments",
      header: "Note",
      className: "min-w-[200px]",
      render: (f) => (
        <>
          <div className="hidden md:block">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="max-w-[200px] truncate cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                    {f.comments || "-"}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="rounded-xs max-w-xs">
                  <p className="wrap-break-word">{f.comments || "No comments"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="md:hidden">
            <p className="text-sm text-muted-foreground wrap-break-word whitespace-normal max-w-[250px]">
              {f.comments || "-"}
            </p>
          </div>
        </>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (f) => (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 rounded-xs bg-secondary text-white border-secondary hover:bg-primary hover:border-primary dark:bg-secondary dark:border-secondary dark:hover:bg-primary"
                onClick={() => onEdit(f)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="rounded-xs">Edit Follow-up</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
  ];
}
