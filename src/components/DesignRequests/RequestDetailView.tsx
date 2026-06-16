"use client";

import { useRef, useState } from "react";
import {
  Download, AlertTriangle, FileText, CheckCircle2, RefreshCw, User, Calendar,
  ExternalLink, Upload, Loader2, Paperclip, MessageSquare, Image as ImageIcon,
  Star, StarOff, ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RequestStatusBadge } from "./RequestStatusBadge";
import { CommentThread } from "./CommentThread";
import { RequestRevisionModal } from "./RequestRevisionModal";
import { IDesignRequest, ICompletedFile, CommentAuthorRole } from "@/types/designRequests/designRequests";
import {
  useUploadRequestFilesMutation,
  useSelectVersionMutation,
} from "@/redux/api/DesignRequests/designRequestsApi";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function groupByVersion(files: ICompletedFile[]): Record<number, ICompletedFile[]> {
  return files.reduce<Record<number, ICompletedFile[]>>((acc, f) => {
    (acc[f.version] ??= []).push(f);
    return acc;
  }, {});
}

function isImage(fileName: string) {
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(fileName);
}

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
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [selectingVersion, setSelectingVersion] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFiles, { isLoading: isUploading }] = useUploadRequestFilesMutation();
  const [selectVersion] = useSelectVersionMutation();

  const showRevisionButton = isStore && (request.status === "completed" || request.status === "in-progress");

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

  async function handleSelectVersion(version: number) {
    setSelectingVersion(version);
    try {
      await selectVersion({ id: request._id, version }).unwrap();
      toast.success(`Version ${version} selected — the designer has been notified`);
    } catch {
      toast.error("Could not select version");
    }
    setSelectingVersion(null);
  }

  const versionGroups = groupByVersion(request.completedFiles);
  const versions = Object.keys(versionGroups).map(Number).sort((a, b) => b - a);
  const hasVersions = versions.length > 0;

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
            {request.selectedVersion
              ? `You selected Version ${request.selectedVersion}. Download your files below.`
              : "Your design is complete. Review the versions below and select the one you want."}
          </p>
        </div>
      )}

      {/* Meta card */}
      <div className="bg-card border border-border rounded-xs divide-y divide-border">
        <div className="px-4 py-3 flex flex-wrap gap-2">
          <RequestStatusBadge status={request.status} />
          <Badge variant="outline" className="rounded-xs text-xs capitalize">{request.requestType}</Badge>
          {request.format && <Badge variant="outline" className="rounded-xs text-xs">{request.format}</Badge>}
          {request.productLine && <Badge variant="secondary" className="rounded-xs text-xs">{request.productLine}</Badge>}
          {request.revisionCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-orange-600 bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 rounded-xs px-1.5 py-0.5">
              <RefreshCw className="w-2.5 h-2.5" />
              {request.revisionCount} revision{request.revisionCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="px-4 py-3 flex items-center gap-3 text-sm text-muted-foreground">
          <User className="w-3.5 h-3.5 shrink-0" />
          <span>Submitted by <span className="font-medium text-foreground">{request.submittedByName}</span></span>
          <span className="mx-1">·</span>
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>{new Date(request.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
        </div>
        <div className="px-4 py-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Description</p>
          <p className="text-sm leading-relaxed">{request.description}</p>
        </div>
      </div>

      {/* Reference files */}
      {(request.uploadedFiles.length > 0 || isStore || isAdmin) && (
        <div className="bg-card border border-border rounded-xs">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Reference Files</p>
              {request.uploadedFiles.length > 0 && (
                <Badge variant="outline" className="rounded-xs text-xs h-5">{request.uploadedFiles.length}</Badge>
              )}
            </div>
            {(isStore || isAdmin) && (
              <>
                <Button size="sm" variant="outline" className="rounded-xs h-7 text-xs gap-1.5 px-2.5" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                  {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {isUploading ? "Uploading…" : "Add Files"}
                </Button>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleReferenceUpload} />
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
            <div className="p-3">
              {/* Show images as thumbnails */}
              {(() => {
                const imgs = request.uploadedFiles.filter((f) => isImage(f.fileName));
                const docs = request.uploadedFiles.filter((f) => !isImage(f.fileName));
                return (
                  <>
                    {imgs.length > 0 && (
                      <div className={cn("grid gap-2 mb-2", imgs.length === 1 ? "grid-cols-1" : imgs.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
                        {imgs.map((f) => (
                          <div
                            key={f._id}
                            className="group relative aspect-square rounded-xs overflow-hidden border border-border cursor-pointer"
                            onClick={() => setLightboxUrl(f.url)}
                          >
                            <img src={f.url} alt={f.fileName} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {f.isConcept && (
                              <div className="absolute top-1.5 left-1.5 bg-purple-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                                AI Concept
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {docs.length > 0 && (
                      <ul className="divide-y divide-border">
                        {docs.map((f) => (
                          <li key={f._id} className="flex items-center gap-3 py-2.5">
                            <div className="w-8 h-8 rounded-xs bg-muted flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <span className="flex-1 text-sm truncate">{f.fileName}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <a href={f.url} target="_blank" rel="noopener noreferrer" title="Preview" className="w-7 h-7 flex items-center justify-center rounded-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                              <a href={f.url} download title="Download" className="w-7 h-7 flex items-center justify-center rounded-xs text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Versioned deliverables — visual gallery */}
      {hasVersions && (
        <div className="bg-card border border-border rounded-xs overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Deliverables</p>
              <Badge variant="outline" className="rounded-xs text-xs h-5">{versions.length} version{versions.length > 1 ? "s" : ""}</Badge>
            </div>
            {isStore && !request.selectedVersion && request.status !== "pending" && (
              <p className="text-[11px] text-muted-foreground">Select the version you want →</p>
            )}
          </div>
          <div className="p-4 space-y-6">
            {versions.map((v) => {
              const vFiles = versionGroups[v];
              const note = vFiles[0]?.versionNote;
              const isSelected = request.selectedVersion === v;
              const imageFiles = vFiles.filter((f) => isImage(f.fileName));
              const nonImageFiles = vFiles.filter((f) => !isImage(f.fileName));
              return (
                <div
                  key={v}
                  className={cn(
                    "rounded-xs border-2 overflow-hidden transition-all",
                    isSelected
                      ? "border-green-500 shadow-md shadow-green-500/10"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  {/* Version header */}
                  <div className={cn(
                    "px-4 py-2.5 flex items-center justify-between",
                    isSelected ? "bg-green-50 dark:bg-green-950/20" : "bg-muted/40"
                  )}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">Version {v}</span>
                      {isSelected && (
                        <Badge className="rounded-xs text-xs bg-green-600 text-white border-0 gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Selected
                        </Badge>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(vFiles[0].uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    {/* Store: select this version */}
                    {isStore && !isSelected && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xs h-7 text-xs gap-1.5 px-2.5 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        onClick={() => handleSelectVersion(v)}
                        disabled={selectingVersion === v}
                      >
                        {selectingVersion === v ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3" />}
                        Select This Version
                      </Button>
                    )}
                    {isStore && isSelected && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-xs h-7 text-xs gap-1.5 px-2.5 text-muted-foreground"
                        onClick={() => handleSelectVersion(0)}
                        disabled={selectingVersion === 0}
                      >
                        <StarOff className="w-3 h-3" />
                        Deselect
                      </Button>
                    )}
                  </div>

                  {/* Designer note */}
                  {note && (
                    <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-900 px-4 py-2.5">
                      <MessageSquare className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">{note}</p>
                    </div>
                  )}

                  {/* Image previews */}
                  {imageFiles.length > 0 && (
                    <div className={cn(
                      "grid gap-0.5",
                      imageFiles.length === 1 ? "grid-cols-1" : imageFiles.length === 2 ? "grid-cols-2" : "grid-cols-3"
                    )}>
                      {imageFiles.map((f) => (
                        <div
                          key={f._id}
                          className="group relative aspect-video bg-muted cursor-pointer overflow-hidden"
                          onClick={() => setLightboxUrl(f.url)}
                        >
                          <img src={f.url} alt={f.fileName} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                            <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent">
                            <span className="text-[10px] text-white truncate">{f.fileName}</span>
                            <a
                              href={f.url}
                              download
                              className="text-white hover:text-primary-foreground"
                              onClick={(e) => e.stopPropagation()}
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Non-image files */}
                  {nonImageFiles.length > 0 && (
                    <ul className="divide-y divide-border">
                      {nonImageFiles.map((f) => (
                        <li key={f._id} className="flex items-center gap-3 px-4 py-3">
                          <div className="w-8 h-8 rounded-xs bg-muted flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <span className="flex-1 text-sm truncate">{f.fileName}</span>
                          <a
                            href={f.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-primary hover:underline font-medium shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
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

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxUrl(null)}
        >
          <img src={lightboxUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-sm shadow-2xl" />
        </div>
      )}
    </div>
  );
}
