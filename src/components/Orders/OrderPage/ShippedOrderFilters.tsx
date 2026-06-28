"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ShippedOrderFiltersProps {
  viewMode: "both" | "orders" | "samples";
  onViewModeChange: (v: "both" | "orders" | "samples") => void;
  startDate: Date | undefined;
  onStartDateChange: (d: Date | undefined) => void;
  endDate: Date | undefined;
  onEndDateChange: (d: Date | undefined) => void;
  onFilter: () => void;
  onClear: () => void;
}

export function ShippedOrderFilters({
  viewMode,
  onViewModeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onFilter,
  onClear,
}: ShippedOrderFiltersProps) {
  return (
    <div className="grid grid-cols-2 md:flex md:justify-end items-center gap-2 my-4">
      <Select
        value={viewMode}
        onValueChange={(v) => onViewModeChange(v as "both" | "orders" | "samples")}
      >
        <SelectTrigger className="w-44 rounded-xs border border-border col-span-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xs">
          <SelectItem value="both" className="rounded-xs">Orders &amp; Samples</SelectItem>
          <SelectItem value="orders" className="rounded-xs">Orders</SelectItem>
          <SelectItem value="samples" className="rounded-xs">Samples</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full md:w-[200px] justify-start text-left font-normal rounded-xs dark:hover:bg-secondary dark:hover:text-white",
              !startDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            {startDate ? format(startDate, "PPP") : <span>Start date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-xs">
          <Calendar mode="single" selected={startDate} onSelect={onStartDateChange} autoFocus />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full md:w-[200px] justify-start text-left font-normal rounded-xs dark:hover:bg-secondary dark:hover:text-white",
              !endDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
            {endDate ? format(endDate, "PPP") : <span>End date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-xs">
          <Calendar mode="single" selected={endDate} onSelect={onEndDateChange} autoFocus />
        </PopoverContent>
      </Popover>

      <Button onClick={onFilter} className="w-full md:w-auto rounded-xs bg-primary hover:bg-primary/90">
        Filter
      </Button>
      <Button onClick={onClear} className="w-full bg-accent hover:bg-red-500/90 md:w-auto rounded-xs">
        Clear
      </Button>
    </div>
  );
}
