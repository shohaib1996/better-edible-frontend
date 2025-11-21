"use client";

import { useState, useCallback } from "react";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react";

import { format, addDays, differenceInCalendarDays } from "date-fns";

import { Edit } from "lucide-react";
import { useGetAllFollowupsQuery } from "@/redux/api/Followups/followupsApi";
import { useDebounced } from "@/redux/hooks/hooks";
import { RepSelect } from "@/components/Shared/RepSelect";
import { ManageFollowUpModal } from "@/components/Followup/ManageFollowUpModal";
import { IFollowUp, IRep } from "@/types";
import { useGetAllRepsQuery } from "@/redux/api/Rep/repApi";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/** Helper: convert a YYYY-MM-DD string (or Date) into a local Date at local midnight
 *  Returns null if invalid. This avoids timezone shifts when formatting/displaying.
 */
function toLocalDate(value?: string | Date | null): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const s = String(value);

  // If already "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  // Fallback: try Date parser then convert to local date (safe)
  const parsed = new Date(s);
  if (isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

const FollowUps = () => {
  const [selectedRepId, setSelectedRepId] = useState<string | undefined>(
    undefined
  );
  const [selectedRep, setSelectedRep] = useState<IRep | undefined>(undefined);
  const { data: repsData } = useGetAllRepsQuery({});

  // Local timezone date (used for calendar selection)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState<IFollowUp | null>(
    null
  );

  const debouncedSearch = useDebounced({ searchQuery: search, delay: 500 });

  // <-- IMPORTANT: send yyyy-MM-dd string to backend (date-only)
  const { data, isLoading } = useGetAllFollowupsQuery({
    repId: selectedRepId,
    date: showAll ? undefined : format(selectedDate, "yyyy-MM-dd"),
    storeName: debouncedSearch,
  });

  const followups: IFollowUp[] = data?.followups || [];

  const goPrevDay = () => setSelectedDate(addDays(selectedDate, -1));
  const goNextDay = () => setSelectedDate(addDays(selectedDate, 1));

  if (isLoading) return <p className="p-4 text-gray-500">Loading...</p>;

  return (
    <div className="p-6 space-y-6">
      {/* ------------------- HEADER ------------------- */}
      <h1 className="text-2xl font-semibold">Follow Ups</h1>

      {/* ------------------- FILTERS ------------------- */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Prev Button */}
          <Button variant="outline" onClick={goPrevDay}>
            <ChevronLeft />
          </Button>

          {/* Calendar Popover */}
          <Popover modal>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-44 flex justify-between",
                  !selectedDate && "text-muted-foreground"
                )}
                disabled={showAll}
              >
                {selectedDate
                  ? format(selectedDate, "MMMM dd, yyyy")
                  : "Pick date"}
                <CalendarIcon className="w-4 h-4 opacity-70" />
              </Button>
            </PopoverTrigger>

            <PopoverContent className="p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Next Button */}
          <Button variant="outline" onClick={goNextDay}>
            <ChevronRight />
          </Button>

          {/* Rep Select */}
          <RepSelect
            value={selectedRepId}
            showAllOption={true}
            onChange={(val) => {
              if (val === "all") {
                setSelectedRepId(undefined);
                setSelectedRep(undefined);
              } else {
                setSelectedRepId(val);
                const selected = repsData?.data?.find(
                  (r: any) => r._id === val
                );
                setSelectedRep(selected);
              }
            }}
          />

          {/* Search */}
          <Input
            placeholder="Search stores..."
            className="max-w-xs border-2 border-emerald-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* View All */}
          <div className="flex items-center gap-2 ml-auto">
            <Checkbox
              id="viewAll"
              checked={showAll}
              className="border-2 border-emerald-500"
              onCheckedChange={(v) => {
                setShowAll(Boolean(v));
                if (Boolean(v)) {
                  setSearch("");
                  setSelectedRep(undefined);
                  setSelectedRepId(undefined);
                }
              }}
            />
            <label htmlFor="viewAll" className="text-sm">
              View All
            </label>
          </div>
        </div>
      </Card>

      {/* ------------------- LIST ------------------- */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Followups</h2>

        {followups.length === 0 ? (
          <p className="text-gray-500 text-sm">No followups found.</p>
        ) : (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Rep</TableHead>
                  <TableHead>Follow-up Date</TableHead>
                  <TableHead>Delay</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {followups.map((f) => {
                  const dateStr = (f as any).followupDate as string | undefined;
                  const local = toLocalDate(dateStr);

                  const today = new Date();
                  const delay = local
                    ? Math.max(0, differenceInCalendarDays(today, local))
                    : 0;

                  return (
                    <TableRow key={f._id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{f.store.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {f.store.address}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{f.rep.name}</TableCell>
                      <TableCell>
                        {dateStr && local
                          ? format(local, "MMM dd, yyyy")
                          : "No date"}
                      </TableCell>
                      <TableCell>
                        {delay > 0 ? (
                          <span className="text-red-600 font-medium">
                            {delay} day{delay > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-emerald-600">On time</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="max-w-[200px] truncate cursor-pointer flex items-center gap-1">
                                {f.comments}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs wrap-break-word">
                                {f.comments}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedFollowup(f);
                            setEditModalOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ManageFollowUpModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        followup={selectedFollowup}
      />
    </div>
  );
};

export default FollowUps;
