"use client";

import { CalendarIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format, addDays } from "date-fns";

interface Props {
  scheduledAt: Date;
  onChange: (date: Date) => void;
}

export function DeliveryScheduleField({ scheduledAt, onChange }: Props) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <CalendarIcon className="h-3.5 w-3.5 text-primary" />
        Scheduled Date
      </Label>
      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "flex-1 justify-start text-left font-normal border-border rounded-xs bg-input text-foreground hover:bg-muted/50 hover:text-foreground focus:ring-0 focus:border-primary",
                !scheduledAt && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {scheduledAt ? format(scheduledAt, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-xs">
            <Calendar
              mode="single"
              selected={scheduledAt}
              onSelect={(date) => onChange(date!)}
              autoFocus
            />
          </PopoverContent>
        </Popover>
        <Button
          type="button"
          variant="outline"
          className="rounded-xs bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold whitespace-nowrap px-3 dark:bg-primary dark:text-white"
          onClick={() => onChange(addDays(new Date(), 1))}
        >
          Tomorrow
        </Button>
      </div>
    </div>
  );
}
