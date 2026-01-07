"use client";

import { useState } from "react";
import {
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Pencil,
  CalendarDays,
  MessageSquare,
} from "lucide-react";
import { format, addDays, differenceInCalendarDays } from "date-fns";
import { useGetAllFollowupsQuery } from "@/redux/api/Followups/followupsApi";
import { useDebounced } from "@/redux/hooks/hooks";
import { RepSelect } from "@/components/Shared/RepSelect";
import { ManageFollowUpModal } from "@/components/Followup/ManageFollowUpModal";
import type { IFollowUp, IRep } from "@/types";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { DataTable, Column } from "@/components/ReUsableComponents/DataTable";

/** Helper: convert a YYYY-MM-DD string (or Date) into a local Date at local midnight */
function toLocalDate(value?: string | Date | null): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const s = String(value);

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-");
    return new Date(Number(y), Number(m) - 1, Number(d));
  }

  const parsed = new Date(s);
  if (isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

export default function FollowUpsContent() {
  const [selectedRepId, setSelectedRepId] = useState<string | undefined>(
    undefined
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedRep, setSelectedRep] = useState<IRep | undefined>(undefined);
  const { data: repsData } = useGetAllRepsQuery({});

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState<IFollowUp | null>(
    null
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const debouncedSearch = useDebounced({ searchQuery: search, delay: 500 });

  const { data, isLoading } = useGetAllFollowupsQuery({
    repId: selectedRepId,
    date: showAll ? undefined : format(selectedDate, "yyyy-MM-dd"),
    storeName: debouncedSearch,
    page: currentPage,
    limit: itemsPerPage,
  });

  const followups: IFollowUp[] = data?.followups || [];
  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const goPrevDay = () => setSelectedDate(addDays(selectedDate, -1));
  const goNextDay = () => setSelectedDate(addDays(selectedDate, 1));

  const columns: Column<IFollowUp>[] = [
    {
      key: "store",
      header: "Store",
      className: "min-w-[200px]",
      render: (f) => (
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{f.store?.name}</span>
          <span className="text-xs text-muted-foreground">
            {f.store?.address}
          </span>
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
        const today = new Date();
        const delay = local
          ? Math.max(0, differenceInCalendarDays(today, local))
          : 0;

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
          {/* Desktop: Tooltip on hover */}
          <div className="hidden md:block">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="max-w-[200px] truncate cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                    {f.comments || "-"}
                  </div>
                </TooltipTrigger>
                <TooltipContent className="rounded-xs max-w-xs">
                  <p className="wrap-break-word">
                    {f.comments || "No comments"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {/* Mobile: Show wrapped text */}
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
                onClick={() => {
                  setSelectedFollowup(f);
                  setEditModalOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="rounded-xs">
              Edit Follow-up
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-muted-foreground">Loading follow-ups...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-6 w-6 text-primary" />
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">
          Follow Ups
        </h1>
      </div>

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
                    onClick={() => {
                      goPrevDay();
                      if (!showAll) setCurrentPage(1);
                    }}
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
                    showAll && "opacity-50"
                  )}
                  disabled={showAll}
                >
                  <span className="truncate">
                    {selectedDate
                      ? format(selectedDate, "MMM dd, yyyy")
                      : "Pick date"}
                  </span>
                  <CalendarIcon className="w-4 h-4 opacity-70 shrink-0 ml-2" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0 rounded-xs w-auto" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => {
                    if (d) {
                      setSelectedDate(d);
                      if (!showAll) setCurrentPage(1);
                    }
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
                    onClick={() => {
                      goNextDay();
                      if (!showAll) setCurrentPage(1);
                    }}
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
                  const selected = repsData?.data?.find(
                    (r: any) => r._id === val
                  );
                  setSelectedRep(selected);
                }
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Search */}
          <div className="min-w-0 w-full md:flex-[1.5]">
            <Input
              placeholder="Search stores..."
              className="w-full h-10 rounded-xs border-2 border-primary/50 focus:border-primary dark:border-primary/40 dark:bg-background"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
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
                setCurrentPage(1);
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

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg text-foreground">Followups</h2>
          <span className="text-sm text-muted-foreground">
            ({totalItems} total)
          </span>
        </div>

        {followups.length === 0 ? (
          <Card className="p-6 rounded-xs text-center border-border">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                No followups found.
              </p>
            </div>
          </Card>
        ) : (
          <>
            <DataTable columns={columns} data={followups} />
            {/* Pagination */}
            {totalItems > 0 && (
              <GlobalPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onLimitChange={(limit) => {
                  setItemsPerPage(limit);
                  setCurrentPage(1);
                }}
                limitOptions={[10, 20, 50, 100]}
              />
            )}
          </>
        )}
      </div>

      <ManageFollowUpModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        followup={selectedFollowup}
      />
    </div>
  );
}
