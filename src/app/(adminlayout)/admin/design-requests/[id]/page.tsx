"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { RequestDetailView } from "@/components/DesignRequests/RequestDetailView";
import { useGetDesignRequestByIdQuery } from "@/redux/api/DesignRequests/designRequestsApi";

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
      if (u) { setAdminId(u.id || ""); setAdminName(u.name || "Admin"); }
    } catch {}
  }, []);

  const { data, isLoading } = useGetDesignRequestByIdQuery(id, { skip: !id });
  const request = data?.request;

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <Link
        href="/admin/design-requests"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to requests
      </Link>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !request ? (
        <p className="text-sm text-muted-foreground py-10 text-center">Request not found.</p>
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
