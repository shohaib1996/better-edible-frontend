"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import type { ProductImage } from "@/types/storePortal/orders";

export function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: ProductImage[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/88"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Button
        size="icon"
        variant="ghost"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full text-white hover:bg-white/20 hover:text-white"
        aria-label="Close"
      >
        ×
      </Button>

      {images.length > 1 && (
        <Button
          size="icon"
          variant="ghost"
          onClick={prev}
          className="absolute left-3 rounded-full text-white text-xl hover:bg-white/20 hover:text-white"
          aria-label="Previous"
        >
          ‹
        </Button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[idx].url}
        alt=""
        className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
      />

      {images.length > 1 && (
        <Button
          size="icon"
          variant="ghost"
          onClick={next}
          className="absolute right-3 rounded-full text-white text-xl hover:bg-white/20 hover:text-white"
          aria-label="Next"
        >
          ›
        </Button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-5 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className="w-2 h-2 rounded-full border-none p-0 cursor-pointer transition-colors"
              style={{ background: i === idx ? "#fff" : "rgba(255,255,255,0.4)" }}
              aria-label={`Image ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
