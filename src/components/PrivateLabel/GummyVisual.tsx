"use client";

import type { GummySize } from "@/types/privateLabel/gummyBuilder";

interface Props {
  size: GummySize;
  hue: number;
}

export function GummyVisual({ size, hue }: Props) {
  return (
    <div className="relative flex justify-center items-center">
      <img
        src="https://res.cloudinary.com/dw7wk19yf/image/upload/v1780636856/digital-assets/image-removebg-preview-1780636852296-962471988_drmefp.png"
        alt="Gummy preview"
        className={`object-contain transition-all duration-300 ${
          size === "xl" ? "h-56 w-auto" : "h-32 w-auto"
        }`}
        style={{
          filter: `hue-rotate(${hue}deg) saturate(1.3) brightness(1.05)`,
        }}
      />
      {size === "xl" && (
        <span className="absolute -top-1 -right-1 text-[10px] font-bold bg-primary text-primary-foreground rounded-xs px-1.5 py-0.5 leading-none">
          XL
        </span>
      )}
    </div>
  );
}
