"use client";

import { useState, useEffect } from "react";
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
  }, [images.length]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.88)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 16, right: 16,
          background: "rgba(255,255,255,0.15)", border: "none",
          color: "#fff", width: 36, height: 36, borderRadius: "50%",
          fontSize: 20, cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "center",
        }}
      >
        ×
      </button>

      {images.length > 1 && (
        <button
          onClick={prev}
          style={{
            position: "absolute", left: 12,
            background: "rgba(255,255,255,0.15)", border: "none",
            color: "#fff", width: 40, height: 40, borderRadius: "50%",
            fontSize: 22, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}
        >
          ‹
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={images[idx].url}
        alt=""
        style={{
          maxWidth: "90vw", maxHeight: "85vh",
          objectFit: "contain", borderRadius: 8,
          boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
        }}
      />

      {images.length > 1 && (
        <button
          onClick={next}
          style={{
            position: "absolute", right: 12,
            background: "rgba(255,255,255,0.15)", border: "none",
            color: "#fff", width: 40, height: 40, borderRadius: "50%",
            fontSize: 22, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}
        >
          ›
        </button>
      )}

      {images.length > 1 && (
        <div style={{ position: "absolute", bottom: 20, display: "flex", gap: 6 }}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              style={{
                width: 8, height: 8, borderRadius: "50%", border: "none",
                background: i === idx ? "#fff" : "rgba(255,255,255,0.4)",
                cursor: "pointer", padding: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
