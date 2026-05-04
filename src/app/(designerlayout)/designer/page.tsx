"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RequestStatusBadge } from "@/components/DesignRequests/RequestStatusBadge";
import { useGetDesignRequestsQuery } from "@/redux/api/DesignRequests/designRequestsApi";
import {
  DesignRequestType,
  DesignRequestStatus,
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

export default function DesignerQueuePage() {
  const [activeTab, setActiveTab] = useState<QueueTab>("inhouse");
  const [statusFilter, setStatusFilter] = useState<DesignRequestStatus | "all">("all");

  const { data, isLoading } = useGetDesignRequestsQuery({
    queue: activeTab,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
  });

  const requests = data?.requests ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Design Queue</h1>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as DesignRequestStatus | "all")}
        >
          <SelectTrigger className="rounded-xs w-44 h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
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

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-xs">
          <ClipboardList className="w-9 h-9 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No requests in this queue</p>
        </div>
      ) : (
        <div className="border border-border rounded-xs overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Store</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Product Line</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.map((req) => (
                <tr key={req._id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-muted-foreground truncate max-w-[120px] block">
                      {req.storeName || req.submittedByName}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="truncate">{req.description}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {req.productLine ? (
                      <Badge variant="outline" className="rounded-xs text-xs">{req.productLine}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {new Date(req.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <RequestStatusBadge status={req.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/designer/requests/${req._id}`}
                      className="text-xs font-medium text-primary hover:underline underline-offset-2"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
