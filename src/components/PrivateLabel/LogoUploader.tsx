"use client";

import { useEffect, useRef, useState } from "react";
import {
  ImageIcon, Mail, RefreshCw, UploadCloud, CheckCircle2, X, Loader2, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useUploadLogoMutation, useGetMyRepQuery } from "@/redux/api/PrivateLabel/storeLabelApi";

export type LogoStatus = "uploaded" | "pending_email" | "use_existing";

const LOGO_OPTIONS: { value: LogoStatus; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "use_existing",
    label: "Use existing logo",
    description: "We already have your logo on file.",
    icon: <RefreshCw className="w-4 h-4" />,
  },
  {
    value: "pending_email",
    label: "Send logo via email",
    description: "I'll email the logo file after submitting.",
    icon: <Mail className="w-4 h-4" />,
  },
  {
    value: "uploaded",
    label: "I'll upload it",
    description: "Upload your logo file directly (PNG, JPG, PDF).",
    icon: <ImageIcon className="w-4 h-4" />,
  },
];

interface Props {
  storeId: string;
  logoStatus: LogoStatus;
  onStatusChange: (status: LogoStatus) => void;
  onUploadComplete: (url: string) => void;
  onRemove: () => void;
}

export function LogoUploader({ storeId, logoStatus, onStatusChange, onUploadComplete, onRemove }: Props) {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadLogo] = useUploadLogoMutation();
  const { data: repData } = useGetMyRepQuery(storeId, { skip: logoStatus !== "pending_email" });

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoUrl("");
    setLogoPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleUpload() {
    if (!logoFile) return;
    setIsUploading(true);
    const fd = new FormData();
    fd.append("logo", logoFile);
    try {
      const res = await uploadLogo(fd).unwrap();
      setLogoUrl(res.url);
      onUploadComplete(res.url);
      toast.success("Logo uploaded");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Logo upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  function handleRemove() {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(null);
    setLogoUrl("");
    setLogoPreview(null);
    onRemove();
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Logo
      </label>

      {/* Option cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {LOGO_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onStatusChange(opt.value)}
            className={`flex flex-col items-start gap-1 rounded-xs border p-3 text-left transition-all ${
              logoStatus === opt.value
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border text-muted-foreground hover:border-muted-foreground"
            }`}
          >
            <div className="flex items-center gap-2 font-medium text-sm">
              {opt.icon}
              {opt.label}
            </div>
            <p className="text-xs leading-snug">{opt.description}</p>
          </button>
        ))}
      </div>

      {/* Rep email info */}
      {logoStatus === "pending_email" && (
        <div className="mt-2">
          {repData?.rep ? (
            <div className="flex items-center gap-3 rounded-xs border border-border bg-muted/20 px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-primary">
                  {repData.rep.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{repData.rep.name}</p>
                {repData.rep.email ? (
                  <a
                    href={`mailto:${repData.rep.email}`}
                    className="text-xs text-primary hover:underline truncate block"
                  >
                    {repData.rep.email}
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground">No email on file</p>
                )}
              </div>
              {repData.rep.email && (
                <a
                  href={`mailto:${repData.rep.email}?subject=Logo%20File%20for%20Private%20Label`}
                  className="shrink-0 text-xs font-medium text-primary border border-primary/30 rounded-xs px-3 py-1.5 hover:bg-primary/5 transition-colors"
                >
                  Open Email
                </a>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-xs border border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              Loading rep info…
            </div>
          )}
        </div>
      )}

      {/* File upload */}
      {logoStatus === "uploaded" && (
        <div className="mt-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            className="hidden"
            onChange={handleLogoFile}
          />

          {/* Stage 1 — no file chosen */}
          {!logoFile && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 rounded-xs border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all py-6 text-muted-foreground"
            >
              <UploadCloud className="w-7 h-7" />
              <span className="text-sm font-medium">Click to choose file</span>
              <span className="text-xs">PNG, JPG or PDF — max 5MB</span>
            </button>
          )}

          {/* Stage 2 — file chosen, not yet uploaded */}
          {logoFile && !logoUrl && (
            <div className="flex items-center gap-3 rounded-xs border border-border bg-muted/20 p-3">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Preview"
                  className="w-16 h-16 rounded-xs object-contain border border-border bg-white shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xs border border-border bg-muted flex items-center justify-center shrink-0">
                  <FileText className="w-7 h-7 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{logoFile.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(logoFile.size / 1024).toFixed(0)} KB
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  Change file
                </button>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleRemove}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="rounded-xs gap-1.5 h-8 text-xs"
                >
                  {isUploading ? (
                    <><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</>
                  ) : (
                    <><UploadCloud className="w-3 h-3" /> Upload</>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Stage 3 — uploaded */}
          {logoUrl && (
            <div className="flex items-center gap-3 rounded-xs border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800 p-3">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo"
                  className="w-16 h-16 rounded-xs object-contain border border-green-200 dark:border-green-800 bg-white shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-xs border border-green-200 dark:border-green-800 bg-white flex items-center justify-center shrink-0">
                  <FileText className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400 shrink-0" />
                  <span className="text-xs font-semibold text-green-700 dark:text-green-400">Uploaded</span>
                </div>
                <p className="text-xs text-green-800 dark:text-green-300 truncate">{logoFile?.name}</p>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                title="Remove"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
