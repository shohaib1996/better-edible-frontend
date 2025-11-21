"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { useGetTimelogsByRepIdQuery } from "@/redux/api/Timelog/timelogs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Column, DataTable } from "../../ReUsableComponents/DataTable";
import { ITimelog } from "@/types";
import { cn } from "@/lib/utils";

type TimelogResponse = ITimelog[] | { message?: string } | null | undefined;

const TimelogById = ({ id }: { id: string }) => {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const [appliedParams, setAppliedParams] = useState<{
    id: string;
    startDate?: string;
    endDate?: string;
  }>({
    id,
  });

  const hookArg = {
    id: appliedParams.id,
    startDate: appliedParams.startDate,
    endDate: appliedParams.endDate,
  };

  const {
    data: allTimelog = null,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetTimelogsByRepIdQuery(hookArg, {
    refetchOnMountOrArgChange: true,
  });
  const rawData: ITimelog = allTimelog?.data || [];

  const { timelogs, backendMessage } = useMemo(() => {
    const resp = rawData as TimelogResponse;
    if (!resp) return { timelogs: [] as ITimelog[], backendMessage: undefined };
    if (Array.isArray(resp))
      return { timelogs: resp as ITimelog[], backendMessage: undefined };
    const msg = typeof resp.message === "string" ? resp.message : undefined;
    return { timelogs: [] as ITimelog[], backendMessage: msg };
  }, [rawData]);

  // Check if filters are applied and there are no timelogs
  const hasFiltersApplied = appliedParams.startDate || appliedParams.endDate;
  const showEmptyFilterMessage =
    hasFiltersApplied && timelogs.length === 0 && !backendMessage;

  const startLabel = startDate ? format(startDate, "PPP") : "Start Date";
  const endLabel = endDate ? format(endDate, "PPP") : "End Date";

  const handleApplyFilter = () => {
    const s = startDate ? format(startDate, "yyyy-MM-dd") : undefined;
    const e = endDate ? format(endDate, "yyyy-MM-dd") : undefined;

    if (s && e && new Date(s) > new Date(e)) {
      alert("Start date must be before or equal to End date");
      return;
    }

    if (!s && !e) {
      setAppliedParams({ id });
    } else {
      setAppliedParams({ id, startDate: s, endDate: e });
    }

    setTimeout(() => refetch?.(), 50);
  };

  const handleClearFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setAppliedParams({ id });
    setTimeout(() => refetch?.(), 50);
  };

  const calculateWorkedHours = (checkin: string, checkout: string | null) => {
    if (!checkout) return "Still Checked In";
    const diffMs = new Date(checkout).getTime() - new Date(checkin).getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const columns: Column<ITimelog>[] = [
    {
      key: "repName",
      header: "Name",
      render: (row) => (
        <span className="font-medium text-gray-800">{row.rep?.name}</span>
      ),
    },
    {
      key: "checkinTime",
      header: "Check-In Time",
      render: (row) =>
        row.checkinTime ? format(new Date(row.checkinTime), "PPp") : "N/A",
    },
    {
      key: "checkoutTime",
      header: "Check-Out Time",
      render: (row) =>
        row.checkoutTime
          ? format(new Date(row.checkoutTime), "PPp")
          : "Not Checked Out",
    },
    {
      key: "workedHours",
      header: "Worked Duration",
      render: (row) => (
        <span className="text-blue-600 font-semibold">
          {calculateWorkedHours(row.checkinTime, row.checkoutTime)}
        </span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      render: (row) => row.rep?.phone || "N/A",
    },
  ];

  return (
    <Card className="border-0 shadow-md bg-white">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <CardTitle className="text-xl font-bold text-gray-800">
            🕒 Timelogs for {timelogs[0]?.rep?.name || "Representative"}
          </CardTitle>

          <div className="flex items-center gap-3">
            <Popover open={startOpen} onOpenChange={setStartOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-40 justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="truncate">{startLabel}</span>
                </Button>
              </PopoverTrigger>

              <PopoverContent align="start" side="bottom" className="p-2">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(d) => {
                    setStartDate(d ?? undefined);
                    setStartOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover open={endOpen} onOpenChange={setEndOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-40 justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <span className="truncate">{endLabel}</span>
                </Button>
              </PopoverTrigger>

              <PopoverContent align="start" side="bottom" className="p-2">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(d) => {
                    setEndDate(d ?? undefined);
                    setEndOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button size="sm" onClick={handleApplyFilter} className="ml-1">
              Filter
            </Button>
            <Button size="sm" variant="ghost" onClick={handleClearFilter}>
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isError && (
          <div className="mb-4 rounded-md border px-4 py-3 text-sm text-red-700 bg-red-50">
            {/* @ts-ignore */}
            {error?.data?.message ||
              "Failed to load timelogs. Please try again."}
          </div>
        )}

        {/* Show message when backend returns a message OR when filters are applied with no results */}
        {backendMessage || showEmptyFilterMessage ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed p-8 text-center bg-yellow-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-yellow-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>

            <div className="text-lg font-semibold text-gray-800">
              {backendMessage ||
                "Time logs not available for the selected date range"}
            </div>
            <div className="text-sm text-gray-600">
              Try a different date range or click{" "}
              <button onClick={handleClearFilter} className="underline">
                Clear
              </button>{" "}
              to show all timelogs.
            </div>

            <div className="pt-4">
              <Button onClick={handleClearFilter}>Show All Timelogs</Button>
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={timelogs}
            isLoading={isLoading}
            emptyMessage={"No timelogs found for this representative."}
            className="overflow-hidden"
          />
        )}
      </CardContent>
    </Card>
  );
};

export default TimelogById;
