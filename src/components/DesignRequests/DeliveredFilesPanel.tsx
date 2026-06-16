"use client";
import { useRef, useState } from "react";
import {
  Upload, Download, Loader2, FileText, Trash2, Image as ImageIcon,
  MessageSquare, CheckCircle2, ZoomIn, Sparkles, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useUploadCompletedFilesMutation,
  useDeleteCompletedFileMutation,
} from "@/redux/api/DesignRequests/designRequestsApi";
import { ICompletedFile } from "@/types/designRequests/designRequests";
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

interface DeliveredFilesPanelProps {
  requestId: string;
  files: ICompletedFile[];
  selectedVersion?: number | null;
}

export function DeliveredFilesPanel({ requestId, files, selectedVersion }: DeliveredFilesPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [versionNote, setVersionNote] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const versionGroups = groupByVersion(files);
  const versions = Object.keys(versionGroups).map(Number).sort((a, b) => b - a);
  const latestVersion = versions[0] ?? 0;

  const [expandedVersions, setExpandedVersions] = useState<Set<number>>(
    new Set(latestVersion > 0 ? [latestVersion] : [])
  );

  const [uploadCompleted, { isLoading: isUploading }] = useUploadCompletedFilesMutation();
  const [deleteFile] = useDeleteCompletedFileMutation();

  function toggleVersion(v: number) {
    setExpandedVersions((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v); else next.add(v);
      return next;
    });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files;
    if (!picked || picked.length === 0) return;
    const fd = new FormData();
    Array.from(picked).forEach((f) => fd.append("files", f));
    if (versionNote.trim()) fd.append("versionNote", versionNote.trim());
    try {
      await uploadCompleted({ id: requestId, files: fd }).unwrap();
      toast.success("Version uploaded — the store can see it now");
      e.target.value = "";
      setVersionNote("");
    } catch {
      toast.error("Upload failed");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    try {
      await deleteFile({ id: requestId, fileId: deleteTarget.id }).unwrap();
      toast.success("File deleted");
    } catch {
      toast.error("Could not delete file");
    }
    setDeletingId(null);
    setDeleteTarget(null);
  }

  return (
    <>
      {/* Deliverables panel */}
      <div className="bg-card border border-border rounded-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Deliverables</p>
            {versions.length > 0 && (
              <Badge variant="outline" className="rounded-xs text-xs h-5">
                {versions.length} version{versions.length > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          {selectedVersion != null && (
            <Badge className="rounded-xs text-xs bg-green-600 text-white border-0 gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" />
              Store selected v{selectedVersion}
            </Badge>
          )}
        </div>

        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <ImageIcon className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No files uploaded yet</p>
            <p className="text-xs text-muted-foreground mt-0.5">Upload your first version below — the store sees it immediately.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {versions.map((v) => {
              const vFiles = versionGroups[v];
              const note = vFiles[0]?.versionNote;
              const isSelected = selectedVersion === v;
              const isExpanded = expandedVersions.has(v);
              const imageFiles = vFiles.filter((f) => isImage(f.fileName));
              const nonImageFiles = vFiles.filter((f) => !isImage(f.fileName));

              return (
                <div key={v} className={cn("transition-colors", isSelected && "bg-green-50/50 dark:bg-green-950/10")}>
                  <button
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-muted/30 transition-colors text-left"
                    onClick={() => toggleVersion(v)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">Version {v}</span>
                      {isSelected && (
                        <Badge className="rounded-xs text-[10px] h-4 bg-green-600 text-white border-0 gap-0.5 px-1.5">
                          <CheckCircle2 className="w-2 h-2" />
                          Selected
                        </Badge>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(vFiles[0].uploadedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {" · "}{vFiles.length} file{vFiles.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    {isExpanded
                      ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                      : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border">
                      {note && (
                        <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/20 border-b border-blue-200 dark:border-blue-900 px-4 py-2.5">
                          <MessageSquare className="w-3 h-3 text-blue-500 mt-0.5 shrink-0" />
                          <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">{note}</p>
                        </div>
                      )}
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
                                <div className="flex items-center gap-1">
                                  <a href={f.url} download className="text-white hover:text-primary-foreground" onClick={(e) => e.stopPropagation()} title="Download">
                                    <Download className="w-3.5 h-3.5" />
                                  </a>
                                  {!isSelected && (
                                    <button
                                      className="text-white/70 hover:text-red-400 transition-colors"
                                      onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: f._id, name: f.fileName }); }}
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {nonImageFiles.length > 0 && (
                        <ul className="divide-y divide-border">
                          {nonImageFiles.map((f) => (
                            <li key={f._id} className="group flex items-center gap-3 px-4 py-3">
                              <div className="w-8 h-8 rounded-xs bg-muted flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <span className="flex-1 text-xs truncate">{f.fileName}</span>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <a href={f.url} download className="w-6 h-6 rounded-xs flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" title="Download">
                                  <Download className="w-3 h-3" />
                                </a>
                                {!isSelected && (
                                  <button
                                    className="w-6 h-6 rounded-xs flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                                    onClick={() => setDeleteTarget({ id: f._id, name: f.fileName })}
                                    disabled={deletingId === f._id}
                                    title="Delete"
                                  >
                                    {deletingId === f._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Upload new version */}
        <div className="px-4 py-4 border-t border-border space-y-3 bg-muted/20">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Upload {versions.length === 0 ? "First Version" : `Version ${latestVersion + 1}`}
          </p>
          <Textarea
            placeholder="Add a note for the store about this version… (optional)"
            value={versionNote}
            onChange={(e) => setVersionNote(e.target.value)}
            className="rounded-xs resize-none min-h-[60px] text-sm bg-background border-border"
          />
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
          <Button
            className="w-full rounded-xs gap-2 h-9"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {isUploading ? "Uploading…" : "Upload Files"}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            Files are visible to the store immediately after upload.
          </p>
        </div>
      </div>

      {/* AI Design Assistant stub */}
      <div className="bg-card border border-border rounded-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <p className="text-sm font-semibold">AI Design Assistant</p>
          <Badge variant="outline" className="rounded-xs text-[10px] h-4 px-1.5 text-muted-foreground ml-auto">Coming Soon</Badge>
        </div>
        <div className="px-4 py-5 flex flex-col items-center justify-center text-center gap-2">
          <Sparkles className="w-8 h-8 text-purple-400/40" />
          <p className="text-sm text-muted-foreground max-w-xs">
            Ask about layout options, Oregon cannabis compliance rules, or generate a concept draft.
          </p>
          <Button variant="outline" className="rounded-xs gap-2 mt-1 opacity-50 cursor-not-allowed" disabled>
            <Sparkles className="w-3.5 h-3.5" />
            Start a conversation
          </Button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setLightboxUrl(null)}
        >
          <img src={lightboxUrl} alt="Preview" className="max-w-full max-h-full object-contain rounded-sm shadow-2xl" />
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent className="rounded-xs bg-card text-card-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this file?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">&ldquo;{deleteTarget?.name}&rdquo;</span> will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xs">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xs bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
