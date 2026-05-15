"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle2, Loader2, FileText } from "lucide-react";
import { CommentThread } from "@/components/DesignRequests/CommentThread";
import { RequestHeaderCard } from "@/components/DesignRequests/RequestHeaderCard";
import { RequestBriefPanel } from "@/components/DesignRequests/RequestBriefPanel";
import { ReferenceFilesPanel } from "@/components/DesignRequests/ReferenceFilesPanel";
import { DeliveredFilesPanel } from "@/components/DesignRequests/DeliveredFilesPanel";
import { useGetDesignRequestByIdQuery } from "@/redux/api/DesignRequests/designRequestsApi";

export default function DesignerRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [designerName, setDesignerName] = useState("");
  const [designerId, setDesignerId] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("better-user");
      const u = raw ? JSON.parse(raw) : null;
      if (!u?.id || u?.repType !== "designer") {
        router.replace("/login");
        return;
      }
      setDesignerId(u.id);
      setDesignerName(u.name || u.loginName || "Designer");
    } catch {
      router.replace("/login");
    }
  }, [router]);

  const { data, isLoading } = useGetDesignRequestByIdQuery(id, {
    skip: !id || !designerId,
  });

  const request = data?.request;

  if (!designerId) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <FileText className="w-10 h-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Request not found.</p>
        <Link href="/designer" className="text-xs text-primary hover:underline mt-2">
          Back to queue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        href="/designer"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to queue
      </Link>

      <RequestHeaderCard request={request} />

      {request.status === "revision-requested" && (
        <div className="flex items-start gap-3 bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            The store has requested changes. Review the latest comment and upload a revised file.
          </p>
        </div>
      )}
      {request.status === "completed" && (
        <div className="flex items-start gap-3 bg-green-400/10 border border-green-400/30 rounded-xs px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
          <p className="text-sm text-green-800 dark:text-green-300">
            This request is marked complete.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <RequestBriefPanel request={request} />
        <ReferenceFilesPanel files={request.uploadedFiles} />
        <DeliveredFilesPanel requestId={request._id} files={request.completedFiles} />
      </div>

      <CommentThread
        requestId={request._id}
        comments={request.comments}
        authorId={designerId}
        authorName={designerName}
        authorRole="designer"
      />
    </div>
  );
}
