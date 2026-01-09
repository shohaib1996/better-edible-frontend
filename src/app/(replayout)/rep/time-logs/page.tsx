"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  CalendarIcon,
  Clock,
  User,
  LogIn,
  LogOut,
  Timer,
  CheckCircle,
  RotateCcw,
} from "lucide-react";
import type { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useUser } from "@/redux/hooks/useAuth";
import { useGetTimelogsByRepIdQuery } from "@/redux/api/Timelog/timelogs";
import { DataTable, type Column } from "@/components/ReUsableComponents/DataTable";

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

  const queryParams: Record<string, string> = {
    id: user?.id || "",
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

  // Define columns for DataTable
  const columns: Column<TimeLog>[] = [
    {
      key: "checkinTime",
      header: "Date",
      render: (log) => (
        <div className="flex items-center gap-2 font-medium text-foreground">
          <CalendarIcon className="h-4 w-4 text-primary" />
          {format(new Date(log.checkinTime), "MMM dd, yyyy")}
        </div>
      ),
    },
    {
      key: "rep",
      header: "Rep Name",
      render: (log) => (
        <div className="flex items-center gap-2 text-primary font-medium">
          <User className="h-4 w-4" />
          {log.rep?.name || user?.name || "N/A"}
        </div>
      ),
    },
    {
      key: "checkinTime",
      header: "Check-In",
      render: (log) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <LogIn className="h-4 w-4 text-primary" />
          {format(new Date(log.checkinTime), "hh:mm a")}
        </div>
      ),
    },
    {
      key: "checkoutTime",
      header: "Check-Out",
      render: (log) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <LogOut className="h-4 w-4 text-primary" />
          {log.checkoutTime ? format(new Date(log.checkoutTime), "hh:mm a") : "-"}
        </div>
      ),
    },
    {
      key: "duration",
      header: "Duration",
      render: (log) => (
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <Timer className="h-4 w-4 text-primary" />
          {calculateDuration(log.checkinTime, log.checkoutTime)}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (log) => (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-primary" />
          <span
            className={cn(
              "inline-flex items-center rounded-xs px-2.5 py-0.5 text-xs font-medium text-white",
              log.checkoutTime
                ? "bg-emerald-500 dark:bg-emerald-600"
                : "bg-blue-500 dark:bg-blue-600"
            )}
          >
            {log.checkoutTime ? "Completed" : "Active"}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Time Logs
            </h1>
            <p className="text-sm text-muted-foreground">
              View your check-in and check-out history
            </p>
          </div>
        </div>
        {timeLogs.length > 0 && (
          <div className="bg-emerald-500 dark:bg-emerald-600 rounded-xs px-4 py-2">
            <p className="text-xs text-white/80">Total Hours Worked</p>
            <p className="text-xl md:text-2xl font-bold text-white">
              {calculateTotalHours()}
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant="outline"
              className={cn(
                "w-full sm:w-[280px] justify-start text-left font-normal rounded-xs border-primary h-9",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "MMM dd, yyyy")} -{" "}
                    {format(date.to, "MMM dd, yyyy")}
                  </>
                ) : (
                  format(date.from, "MMM dd, yyyy")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 rounded-xs" align="start">
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

        {date && (
          <Button
            variant="outline"
            onClick={() => setDate(undefined)}
            className="rounded-xs h-9 border-muted-foreground/30 hover:bg-accent hover:text-white"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        )}
      </div>

      <div className="hidden md:block">
        <DataTable
          columns={columns}
          data={timeLogs}
          isLoading={isLoading}
          emptyMessage={isError ? "Error loading time logs." : "No time logs found."}
        />
      </div>

      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading time logs...
          </div>
        ) : isError ? (
          <div className="text-center py-8 text-destructive">
            Error loading time logs.
          </div>
        ) : timeLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No time logs found.
          </div>
        ) : (
          timeLogs.map((log) => (
            <Card
              key={log._id}
              className="rounded-xs border-l-4 border-l-primary py-0 overflow-hidden"
            >
              <CardHeader className="px-3 py-2 flex flex-row items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">
                    {format(new Date(log.checkinTime), "MMM dd, yyyy")}
                  </p>
                  <p className="text-sm text-primary">
                    {log.rep?.name || user?.name || "N/A"}
                  </p>
                </div>
                <span
                  className={cn(
                    "inline-flex items-center rounded-xs px-2.5 py-0.5 text-xs font-medium text-white",
                    log.checkoutTime
                      ? "bg-emerald-500 dark:bg-emerald-600"
                      : "bg-blue-500 dark:bg-blue-600"
                  )}
                >
                  {log.checkoutTime ? "Completed" : "Active"}
                </span>
              </CardHeader>
              <CardContent className="px-3 py-2 bg-secondary/30 dark:bg-secondary/10">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Check-In</p>
                    <p className="font-medium text-foreground">
                      {format(new Date(log.checkinTime), "hh:mm a")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Check-Out</p>
                    <p className="font-medium text-foreground">
                      {log.checkoutTime
                        ? format(new Date(log.checkoutTime), "hh:mm a")
                        : "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Duration</p>
                    <p className="font-semibold text-primary">
                      {calculateDuration(log.checkinTime, log.checkoutTime)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
