"use client";

import { useState } from "react";
import { format, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetTimelogsSummaryQuery } from "@/redux/api/Timelog/timelogs";
import { ITimelogSummary } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ReUsableComponents/DataTable";

export default function RepsHoursContent() {
  const today = new Date();
  const sevenDaysAgo = subDays(today, 7);

  const [startDate, setStartDate] = useState<Date | undefined>(sevenDaysAgo);
  const [endDate, setEndDate] = useState<Date | undefined>(today);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const queryParams: { startDate?: string; endDate?: string } = {};
  if (startDate) queryParams.startDate = format(startDate, "yyyy-MM-dd");
  if (endDate) queryParams.endDate = format(endDate, "yyyy-MM-dd");

  const { data, isLoading, error, refetch } =
    useGetTimelogsSummaryQuery(queryParams);

  const handleClear = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setTimeout(() => refetch(), 100);
  };

  const handleApplyFilter = () => {
    if (startDate && endDate && startDate > endDate) {
      alert("Start date must be before or equal to End date");
      return;
    }
    setTimeout(() => refetch(), 100);
  };

  const summaries: ITimelogSummary[] = data?.data || [];
  const tableData = summaries.map((s) => ({ ...s, _id: s.repId }));

  const columns: Column<ITimelogSummary & { _id: string }>[] = [
    {
      key: "repName",
      header: "Rep Name",
      render: (summary) => (
        <span className="font-medium text-foreground">{summary.repName}</span>
      ),
    },
    {
      key: "repType",
      header: "Type",
      render: (summary) => (
        <span className="px-2 py-1 bg-primary/10 text-primary rounded-xs text-xs font-medium capitalize border border-primary/20">
          {summary.repType || "N/A"}
        </span>
      ),
    },
    {
      key: "repPhone",
      header: "Phone",
      render: (summary) => (
        <span className="text-sm text-muted-foreground">
          {summary.repPhone || "N/A"}
        </span>
      ),
    },
    {
      key: "daysWorked",
      header: "Days Worked",
      render: (summary) => (
        <span className="font-semibold text-primary">{summary.daysWorked}</span>
      ),
    },
    {
      key: "formattedTotalTime",
      header: "Total Hours",
      render: (summary) => (
        <span className="font-semibold text-primary">
          {summary.formattedTotalTime}
        </span>
      ),
    },
    {
      key: "logs",
      header: "Sessions",
      render: (summary) => (
        <span className="text-muted-foreground">
          {summary.logs.length} sessions
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-background text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-foreground">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              Time Logs Summary
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              View and filter time logs for all representatives
            </p>
          </div>
        </div>
      </div>

      {/* Date Filters */}
      <Card className="border-border py-0 bg-card rounded-xs">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Popover open={startOpen} onOpenChange={setStartOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal rounded-xs bg-background hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xs" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(d) => {
                    setStartDate(d ?? undefined);
                    setStartOpen(false);
                  }}
                  autoFocus
                  className="rounded-xs"
                />
              </PopoverContent>
            </Popover>

            <Popover open={endOpen} onOpenChange={setEndOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal rounded-xs bg-background hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xs" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(d) => {
                    setEndDate(d ?? undefined);
                    setEndOpen(false);
                  }}
                  autoFocus
                  className="rounded-xs"
                />
              </PopoverContent>
            </Popover>

            <div className="flex gap-2 sm:gap-3">
              <Button
                onClick={handleApplyFilter}
                className="flex-1 sm:flex-none rounded-xs"
              >
                Filter
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                className="flex-1 sm:flex-none dark:bg-accent rounded-xs bg-background border-border hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
              >
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive bg-destructive/10 rounded-xs">
          <CardContent className="p-4 sm:p-6">
            <p className="text-destructive font-medium">
              Error loading time logs
            </p>
            <p className="text-destructive/80 text-sm mt-1">
              {(error as any)?.data?.message ||
                "Failed to fetch time logs summary"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      ) : summaries.length === 0 && !error ? (
        <Card className="border-border bg-card rounded-xs">
          <CardContent className="p-8 sm:p-12">
            <div className="text-center">
              <Clock className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-foreground font-medium text-base sm:text-lg">
                No time logs found for the selected date range
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try selecting a different date range or click "Clear" to view
                all logs
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-border bg-card rounded-xs py-0">
              <CardContent className="p-4 sm:p-6">
                <div className="text-sm text-muted-foreground mb-1">
                  Total Reps
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-primary">
                  {data?.totalReps || 0}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card rounded-xs py-0">
              <CardContent className="p-4 sm:p-6">
                <div className="text-sm text-muted-foreground mb-1">
                  Date Range
                </div>
                <div className="text-base sm:text-lg font-medium text-foreground">
                  {startDate && endDate
                    ? `${format(startDate, "PP")} - ${format(endDate, "PP")}`
                    : "All Time"}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card rounded-xs sm:col-span-2 lg:col-span-1 py-0">
              <CardContent className="p-4 sm:p-6">
                <div className="text-sm text-muted-foreground mb-1">
                  Total Hours
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-primary">
                  {summaries
                    .reduce((sum, rep) => sum + rep.totalHours, 0)
                    .toFixed(0)}
                  h
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <DataTable columns={columns} data={tableData} />
        </div>
      )}
    </div>
  );
}
