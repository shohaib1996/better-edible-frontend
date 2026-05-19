"use client";

import { useRef, useState } from "react";
import { Upload, Download, Send, Loader2, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useUploadCompletedFilesMutation,
  useSendFilesToStoreMutation,
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

interface DeliveredFilesPanelProps {
  requestId: string;
  files: ICompletedFile[];
}

export function DeliveredFilesPanel({ requestId, files }: DeliveredFilesPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  const [uploadCompleted, { isLoading: isUploading }] = useUploadCompletedFilesMutation();
  const [sendFiles, { isLoading: isSending }] = useSendFilesToStoreMutation();
  const [deleteFile] = useDeleteCompletedFileMutation();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const versionGroups = groupByVersion(files);
  const versions = Object.keys(versionGroups).map(Number).sort((a, b) => b - a);
  const unsentCount = files.filter((f) => !f.sent).length;

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files;
    if (!picked || picked.length === 0) return;
    const fd = new FormData();
    Array.from(picked).forEach((f) => fd.append("files", f));
    try {
      await uploadCompleted({ id: requestId, files: fd }).unwrap();
      toast.success("Files uploaded successfully");
      e.target.value = "";
    } catch {
      toast.error("Upload failed");
    }
  }

  async function handleSend() {
    if (selectedFileIds.length === 0) return;
    try {
      await sendFiles({ id: requestId, fileIds: selectedFileIds }).unwrap();
      toast.success("Files sent to store");
      setSelectedFileIds([]);
    } catch {
      toast.error("Failed to send files");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeletingId(deleteTarget.id);
    setDeleteTarget(null);
    try {
      await deleteFile({ id: requestId, fileId: deleteTarget.id }).unwrap();
      toast.success("File deleted");
      setSelectedFileIds((prev) => prev.filter((x) => x !== deleteTarget.id));
    } catch {
      toast.error("Failed to delete file");
    }
    setDeletingId(null);
  }

  function toggleFile(fileId: string) {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((x) => x !== fileId) : [...prev, fileId],
    );
  }

  return (
    <>
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
          {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          {isUploading ? "Uploading…" : "Upload"}
        </Button>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} />
      </div>

      <div className="p-3 space-y-4">
        {versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-xs bg-muted flex items-center justify-center mb-3">
              <Upload className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <p className="text-sm text-muted-foreground">No files uploaded yet</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">Upload completed files to deliver.</p>
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
                          f.sent ? "bg-green-100 dark:bg-green-900/40" : "bg-background border border-border",
                        )}
                      >
                        <FileText
                          className={cn(
                            "w-3 h-3",
                            f.sent ? "text-green-600 dark:text-green-400" : "text-muted-foreground",
                          )}
                        />
                      </div>
                      <span className="flex-1 text-xs truncate">{f.fileName}</span>
                      {f.sent ? (
                        <Badge
                          variant="outline"
                          className="rounded-xs text-[10px] h-5 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30 shrink-0"
                        >
                          Sent
                        </Badge>
                      ) : (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                          <a
                            href={f.url}
                            download
                            className="w-6 h-6 rounded-xs flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                            onClick={(e) => e.stopPropagation()}
                            title="Download"
                          >
                            <Download className="w-3 h-3" />
                          </a>
                          <button
                            className="w-6 h-6 rounded-xs flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: f._id, name: f.fileName }); }}
                            disabled={deletingId === f._id}
                            title="Delete"
                          >
                            {deletingId === f._id
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Trash2 className="w-3 h-3" />
                            }
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {selectedFileIds.length > 0 && (
              <Button className="w-full rounded-xs gap-2 h-9" onClick={handleSend} disabled={isSending}>
                {isSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {isSending
                  ? "Sending…"
                  : `Send ${selectedFileIds.length} file${selectedFileIds.length > 1 ? "s" : ""} to Store`}
              </Button>
            )}
          </>
        )}
      </div>
    </div>

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
