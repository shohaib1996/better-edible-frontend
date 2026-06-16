"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ClipboardList, ChevronRight, Calendar, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RequestStatusBadge } from "@/components/DesignRequests/RequestStatusBadge";
import { useGetMyDesignRequestsQuery } from "@/redux/api/DesignRequests/designRequestsApi";
import { getStoreUser } from "@/lib/storeUser";
import { IDesignRequest } from "@/types/designRequests/designRequests";

function RequestCard({ req }: { req: IDesignRequest }) {
  return (
    <Link
      href={`/store/design-requests/${req._id}`}
      className="group block bg-card border border-border rounded-xs hover:border-primary/40 hover:shadow-md transition-all duration-200"
    >
      <div className="px-4 py-4 flex items-center gap-4">
        {/* Status indicator bar */}
        <div className={`w-1 self-stretch rounded-full shrink-0 ${
          req.status === "completed" ? "bg-green-500" :
          req.status === "in-progress" ? "bg-amber-400" :
          req.status === "revision-requested" ? "bg-orange-500" :
          "bg-muted-foreground/30"
        }`} />

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors">
            {req.description}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            <RequestStatusBadge status={req.status} />
            <Badge variant="outline" className="rounded-xs text-xs capitalize">
              {req.requestType}
            </Badge>
            {req.productLine && (
              <Badge variant="secondary" className="rounded-xs text-xs">
                {req.productLine}
              </Badge>
            )}
            {req.revisionCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-600 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-xs px-1.5 py-0.5">
                <RefreshCw className="w-2.5 h-2.5" />
                {req.revisionCount} revision{req.revisionCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Right meta */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
}

export default function StoreDesignRequestsPage() {
  const [contactId, setContactId] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoreUser();
    if (user) setContactId(user.contactId);
  }, []);

  const { data, isLoading } = useGetMyDesignRequestsQuery(
    { contactId: contactId! },
    { skip: !contactId }
  );

  const requests = data?.requests ?? [];

  const counts = {
    pending: requests.filter((r) => r.status === "pending").length,
    inProgress: requests.filter((r) => r.status === "in-progress").length,
    revision: requests.filter((r) => r.status === "revision-requested").length,
    completed: requests.filter((r) => r.status === "completed").length,
  };

  return (
    <div className="space-y-6">
      {/* Hero strip */}
      <div className="rounded-xs overflow-hidden relative px-6 py-5 flex items-center justify-between gap-4 bg-linear-to-r from-primary to-secondary dark:from-[#003049] dark:via-[#002838] dark:to-[#001d2e] dark:border dark:border-border">
        <div className="absolute inset-0 opacity-15 dark:opacity-0 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)" }} />
        <div className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 10% 50%, rgba(247,127,0,0.15) 0%, transparent 60%)" }} />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-white/80 dark:text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/80 dark:text-primary">Design Studio</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white dark:text-foreground">My Design Requests</h1>
          <p className="text-sm text-white/75 dark:text-muted-foreground mt-0.5">
            {isLoading ? "Loading…" : `${requests.length} total request${requests.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="relative shrink-0">
          <Button asChild className="rounded-xs bg-white/20 hover:bg-white/30 text-white border border-white/30 dark:bg-primary dark:hover:bg-primary/90 dark:text-white dark:border-0 backdrop-blur-sm">
            <Link href="/store/design-requests/new">
              <Plus className="w-4 h-4 mr-1.5" />
              New Request
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats row */}
      {!isLoading && requests.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Pending", count: counts.pending, color: "text-muted-foreground", dot: "bg-muted-foreground/40" },
            { label: "In Progress", count: counts.inProgress, color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-400" },
            { label: "Revision", count: counts.revision, color: "text-orange-600 dark:text-orange-400", dot: "bg-orange-500" },
            { label: "Completed", count: counts.completed, color: "text-green-600 dark:text-green-400", dot: "bg-green-500" },
          ].map(({ label, count, color, dot }) => (
            <div key={label} className="bg-card border border-border rounded-xs px-4 py-3 flex items-center gap-3">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
              <div>
                <p className={`text-lg font-bold leading-none ${color}`}>{count}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xs px-4 py-4 flex items-center gap-4 animate-pulse">
              <div className="w-1 h-12 rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-muted rounded-xs w-2/3" />
                <div className="h-3 bg-muted rounded-xs w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xs bg-card">
          <div className="w-16 h-16 rounded-xs bg-muted flex items-center justify-center mb-4">
            <ClipboardList className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="font-semibold text-base">No design requests yet</p>
          <p className="text-muted-foreground text-sm mt-1">Submit your first request and our team will get started</p>
          <Button asChild className="rounded-xs mt-5">
            <Link href="/store/design-requests/new">
              <Plus className="w-4 h-4 mr-1.5" />
              Submit a Request
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {requests.map((req) => (
            <RequestCard key={req._id} req={req} />
          ))}
        </div>
      )}
    </div>
  );
}
