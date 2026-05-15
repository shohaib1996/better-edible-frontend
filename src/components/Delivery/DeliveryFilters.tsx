"use client";

import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RepSelect } from "@/components/Shared/RepSelect";

export const DISPOSITION_OPTIONS = [
  { value: "all", label: "All" },
  { value: "delivery", label: "Delivery" },
  { value: "sample_drop", label: "Sample Drop" },
  { value: "money_pickup", label: "Money Pickup" },
  { value: "sales_call", label: "Sales Call" },
  { value: "other", label: "Other" },
];

export interface DeliveryFiltersProps {
  storeName: string;
  status: string;
  selectedRep: string;
  dispositionFilter: string;
  date: Date | undefined;
  showReset: boolean;
  onStoreNameChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onRepChange: (v: string) => void;
  onDispositionChange: (v: string) => void;
  onDateChange: (d: Date | undefined) => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  onReset: () => void;
}

export function DeliveryFilters({
  storeName,
  status,
  selectedRep,
  dispositionFilter,
  date,
  showReset,
  onStoreNameChange,
  onStatusChange,
  onRepChange,
  onDispositionChange,
  onDateChange,
  onPrevDay,
  onNextDay,
  onReset,
}: DeliveryFiltersProps) {
  return (
    <div className="space-y-3">
      <Card className="p-4 rounded-xs border border-border bg-card dark:bg-card max-w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 w-full">
          {/* Date navigation */}
          <div className="flex items-center gap-1 min-w-0">
            <Button
              variant="outline"
              size="icon"
              onClick={onPrevDay}
              className="h-9 w-9 shrink-0 rounded-xs bg-accent text-white hover:bg-primary"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal rounded-xs h-9 min-w-0 dark:hover:bg-secondary border dark:border-border",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                  <span className="truncate">
                    {date ? format(date, "MMM dd, yyyy") : "Pick a date"}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xs" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) =>
                    onDateChange(d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : undefined)
                  }
                  className="rounded-xs"
                />
              </PopoverContent>
            </Popover>

            <Button
              variant="outline"
              size="icon"
              onClick={onNextDay}
              className="h-9 w-9 shrink-0 rounded-xs bg-accent text-white hover:bg-primary"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Rep select */}
          <div className="min-w-0">
            <RepSelect
              value={selectedRep}
              onChange={onRepChange}
              showAllOption
              className="rounded-xs h-9 border border-border w-full"
            />
          </div>

          {/* Status select */}
          <div className="min-w-0">
            <Select value={status} onValueChange={onStatusChange}>
              <SelectTrigger className="rounded-xs h-9 border border-border w-full">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="rounded-xs">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="completed">Delivered</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Store search */}
          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by store name..."
              value={storeName}
              onChange={(e) => onStoreNameChange(e.target.value)}
              className="pl-9 rounded-xs h-9 w-full"
            />
          </div>

          {showReset && (
            <Button
              variant="outline"
              onClick={onReset}
              className="rounded-xs h-9 gap-1 md:col-span-4"
            >
              <X className="h-4 w-4" />
              Reset
            </Button>
          )}
        </div>
      </Card>

      {/* Disposition pills */}
      <div className="flex flex-wrap gap-2">
        {DISPOSITION_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onDispositionChange(opt.value)}
            className={cn(
              "px-3 py-1.5 rounded-xs text-sm font-medium border transition-colors",
              dispositionFilter === opt.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:bg-muted"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
