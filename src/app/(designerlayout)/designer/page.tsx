"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ClipboardList,
  ChevronRight,
  Calendar,
  Loader2,
  Clock,
  Pencil,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RequestStatusBadge } from "@/components/DesignRequests/RequestStatusBadge";
import { useGetDesignRequestsQuery } from "@/redux/api/DesignRequests/designRequestsApi";
import type {
  DesignRequestType,
  DesignRequestStatus,
  IDesignRequest,
} from "@/types/designRequests/designRequests";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type QueueTab = DesignRequestType;

const TABS: { id: QueueTab; label: string }[] = [
  { id: "inhouse", label: "In-House" },
  { id: "free", label: "Free" },
  { id: "paid", label: "Paid" },
];

const STATUS_OPTIONS: { value: DesignRequestStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "revision-requested", label: "Revision Requested" },
  { value: "completed", label: "Completed" },
];

const STATUS_BAR_COLOR: Record<DesignRequestStatus, string> = {
  pending: "bg-amber-400",
  "in-progress": "bg-blue-500",
  "revision-requested": "bg-orange-500",
  completed: "bg-green-500",
};

const STAT_CONFIG: {
  status: DesignRequestStatus;
  label: string;
  icon: React.ElementType;
  dot: string;
  value: string;
  text: string;
}[] = [
  {
    status: "pending",
    label: "Pending",
    icon: Clock,
    dot: "bg-amber-400",
    value: "text-amber-600 dark:text-amber-400",
    text: "text-muted-foreground",
  },
  {
    status: "in-progress",
    label: "In Progress",
    icon: Pencil,
    dot: "bg-blue-500",
    value: "text-blue-600 dark:text-blue-400",
    text: "text-muted-foreground",
  },
  {
    status: "revision-requested",
    label: "Revision",
    icon: RotateCcw,
    dot: "bg-orange-500",
    value: "text-orange-600 dark:text-orange-400",
    text: "text-muted-foreground",
  },
  {
    status: "completed",
    label: "Completed",
    icon: CheckCircle2,
    dot: "bg-green-500",
    value: "text-green-600 dark:text-green-400",
    text: "text-muted-foreground",
  },
];

function useStatCounts() {
  const { data: inhouse } = useGetDesignRequestsQuery({ queue: "inhouse", limit: 200 });
  const { data: free } = useGetDesignRequestsQuery({ queue: "free", limit: 200 });
  const { data: paid } = useGetDesignRequestsQuery({ queue: "paid", limit: 200 });

  const all: IDesignRequest[] = [
    ...(inhouse?.requests ?? []),
    ...(free?.requests ?? []),
    ...(paid?.requests ?? []),
  ];

  const counts: Record<DesignRequestStatus, number> = {
    pending: 0,
    "in-progress": 0,
    "revision-requested": 0,
    completed: 0,
  };
  for (const r of all) counts[r.status] = (counts[r.status] ?? 0) + 1;
  return { counts, total: all.length };
}

export default function DesignerQueuePage() {
  const [activeTab, setActiveTab] = useState<QueueTab>("inhouse");
  const [statusFilter, setStatusFilter] = useState<DesignRequestStatus | "all">("all");

  const { data, isLoading } = useGetDesignRequestsQuery({
    queue: activeTab,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
  });

  const { counts } = useStatCounts();
  const requests = data?.requests ?? [];

  return (
    <div className="space-y-6">
      {/* Hero strip */}
      <div className="rounded-xs overflow-hidden relative px-6 py-5 bg-linear-to-r from-primary to-secondary dark:from-[#003049] dark:via-[#002838] dark:to-[#001d2e] dark:border dark:border-border">
        <div
          className="absolute inset-0 opacity-15 dark:opacity-0 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)" }}
        />
        <div
          className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 10% 50%, rgba(247,127,0,0.15) 0%, transparent 60%)" }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-white/80 dark:text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/80 dark:text-primary">
              Design Studio
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white dark:text-foreground">
            Designer Queue
          </h1>
          <p className="text-sm text-white/75 dark:text-muted-foreground mt-0.5">
            Manage and work through all incoming design requests.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STAT_CONFIG.map(({ status, label, icon: Icon, dot, value, text }) => (
          <div
            key={status}
            className="bg-card border border-border rounded-xs px-4 py-3 flex items-center gap-3"
          >
            <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", dot)} />
            <div>
              <p className={cn("text-lg font-bold leading-none", value)}>
                {counts[status]}
              </p>
              <p className={cn("text-xs mt-0.5", text)}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs + filter row */}
      <div className="flex items-end justify-between gap-3 flex-wrap border-b border-border pb-0">
        <div className="flex gap-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
                activeTab === id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="pb-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as DesignRequestStatus | "all")}
          >
            <SelectTrigger className="rounded-xs w-44 h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Request list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-xs">
          <ClipboardList className="w-9 h-9 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No requests in this queue</p>
          <p className="text-xs text-muted-foreground mt-1">
            {statusFilter !== "all" ? "Try changing the status filter." : "Check back later."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <Link
              key={req._id}
              href={`/designer/requests/${req._id}`}
              className="group block bg-card border border-border rounded-xs hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              <div className="px-4 py-4 flex items-center gap-4">
                {/* status bar */}
                <div
                  className={cn(
                    "w-1 self-stretch rounded-full shrink-0",
                    STATUS_BAR_COLOR[req.status]
                  )}
                />

                <div className="flex-1 min-w-0 space-y-1.5">
                  <p className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                    {req.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <RequestStatusBadge status={req.status} />
                    {req.storeName && (
                      <Badge variant="outline" className="rounded-xs text-xs">
                        {req.storeName}
                      </Badge>
                    )}
                    {req.productLine && (
                      <Badge variant="outline" className="rounded-xs text-xs">
                        {req.productLine}
                      </Badge>
                    )}
                    {req.revisionCount > 0 && (
                      <Badge
                        variant="outline"
                        className="rounded-xs text-xs text-orange-700 border-orange-300 bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:bg-orange-950/30"
                      >
                        {req.revisionCount} revision{req.revisionCount > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(req.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
