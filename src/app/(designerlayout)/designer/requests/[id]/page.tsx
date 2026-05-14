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
  Store,
  Calendar,
  RotateCcw,
  CheckCircle2,
  Palette,
  ExternalLink,
  User,
  Package,
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
import {
  DesignRequestStatus,
  ICompletedFile,
} from "@/types/designRequests/designRequests";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: DesignRequestStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in-progress", label: "In Progress" },
  { value: "revision-requested", label: "Revision Requested" },
  { value: "completed", label: "Completed" },
];

const TYPE_BADGE: Record<string, string> = {
  free: "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  paid: "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  inhouse:
    "bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
};

const STATUS_ACCENT: Record<DesignRequestStatus, string> = {
  pending: "border-l-gray-400",
  "in-progress": "border-l-blue-500",
  "revision-requested": "border-l-amber-500",
  completed: "border-l-green-500",
};

function groupByVersion(
  files: ICompletedFile[],
): Record<number, ICompletedFile[]> {
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
  const [updateStatus, { isLoading: isUpdatingStatus }] =
    useUpdateRequestStatusMutation();
  const [uploadCompleted, { isLoading: isUploading }] =
    useUploadCompletedFilesMutation();
  const [sendFiles, { isLoading: isSending }] = useSendFilesToStoreMutation();

  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  const request = data?.request;
  const versionGroups = request ? groupByVersion(request.completedFiles) : {};
  const versions = Object.keys(versionGroups)
    .map(Number)
    .sort((a, b) => b - a);
  const unsentCount =
    request?.completedFiles.filter((f) => !f.sent).length ?? 0;

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
      toast.success("Files uploaded successfully");
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
      prev.includes(fileId)
        ? prev.filter((x) => x !== fileId)
        : [...prev, fileId],
    );
  }

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
        <p className="text-sm font-medium text-muted-foreground">
          Request not found.
        </p>
        <Link
          href="/designer"
          className="text-xs text-primary hover:underline mt-2"
        >
          Back to queue
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Back nav */}
      <Link
        href="/designer"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to queue
      </Link>

      {/* ── Page header card ── */}
      <div
        className={cn(
          "bg-accent/80 dark:bg-linear-to-r dark:from-[#003049] dark:via-[#002838] dark:to-[#001d2e] border border-border rounded-xs overflow-hidden border-l-4",
          STATUS_ACCENT[request.status],
        )}
      >
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Left — identity */}
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xs bg-white/20 flex items-center justify-center shrink-0">
                <Palette className="w-4 h-4 text-accent-foreground dark:text-primary" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-accent-foreground/70 dark:text-primary">
                Design Request
              </span>
            </div>

            <h1 className="text-xl font-bold tracking-tight leading-snug text-accent-foreground dark:text-foreground">
              {request.description}
            </h1>

            {/* Badge cluster */}
            <div className="flex flex-wrap items-center gap-2">
              <RequestStatusBadge status={request.status} />
              <Badge
                variant="outline"
                className={cn(
                  "rounded-xs text-xs capitalize border",
                  TYPE_BADGE[request.requestType] ?? "",
                )}
              >
                {request.requestType}
              </Badge>
              {request.productLine && (
                <Badge
                  variant="outline"
                  className="rounded-xs text-xs bg-white/10 text-white border-white/20"
                >
                  {request.productLine}
                </Badge>
              )}
              {request.revisionCount > 0 && (
                <Badge
                  variant="outline"
                  className="rounded-xs text-xs bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800"
                >
                  <RotateCcw className="w-2.5 h-2.5 mr-1" />
                  {request.revisionCount} revision
                  {request.revisionCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-accent-foreground/75 dark:text-muted-foreground">
              {request.storeName && (
                <span className="flex items-center gap-1">
                  <Store className="w-3 h-3" />
                  {request.storeName}
                </span>
              )}
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {request.submittedByName}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(request.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Right — status control */}
          <div className="shrink-0 flex flex-col gap-2 sm:items-end">
            <p className="text-[11px] font-bold uppercase tracking-widest text-accent-foreground/75 dark:text-muted-foreground">
              Update Status
            </p>
            <Select
              value={request.status}
              onValueChange={handleStatusChange}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="rounded-xs w-48 h-9 text-sm border border-accent-foreground/20 dark:border-border bg-white/20 dark:bg-background text-accent-foreground dark:text-foreground">
                {isUpdatingStatus ? (
                  <span className="flex items-center gap-2 text-accent-foreground/70 dark:text-muted-foreground">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                  </span>
                ) : (
                  <SelectValue />
                )}
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Banners */}
      {request.status === "revision-requested" && (
        <div className="flex items-start gap-3 bg-amber-400/10 border border-amber-400/30 rounded-xs px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            The store has requested changes. Review the latest comment and
            upload a revised file.
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

      {/* ── 3-column workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {/* Col 1 — Brief */}
        <div className="bg-card border border-border rounded-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Brief
            </p>
          </div>
          <div className="divide-y divide-border">
            <div className="px-4 py-3">
              <p className="text-xs text-muted-foreground mb-1.5">
                Description
              </p>
              <p className="text-sm leading-relaxed">{request.description}</p>
            </div>
            {request.storeName && (
              <div className="px-4 py-3 flex items-center gap-2.5">
                <Store className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Store
                  </p>
                  <p className="text-sm font-medium">{request.storeName}</p>
                </div>
              </div>
            )}
            {request.productLine && (
              <div className="px-4 py-3 flex items-center gap-2.5">
                <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    Product Line
                  </p>
                  <p className="text-sm font-medium">{request.productLine}</p>
                </div>
              </div>
            )}
            <div className="px-4 py-3 flex items-center gap-2.5">
              <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Submitted By
                </p>
                <p className="text-sm font-medium">{request.submittedByName}</p>
              </div>
            </div>
            <div className="px-4 py-3 flex items-center gap-2.5">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Date
                </p>
                <p className="text-sm font-medium">
                  {new Date(request.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Col 2 — Reference files */}
        <div className="bg-card border border-border rounded-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Reference Files
            </p>
            {request.uploadedFiles.length > 0 && (
              <Badge variant="outline" className="rounded-xs text-xs h-5">
                {request.uploadedFiles.length}
              </Badge>
            )}
          </div>

          <div className="p-3">
            {request.uploadedFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-xs bg-muted flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No reference files
                </p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  The requester didn't attach any files.
                </p>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {request.uploadedFiles.map((f) => (
                  <li
                    key={f._id}
                    className="group flex items-center gap-2.5 bg-muted/40 hover:bg-muted/70 transition-colors rounded-xs px-3 py-2.5"
                  >
                    <div className="w-7 h-7 rounded-xs bg-background border border-border flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <span className="flex-1 text-sm truncate">
                      {f.fileName}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-6 h-6 rounded-xs flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                        title="Open"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href={f.url}
                        download
                        className="w-6 h-6 rounded-xs flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                        title="Download"
                      >
                        <Download className="w-3 h-3" />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Col 3 — Delivered files */}
        <div className="bg-card border border-border rounded-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Delivered Files
              </p>
              {unsentCount > 0 && (
                <Badge
                  variant="outline"
                  className="rounded-xs text-[10px] h-5 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30"
                >
                  {unsentCount} unsent
                </Badge>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="rounded-xs h-7 text-xs gap-1.5 px-2.5"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Upload className="w-3 h-3" />
              )}
              {isUploading ? "Uploading…" : "Upload"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <div className="p-3 space-y-4">
            {versions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-xs bg-muted flex items-center justify-center mb-3">
                  <Upload className="w-5 h-5 text-muted-foreground/50" />
                </div>
                <p className="text-sm text-muted-foreground">
                  No files uploaded yet
                </p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  Upload completed files to deliver.
                </p>
              </div>
            ) : (
              <>
                {versions.map((v) => (
                  <div key={v}>
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        v{v}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <ul className="space-y-1.5">
                      {versionGroups[v].map((f) => (
                        <li
                          key={f._id}
                          className={cn(
                            "group flex items-center gap-2.5 rounded-xs px-3 py-2.5 border transition-all",
                            f.sent
                              ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900"
                              : selectedFileIds.includes(f._id)
                                ? "bg-primary/5 border-primary cursor-pointer"
                                : "bg-muted/30 border-border hover:border-primary/50 cursor-pointer",
                          )}
                          onClick={() => !f.sent && toggleFile(f._id)}
                        >
                          {!f.sent && (
                            <input
                              type="checkbox"
                              checked={selectedFileIds.includes(f._id)}
                              onChange={() => toggleFile(f._id)}
                              className="rounded-xs shrink-0 accent-primary"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          <div
                            className={cn(
                              "w-6 h-6 rounded-xs flex items-center justify-center shrink-0",
                              f.sent
                                ? "bg-green-100 dark:bg-green-900/40"
                                : "bg-background border border-border",
                            )}
                          >
                            <FileText
                              className={cn(
                                "w-3 h-3",
                                f.sent
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-muted-foreground",
                              )}
                            />
                          </div>
                          <span className="flex-1 text-xs truncate">
                            {f.fileName}
                          </span>
                          {f.sent ? (
                            <Badge
                              variant="outline"
                              className="rounded-xs text-[10px] h-5 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30 shrink-0"
                            >
                              Sent
                            </Badge>
                          ) : (
                            <a
                              href={f.url}
                              download
                              className="w-6 h-6 rounded-xs flex items-center justify-center text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all shrink-0"
                              onClick={(e) => e.stopPropagation()}
                              title="Download"
                            >
                              <Download className="w-3 h-3" />
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {selectedFileIds.length > 0 && (
                  <Button
                    className="w-full rounded-xs gap-2 h-9"
                    onClick={handleSend}
                    disabled={isSending}
                  >
                    {isSending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    {isSending
                      ? "Sending…"
                      : `Send ${selectedFileIds.length} file${selectedFileIds.length > 1 ? "s" : ""} to Store`}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Comment thread — full width */}
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
