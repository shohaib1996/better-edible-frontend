"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUser } from "@/redux/hooks/useAuth";
import { useGetTimelogsByRepIdQuery } from "@/redux/api/Timelog/timelogs";

interface TimeLog {
  _id: string;
  rep: {
    _id: string;
    name: string;
  };
  checkinTime: string;
  checkoutTime: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function TimeLogsPage() {
  const user = useUser();
  const [date, setDate] = useState<DateRange | undefined>();

  const queryParams: any = {
    id: user?.id,
  };

  if (date?.from) queryParams.startDate = date.from.toISOString();
  if (date?.to) queryParams.endDate = date.to.toISOString();

  const { data, isLoading, isError } = useGetTimelogsByRepIdQuery(queryParams, {
    skip: !user?.id,
  });

  const timeLogs: TimeLog[] = data?.data || [];

  // Calculate work duration in hours and minutes
  const calculateDuration = (checkin: string, checkout: string | null) => {
    if (!checkout) return "In Progress";

    const checkinTime = new Date(checkin);
    const checkoutTime = new Date(checkout);
    const diffMs = checkoutTime.getTime() - checkinTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;

    return `${hours}h ${minutes}m`;
  };

  // Calculate total hours worked
  const calculateTotalHours = () => {
    let totalMinutes = 0;
    timeLogs.forEach((log) => {
      if (log.checkoutTime) {
        const checkinTime = new Date(log.checkinTime);
        const checkoutTime = new Date(log.checkoutTime);
        const diffMs = checkoutTime.getTime() - checkinTime.getTime();
        totalMinutes += Math.floor(diffMs / 60000);
      }
    });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Time Logs</h1>
          <p className="text-sm text-gray-500 mt-1">
            View your check-in and check-out history
          </p>
        </div>
        {timeLogs.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2">
            <p className="text-sm text-gray-600">Total Hours Worked</p>
            <p className="text-2xl font-bold text-green-700">
              {calculateTotalHours()}
            </p>
          </div>
        )}
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="w-full md:w-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[300px] justify-start text-left font-normal border-green-500",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {date && (
          <Button
            variant="ghost"
            onClick={() => setDate(undefined)}
            className="w-full md:w-auto"
          >
            Reset Filter
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Rep Name</TableHead>
              <TableHead>Check-In Time</TableHead>
              <TableHead>Check-Out Time</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading time logs...
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-red-500"
                >
                  Error loading time logs.
                </TableCell>
              </TableRow>
            ) : timeLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No time logs found.
                </TableCell>
              </TableRow>
            ) : (
              timeLogs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell className="font-medium">
                    {format(new Date(log.checkinTime), "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>{log.rep?.name || user?.name || "N/A"}</TableCell>
                  <TableCell>
                    {format(new Date(log.checkinTime), "hh:mm a")}
                  </TableCell>
                  <TableCell>
                    {log.checkoutTime
                      ? format(new Date(log.checkoutTime), "hh:mm a")
                      : "-"}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {calculateDuration(log.checkinTime, log.checkoutTime)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                        {
                          "bg-green-100 text-green-800": log.checkoutTime,
                          "bg-blue-100 text-blue-800": !log.checkoutTime,
                        }
                      )}
                    >
                      {log.checkoutTime ? "Completed" : "Active"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
