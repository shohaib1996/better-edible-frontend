"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { RequestDetailView } from "@/components/DesignRequests/RequestDetailView";
import { RequestStatusBadge } from "@/components/DesignRequests/RequestStatusBadge";
import { useGetDesignRequestByIdQuery } from "@/redux/api/DesignRequests/designRequestsApi";

function SkeletonDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-xs border border-border bg-card px-6 py-5 space-y-3">
        <div className="h-4 bg-muted rounded-xs w-1/4" />
        <div className="h-6 bg-muted rounded-xs w-2/3" />
        <div className="h-3 bg-muted rounded-xs w-1/3" />
      </div>
      <div className="rounded-xs border border-border bg-card px-6 py-5 space-y-3">
        <div className="h-3 bg-muted rounded-xs w-1/5" />
        <div className="h-4 bg-muted rounded-xs w-full" />
        <div className="h-4 bg-muted rounded-xs w-4/5" />
      </div>
      <div className="rounded-xs border border-border bg-card px-6 py-5 space-y-3">
        <div className="h-3 bg-muted rounded-xs w-1/5" />
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-muted rounded-xs" />
        ))}
      </div>
    </div>
  );
}

export default function AdminDesignRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [adminId, setAdminId] = useState("");
  const [adminName, setAdminName] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("better-user");
      const u = raw ? JSON.parse(raw) : null;
      if (u) {
        setAdminId(u.id || "");
        setAdminName(u.name || "Admin");
      }
    } catch {}
  }, []);

  const { data, isLoading } = useGetDesignRequestByIdQuery(id, { skip: !id });
  const request = data?.request;

  return (
    <div className="space-y-5 p-6">
      {/* Back */}
      <Link
        href="/admin/design-requests"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to requests
      </Link>

      {/* Hero strip */}
      <div className="rounded-xs overflow-hidden relative px-6 py-5 bg-linear-to-r from-primary to-secondary dark:from-[#003049] dark:via-[#002838] dark:to-[#001d2e] dark:border dark:border-border">
        <div
          className="absolute inset-0 opacity-15 dark:opacity-0 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 50%, #fff 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-0 dark:opacity-100 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 10% 50%, rgba(247,127,0,0.15) 0%, transparent 60%)",
          }}
        />
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-white/80 dark:text-primary" />
            <span className="text-xs font-semibold uppercase tracking-widest text-white/80 dark:text-primary">
              Design Request
            </span>
          </div>
          {isLoading || !request ? (
            <div className="h-6 bg-white/20 rounded-xs w-1/2 animate-pulse" />
          ) : (
            <>
              <p className="text-white dark:text-foreground font-bold text-lg leading-snug line-clamp-2">
                {request.description}
              </p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <RequestStatusBadge status={request.status} />
                {request.storeName && (
                  <span className="text-xs text-white/70 dark:text-muted-foreground">
                    {request.storeName}
                  </span>
                )}
                <span className="text-xs text-white/50 dark:text-muted-foreground/60 capitalize">
                  {request.requestType}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <SkeletonDetail />
      ) : !request ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-xs">
          <p className="font-semibold">Request not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            This request may have been removed.
          </p>
        </div>
      ) : (
        <RequestDetailView
          request={request}
          isAdmin
          authorId={adminId}
          authorName={adminName}
          authorRole="admin"
        />
      )}
    </div>
  );
}
