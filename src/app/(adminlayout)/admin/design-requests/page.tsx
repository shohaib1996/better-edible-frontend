"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ClipboardList, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RequestStatusBadge } from "@/components/DesignRequests/RequestStatusBadge";
import { DesignRequestForm } from "@/components/DesignRequests/DesignRequestForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGetDesignRequestsQuery } from "@/redux/api/DesignRequests/designRequestsApi";
import { DesignRequestType, DesignRequestStatus } from "@/types/designRequests/designRequests";
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

export default function AdminDesignRequestsPage() {
  const [activeTab, setActiveTab] = useState<QueueTab>("inhouse");
  const [statusFilter, setStatusFilter] = useState<DesignRequestStatus | "all">("all");
  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [adminId, setAdminId] = useState("");
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("better-user");
      const u = raw ? JSON.parse(raw) : null;
      if (u) { setAdminId(u.id || ""); setAdminName(u.name || "Admin"); }
    } catch {}
  }, []);

  const { data, isLoading } = useGetDesignRequestsQuery({
    queue: activeTab,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
  });

  const requests = data?.requests ?? [];

  return (
    <div className="p-6 space-y-5 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Design Requests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{requests.length} in current view</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as DesignRequestStatus | "all")}
          >
            <SelectTrigger className="rounded-xs w-44 h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button className="rounded-xs" onClick={() => setNewRequestOpen(true)}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Internal Request
          </Button>
        </div>
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
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xs" />
          ))}
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
                  <td className="px-4 py-3 hidden sm:table-cell text-muted-foreground truncate max-w-[120px]">
                    {req.storeName || req.submittedByName}
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
                    {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3">
                    <RequestStatusBadge status={req.status} />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/design-requests/${req._id}`}
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

      {/* New Internal Request Modal */}
      <Dialog open={newRequestOpen} onOpenChange={setNewRequestOpen}>
        <DialogContent className="max-w-lg rounded-xs">
          <DialogHeader>
            <DialogTitle>New Internal Request</DialogTitle>
          </DialogHeader>
          <DesignRequestForm
            source="admin"
            submittedBy={adminId}
            submittedByName={adminName}
            forcedType="inhouse"
            allowTypeToggle={false}
            onSuccess={() => setNewRequestOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
