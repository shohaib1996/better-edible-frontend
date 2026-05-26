"use client";

import Image from "next/image";
import { Eye, ImageOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type PreviewImage = { url: string; filename: string } | null;

export const fieldClass =
  "w-full rounded-xs border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors";

export function Thumbnail({
  url,
  name,
  onPreview,
}: {
  url?: string | null;
  name: string;
  onPreview: (img: { url: string; filename: string }) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => url && onPreview({ url, filename: name })}
      className={cn(
        "group relative h-12 w-12 shrink-0 rounded-xs overflow-hidden border border-border bg-muted flex items-center justify-center mt-0.5",
        url ? "cursor-pointer" : "cursor-default",
      )}
    >
      {url ? (
        <>
          <Image src={url} alt={name} fill className="object-cover" sizes="48px" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </>
      ) : (
        <ImageOff className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  );
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-muted-foreground">
      <Loader2 className="w-8 h-8 animate-spin" />
    </div>
  );
}

export function ErrorState({ msg }: { msg: string }) {
  return <p className="text-destructive text-sm py-10 text-center">{msg}</p>;
}

export function EmptyState({ msg }: { msg: string }) {
  return <p className="text-muted-foreground text-sm py-10 text-center">{msg}</p>;
}
