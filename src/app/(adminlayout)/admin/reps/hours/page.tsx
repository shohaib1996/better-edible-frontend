"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Clock, Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetTimelogsSummaryQuery } from "@/redux/api/Timelog/timelogs";
import { ITimelogSummary } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function TimeLogsSummaryPage() {
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const queryParams: { startDate?: string; endDate?: string } = {};
  if (startDate) queryParams.startDate = format(startDate, "yyyy-MM-dd");
  if (endDate) queryParams.endDate = format(endDate, "yyyy-MM-dd");

  const { data, isLoading, error, refetch } =
    useGetTimelogsSummaryQuery(queryParams);

  console.log("Query params:", queryParams);
  console.log("API Response:", data);
  console.log("API Error:", error);

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Clock className="w-8 h-8 text-emerald-600" />
              Time Logs Summary - All Reps
            </h1>
            <p className="text-gray-600 mt-1">
              View and filter time logs for all representatives
            </p>
          </div>
        </div>
      </div>

      {/* Date Filters */}
      <Card className="py-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <Popover open={startOpen} onOpenChange={setStartOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(d) => {
                    setStartDate(d ?? undefined);
                    setStartOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>

            <Popover open={endOpen} onOpenChange={setEndOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(d) => {
                    setEndDate(d ?? undefined);
                    setEndOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>

            <Button onClick={handleApplyFilter}>Filter</Button>
            <Button onClick={handleClear} variant="ghost">
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-800 font-medium">Error loading time logs</p>
            <p className="text-red-600 text-sm mt-1">
              {(error as any)?.data?.message ||
                "Failed to fetch time logs summary"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
        </div>
      ) : summaries.length === 0 && !error ? (
        <Card>
          <CardContent className="">
            <div className="text-center">
              <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 font-medium text-lg">
                No time logs found for the selected date range
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Try selecting a different date range or click "Clear" to view
                all logs
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="py-0">
              <CardContent className="p-6">
                <div className="text-sm text-gray-600 mb-1">Total Reps</div>
                <div className="text-3xl font-bold text-emerald-600">
                  {data?.totalReps || 0}
                </div>
              </CardContent>
            </Card>
            <Card className="py-0">
              <CardContent className="p-6">
                <div className="text-sm text-gray-600 mb-1">Date Range</div>
                <div className="text-lg font-medium">
                  {startDate && endDate
                    ? `${format(startDate, "PP")} - ${format(endDate, "PP")}`
                    : "All Time"}
                </div>
              </CardContent>
            </Card>
            <Card className="py-0">
              <CardContent className="p-6">
                <div className="text-sm text-gray-600 mb-1">Total Hours</div>
                <div className="text-3xl font-bold text-blue-600">
                  {summaries
                    .reduce((sum, rep) => sum + rep.totalHours, 0)
                    .toFixed(0)}
                  h
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <Card className="py-0">
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rep Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Days Worked</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Sessions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {summaries.map((summary) => (
                      <TableRow key={summary.repId}>
                        <TableCell className="font-medium">
                          {summary.repName}
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                            {summary.repType || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {summary.repPhone || "N/A"}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-emerald-700">
                            {summary.daysWorked}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-blue-700">
                            {summary.formattedTotalTime}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {summary.logs.length} sessions
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
