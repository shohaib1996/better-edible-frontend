"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Upload,
  Send,
  AlertTriangle,
  Loader2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RequestStatusBadge } from "@/components/DesignRequests/RequestStatusBadge";
import { CommentThread } from "@/components/DesignRequests/CommentThread";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useGetDesignRequestByIdQuery,
  useUpdateRequestStatusMutation,
  useUploadCompletedFilesMutation,
  useSendFilesToStoreMutation,
} from "@/redux/api/DesignRequests/designRequestsApi";
import { DesignRequestStatus, ICompletedFile } from "@/types/designRequests/designRequests";
import { toast } from "sonner";

const STATUS_OPTIONS: { value: DesignRequestStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "revision-requested", label: "Revision Requested" },
  { value: "completed", label: "Completed" },
];

function groupByVersion(files: ICompletedFile[]): Record<number, ICompletedFile[]> {
  return files.reduce<Record<number, ICompletedFile[]>>((acc, f) => {
    (acc[f.version] ??= []).push(f);
    return acc;
  }, {});
}

export default function DesignerRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [designerName, setDesignerName] = useState("");
  const [designerId, setDesignerId] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("better-user");
      const u = raw ? JSON.parse(raw) : null;
      if (!u?.id || u?.repType !== "designer") { router.replace("/login"); return; }
      setDesignerId(u.id);
      setDesignerName(u.name || u.loginName || "Designer");
    } catch { router.replace("/login"); }
  }, [router]);

  const { data, isLoading } = useGetDesignRequestByIdQuery(id, { skip: !id || !designerId });
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateRequestStatusMutation();
  const [uploadCompleted, { isLoading: isUploading }] = useUploadCompletedFilesMutation();
  const [sendFiles, { isLoading: isSending }] = useSendFilesToStoreMutation();

  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  const request = data?.request;
  const versionGroups = request ? groupByVersion(request.completedFiles) : {};
  const versions = Object.keys(versionGroups)
    .map(Number)
    .sort((a, b) => b - a);

  async function handleStatusChange(status: string) {
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("files", f));
    try {
      await uploadCompleted({ id, files: fd }).unwrap();
      toast.success("Files uploaded");
      e.target.value = "";
    } catch {
      toast.error("Upload failed");
    }
  }

  async function handleSend() {
    if (selectedFileIds.length === 0) return;
    try {
      await sendFiles({ id, fileIds: selectedFileIds }).unwrap();
      toast.success("Files sent to store");
      setSelectedFileIds([]);
    } catch {
      toast.error("Failed to send files");
    }
  }

  function toggleFile(fileId: string) {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((x) => x !== fileId) : [...prev, fileId]
    );
  }

  if (!designerId) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!request) {
    return <p className="text-sm text-muted-foreground py-10 text-center">Request not found.</p>;
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

      {/* Revision requested banner */}
      {request.status === "revision-requested" && (
        <div className="flex items-start gap-3 bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800">
            Store has requested changes. Review the latest comment and upload a revised file.
          </p>
        </div>
      )}

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Col 1 — Request info + status */}
        <div className="space-y-4">
          <div className="border border-border rounded-xs p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Request Info</p>

            <div className="flex flex-wrap gap-1.5">
              <RequestStatusBadge status={request.status} />
              <Badge variant="outline" className="rounded-xs text-xs capitalize">{request.requestType}</Badge>
              {request.productLine && (
                <Badge variant="secondary" className="rounded-xs text-xs">{request.productLine}</Badge>
              )}
            </div>

            {request.storeName && (
              <p className="text-sm">
                <span className="text-muted-foreground">Store: </span>
                <span className="font-medium">{request.storeName}</span>
              </p>
            )}

            <div>
              <p className="text-xs text-muted-foreground mb-1">Description</p>
              <p className="text-sm leading-relaxed">{request.description}</p>
            </div>

            <p className="text-xs text-muted-foreground">
              Submitted by <span className="font-medium">{request.submittedByName}</span>
              {" · "}
              {new Date(request.createdAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric",
              })}
            </p>

            {request.revisionCount > 0 && (
              <p className="text-xs text-orange-600 font-medium">
                {request.revisionCount} revision{request.revisionCount > 1 ? "s" : ""} requested
              </p>
            )}
          </div>

          {/* Status change */}
          <div className="border border-border rounded-xs p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Update Status</p>
            <Select
              value={request.status}
              onValueChange={handleStatusChange}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="rounded-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Col 2 — Uploaded reference files */}
        <div className="border border-border rounded-xs p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reference Files</p>
          {request.uploadedFiles.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reference files uploaded.</p>
          ) : (
            <ul className="space-y-1.5">
              {request.uploadedFiles.map((f) => (
                <li
                  key={f._id}
                  className="flex items-center gap-2 text-sm bg-muted/40 rounded-xs px-3 py-2"
                >
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
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
          )}
        </div>

        {/* Col 3 — Completed files + upload + send */}
        <div className="border border-border rounded-xs p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Completed Files
            </p>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xs h-7 text-xs"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              <Upload className="w-3.5 h-3.5 mr-1" />
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No completed files yet.</p>
          ) : (
            <div className="space-y-4">
              {versions.map((v) => (
                <div key={v}>
                  <p className="text-xs text-muted-foreground font-medium mb-1.5">Version {v}</p>
                  <ul className="space-y-1.5">
                    {versionGroups[v].map((f) => (
                      <li
                        key={f._id}
                        className={`flex items-center gap-2 text-sm rounded-xs px-3 py-2 border transition-colors cursor-pointer ${
                          selectedFileIds.includes(f._id)
                            ? "bg-primary/5 border-primary"
                            : "bg-muted/30 border-border hover:border-muted-foreground"
                        }`}
                        onClick={() => !f.sent && toggleFile(f._id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFileIds.includes(f._id)}
                          onChange={() => !f.sent && toggleFile(f._id)}
                          disabled={f.sent}
                          className="rounded-xs shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="flex-1 truncate">{f.fileName}</span>
                        {f.sent && (
                          <Badge variant="outline" className="rounded-xs text-xs text-green-700 border-green-300 bg-green-50 shrink-0">
                            Sent
                          </Badge>
                        )}
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {selectedFileIds.length > 0 && (
            <Button
              className="w-full rounded-xs"
              onClick={handleSend}
              disabled={isSending}
            >
              <Send className="w-4 h-4 mr-1.5" />
              {isSending ? "Sending..." : `Send Selected (${selectedFileIds.length})`}
            </Button>
          )}
        </div>
      </div>

      {/* Comment thread */}
      <div className="border-t border-border pt-5">
        <CommentThread
          requestId={request._id}
          comments={request.comments}
          authorId={designerId}
          authorName={designerName}
          authorRole="designer"
        />
      </div>
    </div>
  );
}
