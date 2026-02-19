"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

interface TodayContactControlsProps {
  date: string;
  setDate: (date: string) => void;
  search: string;
  setSearch: (search: string) => void;
}

export const TodayContactControls = ({
  date,
  setDate,
  search,
  setSearch,
}: TodayContactControlsProps) => {
  return (
    <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center bg-card dark:bg-card p-3 rounded-xs shadow-sm border border-border">
      <div className="flex items-center gap-2 flex-1 md:flex-1">
        {/* Previous Day Button */}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-xs bg-accent text-white hover:bg-primary dark:bg-accent dark:hover:bg-primary border-0 shrink-0"
          onClick={() => {
            const [y, m, d] = date.split("-").map(Number);
            const prev = new Date(y, m - 1, d - 1);
            setDate(
              `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}-${String(prev.getDate()).padStart(2, "0")}`
            );
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="flex-1 dark:hover:text-secondary dark:border-border justify-center font-normal rounded-xs border-border bg-transparent"
            >
              {format(new Date(date + "T00:00:00"), "MMM dd, yyyy")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-xs" align="start">
            <Calendar
              mode="single"
              selected={new Date(date + "T00:00:00")}
              onSelect={(selectedDate) => {
                if (selectedDate) {
                  const local = new Date(
                    selectedDate.getTime() -
                      selectedDate.getTimezoneOffset() * 60000
                  )
                    .toISOString()
                    .split("T")[0];
                  setDate(local);
                }
              }}
              autoFocus
            />
          </PopoverContent>
        </Popover>

        {/* Next Day Button */}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-xs bg-accent text-white hover:bg-primary dark:bg-accent dark:hover:bg-primary border-0 shrink-0"
          onClick={() => {
            const [y, m, d] = date.split("-").map(Number);
            const next = new Date(y, m - 1, d + 1);
            setDate(
              `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`
            );
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative flex-1 md:flex-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search store..."
          className="pl-9 rounded-xs border-border w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
    </div>
  );
};
