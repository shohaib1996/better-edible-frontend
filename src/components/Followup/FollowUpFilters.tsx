"use client";

import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { RepSelect } from "@/components/Shared/RepSelect";
import type { IRep } from "@/types";

interface Props {
  selectedDate: Date;
  setSelectedDate: (d: Date) => void;
  showAll: boolean;
  setShowAll: (v: boolean) => void;
  search: string;
  setSearch: (s: string) => void;
  selectedRepId: string | undefined;
  setSelectedRepId: (id: string | undefined) => void;
  setSelectedRep: (rep: IRep | undefined) => void;
  repsData: { data?: IRep[] } | undefined;
  onPageReset: () => void;
}

export function FollowUpFilters({
  selectedDate,
  setSelectedDate,
  showAll,
  setShowAll,
  search,
  setSearch,
  selectedRepId,
  setSelectedRepId,
  setSelectedRep,
  repsData,
  onPageReset,
}: Props) {
  const goPrev = () => { setSelectedDate(addDays(selectedDate, -1)); if (!showAll) onPageReset(); };
  const goNext = () => { setSelectedDate(addDays(selectedDate, 1)); if (!showAll) onPageReset(); };

  return (
    <Card className="p-4 rounded-xs border border-border bg-card dark:bg-card max-w-full">
      <div className="flex flex-col md:flex-row gap-3 w-full">

        {/* Date Navigation */}
        <div className="flex items-center gap-1 min-w-0 w-full md:w-auto md:flex-[1.5]">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-10 h-10 shrink-0 rounded-xs border-border hover:bg-accent hover:text-white dark:border-gray-600 dark:hover:bg-accent bg-transparent"
                  onClick={goPrev}
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Previous Day</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Popover modal>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="lg"
                className={cn(
                  "flex-1 justify-between bg-primary text-white rounded-xs border-border dark:border-gray-600 min-w-[160px] text-sm",
                  !selectedDate && "text-muted-foreground",
                  showAll && "opacity-50",
                )}
                disabled={showAll}
              >
                <span className="truncate">
                  {selectedDate ? format(selectedDate, "MMM dd, yyyy") : "Pick date"}
                </span>
                <CalendarIcon className="w-4 h-4 opacity-70 shrink-0 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 rounded-xs w-auto" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => {
                  if (d) { setSelectedDate(d); if (!showAll) onPageReset(); }
                }}
                autoFocus
                className="scale-110"
              />
            </PopoverContent>
          </Popover>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-10 h-10 shrink-0 rounded-xs border-border hover:bg-accent hover:text-white dark:border-gray-600 dark:hover:bg-accent bg-transparent"
                  onClick={goNext}
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Next Day</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Rep Select */}
        <div className="min-w-0 w-full md:w-auto md:flex-1">
          <RepSelect
            className="border border-border w-full h-10!"
            value={selectedRepId}
            showAllOption={true}
            onChange={(val) => {
              if (val === "all") {
                setSelectedRepId(undefined);
                setSelectedRep(undefined);
              } else {
                setSelectedRepId(val);
                const selected = repsData?.data?.find((r) => r._id === val);
                setSelectedRep(selected);
              }
              onPageReset();
            }}
          />
        </div>

        {/* Search */}
        <div className="min-w-0 w-full md:flex-[1.5]">
          <Input
            placeholder="Search stores..."
            className="w-full h-10 rounded-xs border-2 border-primary/50 focus:border-primary dark:border-primary/40 dark:bg-background"
            value={search}
            onChange={(e) => { setSearch(e.target.value); onPageReset(); }}
          />
        </div>

        {/* View All */}
        <div className="flex items-center gap-2 justify-start md:justify-center min-w-0 w-full md:w-auto">
          <Checkbox
            id="viewAll"
            checked={showAll}
            className="rounded-xs border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            onCheckedChange={(v) => {
              setShowAll(Boolean(v));
              if (Boolean(v)) {
                setSearch("");
                setSelectedRep(undefined);
                setSelectedRepId(undefined);
              }
              onPageReset();
            }}
          />
          <label
            htmlFor="viewAll"
            className="text-sm font-medium text-foreground cursor-pointer whitespace-nowrap"
          >
            View All
          </label>
        </div>

      </div>
    </Card>
  );
}
