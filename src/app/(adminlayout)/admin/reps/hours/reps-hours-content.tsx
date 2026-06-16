"use client";

import { useState } from "react";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  endOfMonth,
  setDate,
  addMonths,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowLeft, CalendarIcon, Clock, Loader2, Banknote, Timer, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useGetTimelogsSummaryQuery } from "@/redux/api/Timelog/timelogs";
import { ITimelogSummary } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable, Column } from "@/components/ReUsableComponents/DataTable";

// ─── Pay period helpers ────────────────────────────────────────────────────────
function currentWeekRange() {
  const now = new Date();
  return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
}
function currentSemiMonthlyRange() {
  const now = new Date();
  const day = now.getDate();
  return day <= 15
    ? { start: setDate(now, 1), end: setDate(now, 15) }
    : { start: setDate(now, 16), end: endOfMonth(now) };
}
function lastWeekRange() {
  const prev = subDays(new Date(), 7);
  return { start: startOfWeek(prev, { weekStartsOn: 1 }), end: endOfWeek(prev, { weekStartsOn: 1 }) };
}
function lastSemiMonthlyRange() {
  const now = new Date();
  const day = now.getDate();
  if (day <= 15) {
    const prevMonth = addMonths(now, -1);
    return { start: setDate(prevMonth, 16), end: endOfMonth(prevMonth) };
  }
  return { start: setDate(now, 1), end: setDate(now, 15) };
}

// ─── Oregon OT: 1.5× over 40 hrs/week ────────────────────────────────────────
function calcOregonOT(totalMinutes: number): { regularMins: number; otMins: number } {
  const regularMins = Math.min(totalMinutes, 40 * 60);
  const otMins = Math.max(0, totalMinutes - 40 * 60);
  return { regularMins, otMins };
}

function calcGrossPay(summary: ITimelogSummary): number | null {
  if (summary.payType === "salary") {
    return summary.semiMonthlyAmount ?? null;
  }
  if (summary.payType === "hourly" && summary.hourlyRate) {
    const { regularMins, otMins } = calcOregonOT(summary.totalMinutesWorked);
    const regularPay = (regularMins / 60) * summary.hourlyRate;
    const otPay = (otMins / 60) * summary.hourlyRate * 1.5;
    return regularPay + otPay;
  }
  return null;
}

