"use client";

import { Button } from "@/src/components/ui/button";
import { Calendar } from "@/src/components/ui/calendar";
import { Input } from "@/src/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex items-center gap-2">
        {/* Previous Day Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            setDate(
              new Date(new Date(date).setDate(new Date(date).getDate() - 1))
                .toISOString()
                .split("T")[0]
            )
          }
        >
          <ChevronLeft />
        </Button>

        {/* Date Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-44 justify-center font-normal"
            >
              {format(new Date(date), "PPP")}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={new Date(date)}
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
          onClick={() =>
            setDate(
              new Date(new Date(date).setDate(new Date(date).getDate() + 1))
                .toISOString()
                .split("T")[0]
            )
          }
        >
          <ChevronRight />
        </Button>
      </div>

      <Input
        placeholder="Search store..."
        className="w-60"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );
};
