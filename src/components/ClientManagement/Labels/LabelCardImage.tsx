"use client";

import { Eye, ImageIcon } from "lucide-react";
import { ILabel } from "@/types";

interface Props {
  label: ILabel;
  onPreview: (image: { url: string; filename: string }) => void;
}

export function LabelCardImage({ label, onPreview }: Props) {
  function handleClick() {
    if (label.labelImages && label.labelImages.length > 0) {
      const img = label.labelImages[0];
      onPreview({
        url: img.secureUrl || img.url,
        filename: img.originalFilename || `${label.flavorName}-label`,
      });
    }
  }

  return (
    <div
      className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] shrink-0 overflow-hidden rounded-lg bg-muted cursor-pointer group border border-border dark:border-white/20"
      onClick={handleClick}
    >
      {label.labelImages && label.labelImages.length > 0 ? (
        <>
          <img
            src={label.labelImages[0].secureUrl || label.labelImages[0].url}
            alt={label.flavorName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Eye className="h-5 w-5 text-white" />
          </div>
          {label.labelImages.length > 1 && (
            <div className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium">
              +{label.labelImages.length - 1}
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <ImageIcon className="h-7 w-7 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
