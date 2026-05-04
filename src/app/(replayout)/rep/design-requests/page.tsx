"use client";

import { useState } from "react";
import { ClipboardList } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DesignRequestForm } from "@/components/DesignRequests/DesignRequestForm";
import { RequestStatusBadge } from "@/components/DesignRequests/RequestStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetMyDesignRequestsQuery } from "@/redux/api/DesignRequests/designRequestsApi";
import { useUser } from "@/redux/hooks/useAuth";

export default function RepDesignRequestsPage() {
  const user = useUser();
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading } = useGetMyDesignRequestsQuery(
    { contactId: user?.id ?? "" },
    { skip: !user?.id }
  );

  const requests = data?.requests ?? [];

  if (user === undefined) {
    return (
      <div className="p-6 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xs" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Design Requests</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Submit internal design requests and track their status</p>
      </div>

      {/* Submit form */}
      <Card className="rounded-xs border border-border/50">
        <CardHeader>
          <CardTitle className="text-base">New Internal Request</CardTitle>
          <CardDescription>Submit a design request on behalf of a store or for internal use.</CardDescription>
        </CardHeader>
        <CardContent>
          <DesignRequestForm
            source="rep"
            submittedBy={user?.id ?? ""}
            submittedByName={user?.name ?? ""}
            forcedType="inhouse"
            allowTypeToggle={false}
            onSuccess={() => setSubmitted(true)}
          />
          {submitted && (
            <p className="text-sm text-green-700 mt-3 font-medium">Request submitted successfully.</p>
          )}
        </CardContent>
      </Card>

      {/* My submissions */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">My Submissions</h2>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xs" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-xs">
            <ClipboardList className="w-8 h-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No submissions yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => (
              <div
                key={req._id}
                className="border border-border rounded-xs px-4 py-3 space-y-1.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium line-clamp-1">{req.description}</p>
                  <p className="text-xs text-muted-foreground shrink-0">
                    {new Date(req.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <RequestStatusBadge status={req.status} />
                  <Badge variant="outline" className="rounded-xs text-xs capitalize">
                    {req.requestType}
                  </Badge>
                  {req.revisionCount > 0 && (
                    <Badge variant="outline" className="rounded-xs text-xs text-orange-700 border-orange-300 bg-orange-50">
                      {req.revisionCount} revision{req.revisionCount > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
