"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RequestStatusBadge } from "@/components/DesignRequests/RequestStatusBadge";
import { Badge } from "@/components/ui/badge";
import { useGetMyDesignRequestsQuery } from "@/redux/api/DesignRequests/designRequestsApi";
import { getStoreUser } from "@/lib/storeUser";

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

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">My Design Requests</h1>
        <Button asChild className="rounded-xs">
          <Link href="/store/design-requests/new">
            <Plus className="w-4 h-4 mr-1.5" />
            New Request
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xs" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-xs">
          <ClipboardList className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">No design requests yet</p>
          <Button asChild variant="outline" size="sm" className="rounded-xs mt-3">
            <Link href="/store/design-requests/new">Submit your first request</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <Link
              key={req._id}
              href={`/store/design-requests/${req._id}`}
              className="block border border-border rounded-xs px-4 py-3 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{req.description}</p>
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
                      <Badge variant="outline" className="rounded-xs text-xs text-orange-700 border-orange-300 bg-orange-50">
                        {req.revisionCount} revision{req.revisionCount > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground shrink-0 mt-0.5">
                  {new Date(req.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