// ─── QB CSV export ─────────────────────────────────────────────────────────────
function exportToQBCSV(summaries: ITimelogSummary[], startDate?: Date, endDate?: Date) {
  const periodLabel = startDate && endDate
    ? `${format(startDate, "yyyy-MM-dd")}_to_${format(endDate, "yyyy-MM-dd")}`
    : "all-time";

  const rows: string[][] = [
    ["Employee Name", "Pay Period Start", "Pay Period End", "Pay Type",
     "Regular Hours", "OT Hours (1.5x)", "Total Hours", "Rate", "Gross Pay"],
  ];

  summaries.forEach((s) => {
    const { regularMins, otMins } = calcOregonOT(s.totalMinutesWorked);
    const regularHrs = (regularMins / 60).toFixed(2);
    const otHrs = (otMins / 60).toFixed(2);
    const totalHrs = (s.totalMinutesWorked / 60).toFixed(2);
    const grossPay = calcGrossPay(s);
    const rate = s.payType === "salary"
      ? (s.semiMonthlyAmount != null ? `$${s.semiMonthlyAmount.toFixed(2)}/period` : "")
      : (s.hourlyRate != null ? `$${s.hourlyRate.toFixed(2)}/hr` : "");

    rows.push([
      s.repName,
      startDate ? format(startDate, "MM/dd/yyyy") : "",
      endDate ? format(endDate, "MM/dd/yyyy") : "",
      s.payType === "salary" ? "Salary" : "Hourly",
      regularHrs,
      otHrs,
      totalHrs,
      rate,
      grossPay != null ? `$${grossPay.toFixed(2)}` : "Rate not set",
    ]);
  });

  const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `better-edibles-payroll-${periodLabel}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
// ──────────────────────────────────────────────────────────────────────────────

export default function RepsHoursContent() {
  const router = useRouter();
  const today = new Date();
  const sevenDaysAgo = subDays(today, 7);

  const [startDate, setStartDate] = useState<Date | undefined>(sevenDaysAgo);
  const [endDate, setEndDate] = useState<Date | undefined>(today);
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  const queryParams: { startDate?: string; endDate?: string } = {};
  if (startDate) queryParams.startDate = format(startDate, "yyyy-MM-dd");
  if (endDate) queryParams.endDate = format(endDate, "yyyy-MM-dd");

  const { data, isLoading, error, refetch } = useGetTimelogsSummaryQuery(queryParams);

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

  const applyRange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
    setTimeout(() => refetch(), 100);
  };

  const summaries: ITimelogSummary[] = data?.data || [];
  const tableData = summaries.map((s) => ({ ...s, _id: s.repId }));

  const totalGross = summaries.reduce((sum, s) => {
    const g = calcGrossPay(s);
    return g != null ? sum + g : sum;
  }, 0);

  const columns: Column<ITimelogSummary & { _id: string }>[] = [
    {
      key: "repName",
      header: "Rep Name",
      render: (s) => <span className="font-medium text-foreground">{s.repName}</span>,
    },
    {
      key: "payType",
      header: "Pay",
      render: (s) => {
        const isSalary = s.payType === "salary";
        return (
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border",
            isSalary
              ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200"
              : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200"
          )}>
            {isSalary ? <Banknote className="size-3" /> : <Timer className="size-3" />}
            {isSalary ? "Salary" : "Hourly"}
          </span>
        );
      },
    },
    {
      key: "daysWorked",
      header: "Days",
      render: (s) => <span className="font-semibold text-primary">{s.daysWorked}</span>,
    },
    {
      key: "formattedTotalTime",
      header: "Total Hours",
      render: (s) => {
        const { regularMins, otMins } = calcOregonOT(s.totalMinutesWorked);
        const regH = Math.floor(regularMins / 60);
        const regM = regularMins % 60;
        const otH = Math.floor(otMins / 60);
        const otM = otMins % 60;
        return (
          <div className="text-xs space-y-0.5">
            <div className="font-semibold text-foreground">{s.formattedTotalTime}</div>
            <div className="text-muted-foreground">{regH}h {regM}m reg{otMins > 0 ? ` · ${otH}h ${otM}m OT` : ""}</div>
          </div>
        );
      },
    },
    {
      key: "hourlyRate",
      header: "Rate",
      render: (s) => {
        if (s.payType === "salary" && s.semiMonthlyAmount != null)
          return <span className="text-xs text-foreground">${s.semiMonthlyAmount.toLocaleString()}<span className="text-muted-foreground">/period</span></span>;
        if (s.hourlyRate != null)
          return <span className="text-xs text-foreground">${s.hourlyRate.toFixed(2)}<span className="text-muted-foreground">/hr</span></span>;
        return <span className="text-xs text-muted-foreground italic">Not set</span>;
      },
    },
    {
      key: "totalMinutesWorked",
      header: "Gross Pay",
      render: (s) => {
        const g = calcGrossPay(s);
        if (g == null) return <span className="text-xs text-muted-foreground italic">Rate not set</span>;
        return <span className="font-semibold text-emerald-600 dark:text-emerald-400">${g.toFixed(2)}</span>;
      },
    },
    {
      key: "logs",
      header: "Sessions",
      render: (s) => <span className="text-muted-foreground">{s.logs.length} sessions</span>,
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-background text-foreground">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <Button variant="outline" className="w-fit rounded-xs" onClick={() => router.back()}>
            <ArrowLeft className="size-4 mr-1" /> Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-foreground">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              Time Logs Summary
            </h1>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              View, filter, and export payroll data for all representatives
            </p>
          </div>
        </div>
        {summaries.length > 0 && (
          <Button
            onClick={() => exportToQBCSV(summaries, startDate, endDate)}
            className="rounded-xs flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="size-4" />
            Export for QuickBooks
          </Button>
        )}
      </div>

      {/* Pay Period Quick-Select */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground self-center mr-1">Quick select:</span>
        <Button size="sm" variant="outline"
          className="rounded-xs text-xs h-8 px-3 bg-amber-50 dark:bg-amber-900/20 border-amber-200 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
          onClick={() => { const r = currentWeekRange(); applyRange(r.start, r.end); }}>
          <Timer className="size-3 mr-1" /> This Week (Hourly)
        </Button>
        <Button size="sm" variant="outline"
          className="rounded-xs text-xs h-8 px-3 bg-amber-50 dark:bg-amber-900/20 border-amber-200 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
          onClick={() => { const r = lastWeekRange(); applyRange(r.start, r.end); }}>
          <Timer className="size-3 mr-1" /> Last Week (Hourly)
        </Button>
        <Button size="sm" variant="outline"
          className="rounded-xs text-xs h-8 px-3 bg-violet-50 dark:bg-violet-900/20 border-violet-200 text-violet-700 dark:text-violet-300 hover:bg-violet-100"
          onClick={() => { const r = currentSemiMonthlyRange(); applyRange(r.start, r.end); }}>
          <Banknote className="size-3 mr-1" /> This Period (Salary)
        </Button>
        <Button size="sm" variant="outline"
          className="rounded-xs text-xs h-8 px-3 bg-violet-50 dark:bg-violet-900/20 border-violet-200 text-violet-700 dark:text-violet-300 hover:bg-violet-100"
          onClick={() => { const r = lastSemiMonthlyRange(); applyRange(r.start, r.end); }}>
          <Banknote className="size-3 mr-1" /> Last Period (Salary)
        </Button>
      </div>

      {/* Date Filters */}
      <Card className="border-border py-0 bg-card rounded-xs">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Popover open={startOpen} onOpenChange={setStartOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal rounded-xs bg-background", !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xs" align="start">
                <Calendar mode="single" selected={startDate} onSelect={(d) => { setStartDate(d ?? undefined); setStartOpen(false); }} autoFocus className="rounded-xs" />
              </PopoverContent>
            </Popover>

            <Popover open={endOpen} onOpenChange={setEndOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("flex-1 justify-start text-left font-normal rounded-xs bg-background", !endDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-xs" align="start">
                <Calendar mode="single" selected={endDate} onSelect={(d) => { setEndDate(d ?? undefined); setEndOpen(false); }} autoFocus className="rounded-xs" />
              </PopoverContent>
            </Popover>

            <div className="flex gap-2 sm:gap-3">
              <Button onClick={handleApplyFilter} className="flex-1 sm:flex-none rounded-xs">Filter</Button>
              <Button onClick={handleClear} variant="outline" className="flex-1 sm:flex-none dark:bg-accent rounded-xs bg-background border-border">Clear</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card className="border-destructive bg-destructive/10 rounded-xs">
          <CardContent className="p-4 sm:p-6">
            <p className="text-destructive font-medium">Error loading time logs</p>
            <p className="text-destructive/80 text-sm mt-1">{(error as any)?.data?.message || "Failed to fetch time logs summary"}</p>
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
              <p className="text-foreground font-medium text-base sm:text-lg">No time logs found for the selected date range</p>
              <p className="text-sm text-muted-foreground mt-2">Try a different date range or click "Clear" to view all logs</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border bg-card rounded-xs py-0">
              <CardContent className="p-4 sm:p-6">
                <div className="text-sm text-muted-foreground mb-1">Total Reps</div>
                <div className="text-2xl sm:text-3xl font-bold text-primary">{data?.totalReps || 0}</div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card rounded-xs py-0">
              <CardContent className="p-4 sm:p-6">
                <div className="text-sm text-muted-foreground mb-1">Date Range</div>
                <div className="text-sm font-medium text-foreground">
                  {startDate && endDate ? `${format(startDate, "PP")} – ${format(endDate, "PP")}` : "All Time"}
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card rounded-xs py-0">
              <CardContent className="p-4 sm:p-6">
                <div className="text-sm text-muted-foreground mb-1">Total Hours</div>
                <div className="text-2xl sm:text-3xl font-bold text-primary">
                  {summaries.reduce((sum, s) => sum + s.totalHours, 0).toFixed(0)}h
                </div>
              </CardContent>
            </Card>
            <Card className="border-border bg-card rounded-xs py-0">
              <CardContent className="p-4 sm:p-6">
                <div className="text-sm text-muted-foreground mb-1">Est. Gross Payroll</div>
                <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  ${totalGross.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table */}
          <DataTable columns={columns} data={tableData} />

          {/* QB export note */}
          <p className="text-xs text-muted-foreground">
            * Oregon OT: 1.5× applied to hours over 40/week for hourly employees. Gross pay is an estimate — taxes, deductions, and employer contributions are calculated in QuickBooks.
          </p>
        </div>
      )}
    </div>
  );
}
