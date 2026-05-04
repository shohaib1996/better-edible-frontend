"use client";

import { useState } from "react";
import { Download, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { CommentThread } from "./CommentThread";
import { RequestRevisionModal } from "./RequestRevisionModal";
import { IDesignRequest, CommentAuthorRole } from "@/types/designRequests/designRequests";

interface RequestDetailViewProps {
  request: IDesignRequest;
  isDesigner?: boolean;
  isAdmin?: boolean;
  isStore?: boolean;
  authorId: string;
  authorName: string;
  authorRole: CommentAuthorRole;
}

export function RequestDetailView({
  request,
  isDesigner,
  isAdmin,
  isStore,
  authorId,
  authorName,
  authorRole,
}: RequestDetailViewProps) {
  const [revisionOpen, setRevisionOpen] = useState(false);

  const showRevisionButton =
    isStore && request.status === "completed";

  return (
    <div className="space-y-6">
      {/* Revision requested banner */}
      {request.status === "revision-requested" && (
        <div className="flex items-start gap-3 bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            Store has requested changes. Please review the latest comment and upload a revised file.
          </p>
        </div>
      )}

      {/* Request info */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <RequestStatusBadge status={request.status} />
          <Badge variant="outline" className="rounded-xs text-xs capitalize">{request.requestType}</Badge>
          <Badge variant="secondary" className="rounded-xs text-xs capitalize">{request.source}</Badge>
          {request.productLine && (
            <Badge variant="outline" className="rounded-xs text-xs">{request.productLine}</Badge>
          )}
        </div>

        {request.storeName && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Store:</span> {request.storeName}
          </p>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Description</p>
          <p className="text-sm leading-relaxed">{request.description}</p>
        </div>

        <p className="text-xs text-muted-foreground">
          Submitted by <span className="font-medium">{request.submittedByName}</span> on{" "}
          {new Date(request.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          {request.revisionCount > 0 && (
            <span className="ml-2 text-orange-600">· {request.revisionCount} revision{request.revisionCount > 1 ? "s" : ""} requested</span>
          )}
        </p>
      </div>

      {/* Uploaded reference files */}
      {request.uploadedFiles.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Reference Files</p>
          <ul className="space-y-1.5">
            {request.uploadedFiles.map((f) => (
              <li key={f._id} className="flex items-center gap-2 text-sm bg-muted/40 rounded-xs px-3 py-2">
                <span className="flex-1 truncate">{f.fileName}</span>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Download className="w-4 h-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Completed files */}
      {request.completedFiles.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Completed Files</p>
          <ul className="space-y-1.5">
            {request.completedFiles.map((f) => (
              <li key={f._id} className="flex items-center gap-2 text-sm bg-green-50 border border-green-200 rounded-xs px-3 py-2">
                <span className="flex-1 truncate">{f.fileName}</span>
                {f.sent && (
                  <Badge variant="outline" className="rounded-xs text-xs text-green-700 border-green-300 bg-green-50">
                    Sent
                  </Badge>
                )}
                <Badge variant="outline" className="rounded-xs text-xs">v{f.version}</Badge>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Download className="w-4 h-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Revision button for store */}
      {showRevisionButton && (
        <Button
          variant="outline"
          className="rounded-xs border-orange-300 text-orange-700 hover:bg-orange-50"
          onClick={() => setRevisionOpen(true)}
        >
          Request Changes
        </Button>
      )}

      {/* Comment thread */}
      <div className="border-t border-border pt-5">
        <CommentThread
          requestId={request._id}
          comments={request.comments}
          authorId={authorId}
          authorName={authorName}
          authorRole={authorRole}
        />
      </div>

      <RequestRevisionModal
        open={revisionOpen}
        onClose={() => setRevisionOpen(false)}
        requestId={request._id}
        authorId={authorId}
        authorName={authorName}
        authorRole={authorRole}
      />
    </div>
  );
}
