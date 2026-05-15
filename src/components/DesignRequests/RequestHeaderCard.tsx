"use client";

import { Loader2, Palette, Store, User, Calendar, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RequestStatusBadge } from "./RequestStatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateRequestStatusMutation } from "@/redux/api/DesignRequests/designRequestsApi";
import { IDesignRequest, DesignRequestStatus } from "@/types/designRequests/designRequests";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: DesignRequestStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "revision-requested", label: "Revision Requested" },
  { value: "completed", label: "Completed" },
];

const TYPE_BADGE: Record<string, string> = {
  free: "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  paid: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  inhouse: "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
};

const STATUS_ACCENT: Record<DesignRequestStatus, string> = {
  pending: "border-l-gray-400",
  "in-progress": "border-l-blue-500",
  "revision-requested": "border-l-amber-500",
  completed: "border-l-green-500",
};

interface RequestHeaderCardProps {
  request: IDesignRequest;
}

export function RequestHeaderCard({ request }: RequestHeaderCardProps) {
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateRequestStatusMutation();

  async function handleStatusChange(status: string) {
    try {
      await updateStatus({ id: request._id, status }).unwrap();
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  }

  return (
    <div
      className={cn(
        "bg-accent/80 dark:bg-linear-to-r dark:from-[#003049] dark:via-[#002838] dark:to-[#001d2e] border border-border rounded-xs overflow-hidden border-l-4",
        STATUS_ACCENT[request.status],
      )}
    >
      <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-start gap-4">
        {/* Left — identity */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xs bg-white/20 flex items-center justify-center shrink-0">
              <Palette className="w-4 h-4 text-accent-foreground dark:text-primary" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-accent-foreground/70 dark:text-primary">
              Design Request
            </span>
          </div>

          <h1 className="text-xl font-bold tracking-tight leading-snug text-accent-foreground dark:text-foreground">
            {request.description}
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            <RequestStatusBadge status={request.status} />
            <Badge
              variant="outline"
              className={cn("rounded-xs text-xs capitalize border", TYPE_BADGE[request.requestType] ?? "")}
            >
              {request.requestType}
            </Badge>
            {request.productLine && (
              <Badge variant="outline" className="rounded-xs text-xs bg-white/10 text-white border-white/20">
                {request.productLine}
              </Badge>
            )}
            {request.revisionCount > 0 && (
              <Badge
                variant="outline"
                className="rounded-xs text-xs bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800"
              >
                <RotateCcw className="w-2.5 h-2.5 mr-1" />
                {request.revisionCount} revision{request.revisionCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-accent-foreground/75 dark:text-muted-foreground">
            {request.storeName && (
              <span className="flex items-center gap-1">
                <Store className="w-3 h-3" />
                {request.storeName}
              </span>
            )}
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {request.submittedByName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(request.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* Right — status control */}
        <div className="shrink-0 flex flex-col gap-2 sm:items-end">
          <p className="text-[11px] font-bold uppercase tracking-widest text-accent-foreground/75 dark:text-muted-foreground">
            Update Status
          </p>
          <Select value={request.status} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
            <SelectTrigger className="rounded-xs w-48 h-9 text-sm border border-accent-foreground/20 dark:border-border bg-white/20 dark:bg-background text-accent-foreground dark:text-foreground">
              {isUpdatingStatus ? (
                <span className="flex items-center gap-2 text-accent-foreground/70 dark:text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                </span>
              ) : (
                <SelectValue />
              )}
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
    </div>
  );
}
