"use client";

import { useRef, useState } from "react";
import { Download, AlertTriangle, FileText, CheckCircle2, RefreshCw, User, Calendar, ExternalLink, Upload, Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { CommentThread } from "./CommentThread";
import { RequestRevisionModal } from "./RequestRevisionModal";
import { IDesignRequest, CommentAuthorRole } from "@/types/designRequests/designRequests";
import { useUploadRequestFilesMutation } from "@/redux/api/DesignRequests/designRequestsApi";
import { toast } from "sonner";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFiles, { isLoading: isUploading }] = useUploadRequestFilesMutation();

  const showRevisionButton = isStore && request.status === "completed";

  async function handleReferenceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    try {
      await uploadFiles({ id: request._id, files: fd }).unwrap();
      toast.success("Reference files uploaded");
      e.target.value = "";
    } catch {
      toast.error("Upload failed");
    }
  }

  return (
    <div className="space-y-4">
      {/* Revision requested banner */}
      {request.status === "revision-requested" && (
        <div className="flex items-start gap-3 bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            You've requested changes. Our designer will review and upload a revised file shortly.
          </p>
        </div>
      )}

      {/* Completed banner */}
      {request.status === "completed" && (
        <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/20 rounded-xs px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
          <p className="text-sm text-green-800 dark:text-green-300">
            Your design is complete. Download the files below or request changes if needed.
          </p>
        </div>
      )}

      {/* Meta card */}
      <div className="bg-card border border-border rounded-xs divide-y divide-border">
        {/* Badges row */}
        <div className="px-4 py-3 flex flex-wrap gap-2">
          <RequestStatusBadge status={request.status} />
          <Badge variant="outline" className="rounded-xs text-xs capitalize">{request.requestType}</Badge>
          {request.productLine && (
            <Badge variant="secondary" className="rounded-xs text-xs">{request.productLine}</Badge>
          )}
          {request.revisionCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-600 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-xs px-1.5 py-0.5">
              <RefreshCw className="w-2.5 h-2.5" />
              {request.revisionCount} revision{request.revisionCount > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Submitted by */}
        <div className="px-4 py-3 flex items-center gap-3 text-sm text-muted-foreground">
          <User className="w-3.5 h-3.5 shrink-0" />
          <span>Submitted by <span className="font-medium text-foreground">{request.submittedByName}</span></span>
          <span className="mx-1">·</span>
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>{new Date(request.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
        </div>

        {/* Description */}
        <div className="px-4 py-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Description</p>
          <p className="text-sm leading-relaxed">{request.description}</p>
        </div>
      </div>

      {/* Reference files */}
      {(request.uploadedFiles.length > 0 || isStore) && (
        <div className="bg-card border border-border rounded-xs">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Reference Files</p>
              {request.uploadedFiles.length > 0 && (
                <Badge variant="outline" className="rounded-xs text-xs h-5">{request.uploadedFiles.length}</Badge>
              )}
            </div>
            {isStore && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xs h-7 text-xs gap-1.5 px-2.5"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Upload className="w-3 h-3" />
                  }
                  {isUploading ? "Uploading…" : "Add Files"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleReferenceUpload}
                />
              </>
            )}
          </div>
          {request.uploadedFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Paperclip className="w-7 h-7 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No reference files yet</p>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Upload files to help the designer understand your request.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {request.uploadedFiles.map((f) => (
                <li key={f._id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-xs bg-muted flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="flex-1 text-sm truncate">{f.fileName}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Preview"
                      className="w-7 h-7 flex items-center justify-center rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={f.url}
                      download
                      title="Download"
                      className="w-7 h-7 flex items-center justify-center rounded-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Completed files */}
      {request.completedFiles.length > 0 && (
        <div className="bg-card border border-green-200 dark:border-green-900 rounded-xs">
          <div className="px-4 py-3 border-b border-green-200 dark:border-green-900 bg-green-50/60 dark:bg-green-950/20 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            <p className="text-[11px] font-bold uppercase tracking-widest text-green-700 dark:text-green-400">Completed Files</p>
          </div>
          <ul className="divide-y divide-border">
            {request.completedFiles.map((f) => (
              <li key={f._id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-xs bg-green-100 dark:bg-green-950/40 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span className="flex-1 text-sm truncate">{f.fileName}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="outline" className="rounded-xs text-xs">v{f.version}</Badge>
                  {f.sent && (
                    <Badge variant="outline" className="rounded-xs text-xs text-green-700 dark:text-green-400 border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/40">
                      Sent
                    </Badge>
                  )}
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Request changes button */}
      {showRevisionButton && (
        <Button
          variant="outline"
          className="rounded-xs w-full border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 gap-2"
          onClick={() => setRevisionOpen(true)}
        >
          <RefreshCw className="w-4 h-4" />
          Request Changes
        </Button>
      )}

      {/* Comment thread */}
      <CommentThread
        requestId={request._id}
        comments={request.comments}
        authorId={authorId}
        authorName={authorName}
        authorRole={authorRole}
      />

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
