"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2, ClipboardList, Calendar, RotateCcw, CheckCircle2, Clock, Image as ImageIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { RequestStatusBadge } from "@/components/DesignRequests/RequestStatusBadge";
import { useGetDesignRequestsQuery } from "@/redux/api/DesignRequests/designRequestsApi";
import type { DesignRequestStatus, DesignRequestType, IDesignRequest } from "@/types/designRequests/designRequests";
import { cn } from "@/lib/utils";

const TABS: { id: DesignRequestType | "completed"; label: string }[] = [
  { id: "inhouse", label: "In-House" },
  { id: "free", label: "Free" },
  { id: "paid", label: "Paid" },
  { id: "completed", label: "Completed" },
];

const STATUS_OPTIONS: { value: DesignRequestStatus | "all"; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "revision-requested", label: "Revision Requested" },
];

const STATUS_RING: Record<DesignRequestStatus, string> = {
  pending: "ring-amber-400/60",
  "in-progress": "ring-blue-400/60",
  "revision-requested": "ring-orange-500/80",
  completed: "ring-green-400/60",
};

const STATUS_OVERLAY: Record<DesignRequestStatus, string> = {
  pending: "from-amber-950/40",
  "in-progress": "from-blue-950/40",
  "revision-requested": "from-orange-950/60",
  completed: "from-green-950/40",
};

/** Return the best thumbnail URL for a request */
function getThumbnail(req: IDesignRequest): string | null {
  // Prefer concept image first
  const concept = req.uploadedFiles?.find((f) => f.isConcept);
  if (concept) return concept.url;
  // Then latest delivered file that looks like an image
  const imgs = [...(req.completedFiles ?? [])].sort((a, b) => b.version - a.version);
  for (const f of imgs) {
    if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f.fileName)) return f.url;
  }
  // Then any uploaded reference image
  for (const f of req.uploadedFiles ?? []) {
    if (/\.(png|jpg|jpeg|gif|webp|svg)$/i.test(f.fileName)) return f.url;
  }
  return null;
}

export default function DesignerQueuePage() {
  const router = useRouter();
  const [designerId, setDesignerId] = useState("");
  const [activeTab, setActiveTab] = useState<DesignRequestType | "completed">("inhouse");
  const [statusFilter, setStatusFilter] = useState<DesignRequestStatus | "all">("all");
  const [page, setPage] = useState(1);
  const limit = 24;

  useEffect(() => {
    try {
      const raw = localStorage.getItem("better-user");
      const u = raw ? JSON.parse(raw) : null;
      if (!u?.id || u?.repType !== "designer") { router.replace("/login"); return; }
      setDesignerId(u.id);
    } catch { router.replace("/login"); }
  }, [router]);

  const isCompletedTab = activeTab === "completed";

  const queryParams = isCompletedTab
    ? { status: "completed" as DesignRequestStatus, page, limit }
    : {
        queue: activeTab as DesignRequestType,
        ...(statusFilter !== "all" ? { status: statusFilter } : { excludeStatus: "completed" as DesignRequestStatus }),
        page,
        limit,
      };

  const { data, isLoading } = useGetDesignRequestsQuery(queryParams, { skip: !designerId });
  const requests = data?.requests ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = data?.pages ?? 1;

  // Separate counts per tab (non-completed only)
  const { data: inhouseData } = useGetDesignRequestsQuery({ queue: "inhouse", excludeStatus: "completed", limit: 1 }, { skip: !designerId });
  const { data: freeData } = useGetDesignRequestsQuery({ queue: "free", excludeStatus: "completed", limit: 1 }, { skip: !designerId });
  const { data: paidData } = useGetDesignRequestsQuery({ queue: "paid", excludeStatus: "completed", limit: 1 }, { skip: !designerId });
  const tabCounts: Record<string, number> = {
    inhouse: inhouseData?.total ?? 0,
    free: freeData?.total ?? 0,
    paid: paidData?.total ?? 0,
    completed: 0,
  };

  function handleTabChange(tab: DesignRequestType | "completed") {
    setActiveTab(tab);
    setStatusFilter("all");
    setPage(1);
  }

  if (!designerId) return null;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight">Design Queue</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Visual workspace — click any card to open the request</p>
      </div>

      {/* Tabs + filter row */}
      <div className="flex items-end justify-between border-b border-border">
        <div className="flex items-end gap-0">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2",
                activeTab === id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
              {id !== "completed" && tabCounts[id] > 0 && (
                <span className={cn(
                  "inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold",
                  activeTab === id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  {tabCounts[id]}
                </span>
              )}
            </button>
          ))}
        </div>
        {!isCompletedTab && (
          <div className="pb-2">
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v as DesignRequestStatus | "all"); setPage(1); }}>
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
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xs">
          <ClipboardList className="w-9 h-9 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-muted-foreground">No requests in this queue</p>
          <p className="text-xs text-muted-foreground mt-1">
            {statusFilter !== "all" ? "Try changing the status filter." : "Check back later."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
            {requests.map((req) => {
              const thumb = getThumbnail(req);
              const latestVersion = req.completedFiles?.length
                ? Math.max(...req.completedFiles.map((f) => f.version))
                : 0;
              return (
                <Link
                  key={req._id}
                  href={`/designer/requests/${req._id}`}
                  className={cn(
                    "group relative flex flex-col rounded-sm overflow-hidden border-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl",
                    STATUS_RING[req.status],
                  )}
                >
                  {/* Thumbnail area */}
                  <div className="relative aspect-square bg-muted overflow-hidden">
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={req.description}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-muted/50">
                        <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                        <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">No preview</span>
                      </div>
                    )}
                    {/* Gradient overlay at bottom */}
                    <div className={cn("absolute inset-0 bg-gradient-to-t to-transparent opacity-70", STATUS_OVERLAY[req.status])} />
                    {/* Status badge top-right */}
                    <div className="absolute top-2 right-2">
                      <RequestStatusBadge status={req.status} />
                    </div>
                    {/* Version badge top-left */}
                    {latestVersion > 0 && (
                      <div className="absolute top-2 left-2">
                        <span className="text-[10px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded-sm">
                          v{latestVersion}
                        </span>
                      </div>
                    )}
                    {/* Revision warning */}
                    {req.status === "revision-requested" && (
                      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1 bg-orange-500/90 text-white text-[10px] font-bold px-2 py-1 rounded-sm">
                        <RotateCcw className="w-2.5 h-2.5 shrink-0" />
                        Revision requested
                      </div>
                    )}
                    {req.status === "completed" && req.selectedVersion && (
                      <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1 bg-green-600/90 text-white text-[10px] font-bold px-2 py-1 rounded-sm">
                        <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                        v{req.selectedVersion} selected
                      </div>
                    )}
                  </div>

                  {/* Info strip */}
                  <div className="bg-card px-2.5 py-2 space-y-1">
                    <p className="text-xs font-semibold line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                      {req.description}
                    </p>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] text-muted-foreground truncate">
                        {req.storeName ?? req.submittedByName ?? "—"}
                      </span>
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground shrink-0">
                        <Clock className="w-2.5 h-2.5" />
                        {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    {req.productLine && (
                      <Badge variant="outline" className="rounded-xs text-[10px] h-4 px-1">{req.productLine}</Badge>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
          <GlobalPagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={limit}
            onPageChange={setPage}
            onLimitChange={() => {}}
            limitOptions={[24]}
          />
        </>
      )}
    </div>
  );
}
