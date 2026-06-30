"use client";

import type { BgEntry } from "@/utils/backgrounds";

export type LayoutName =
  | "classic" | "claims-hero" | "stacked-wide" | "whisper"
  | "split" | "oversized" | "bottom-heavy" | "minimal-top";

export const LAYOUTS: LayoutName[] = [
  "classic", "claims-hero", "stacked-wide", "whisper",
  "split", "oversized", "bottom-heavy", "minimal-top",
];

export const INITIAL_COUNT = 20;
export const LOAD_MORE = 10;

const CORMORANT = "'Cormorant Garamond', serif";
const DM_SANS = "'DM Sans', sans-serif";
const GOLD = "#C8975A";

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildSlides(count: number, offset: number, bgs: BgEntry[], layouts: LayoutName[]) {
  return Array.from({ length: count }, (_, i) => ({
    bg: bgs[(offset + i) % bgs.length],
    layout: layouts[(offset + i) % layouts.length],
    key: offset + i,
  }));
}

function SlideContent({ layout, ink, sub, gold, rule }: { layout: LayoutName; ink: string; sub: string; gold: string; rule: string }) {
  switch (layout) {
    case "classic":
      return (
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontFamily: CORMORANT, fontWeight: 600, fontSize: "clamp(4rem, 18vw, 6.5rem)", color: ink, lineHeight: 0.88, letterSpacing: "-0.03em", marginBottom: "0.4rem" }}>BIOMAX</h1>
          <p style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: "0.6rem", letterSpacing: "0.22em", textTransform: "uppercase", color: sub, marginBottom: "2.5rem" }}>Enhanced Distillate</p>
          <div style={{ height: 1, background: `linear-gradient(to right, transparent, ${gold}, transparent)`, marginBottom: "2.5rem" }} />
          <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "clamp(1.1rem, 5vw, 1.5rem)", color: ink, lineHeight: 1.5 }}>Hits in 30 minutes.</p>
          <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "clamp(1.1rem, 5vw, 1.5rem)", color: gold, lineHeight: 1.5 }}>No weed taste.</p>
        </div>
      );
    case "claims-hero":
      return (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: "0.52rem", letterSpacing: "0.28em", textTransform: "uppercase", color: sub, marginBottom: "3rem" }}>BIOMAX · Enhanced Distillate</p>
          <p style={{ fontFamily: CORMORANT, fontWeight: 300, fontSize: "clamp(1.8rem, 8vw, 3rem)", color: ink, lineHeight: 1.25, marginBottom: "0.5rem" }}>Hits in 30 minutes.</p>
          <p style={{ fontFamily: CORMORANT, fontWeight: 600, fontSize: "clamp(1.8rem, 8vw, 3rem)", color: gold, lineHeight: 1.25 }}>No weed taste.</p>
        </div>
      );
    case "stacked-wide":
      return (
        <div style={{ textAlign: "left" }}>
          <h1 style={{ fontFamily: CORMORANT, fontWeight: 700, fontSize: "clamp(5rem, 22vw, 8rem)", color: ink, lineHeight: 0.85, letterSpacing: "-0.04em", marginBottom: "1.5rem" }}>BIO<br />MAX</h1>
          <div style={{ height: 1, width: "100%", background: rule, marginBottom: "1.5rem" }} />
          <p style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: sub, marginBottom: "0.5rem" }}>Enhanced Distillate</p>
          <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "clamp(0.95rem, 4vw, 1.25rem)", color: ink, lineHeight: 1.6 }}>Hits in 30 minutes. No weed taste.</p>
        </div>
      );
    case "whisper":
      return (
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontFamily: CORMORANT, fontWeight: 300, fontSize: "clamp(2.5rem, 10vw, 4rem)", color: ink, lineHeight: 1, letterSpacing: "0.08em", marginBottom: "2rem" }}>BIOMAX</h1>
          <p style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.25em", textTransform: "uppercase", color: sub, marginBottom: "1rem" }}>Enhanced Distillate</p>
          <div style={{ height: 1, width: 48, background: gold, margin: "0 auto 2rem" }} />
          <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "clamp(0.85rem, 3.5vw, 1.1rem)", color: ink, lineHeight: 1.7, opacity: 0.85 }}>Hits in 30 minutes.<br />No weed taste.</p>
        </div>
      );
    case "split":
      return (
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "clamp(1rem, 4.5vw, 1.35rem)", color: sub, lineHeight: 1.5, marginBottom: "2rem" }}>Hits in 30 minutes.</p>
          <h1 style={{ fontFamily: CORMORANT, fontWeight: 600, fontSize: "clamp(4.5rem, 20vw, 7rem)", color: ink, lineHeight: 0.88, letterSpacing: "-0.03em", marginBottom: "2rem" }}>BIOMAX</h1>
          <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "clamp(1rem, 4.5vw, 1.35rem)", color: gold, lineHeight: 1.5, marginBottom: "2rem" }}>No weed taste.</p>
          <p style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: "0.5rem", letterSpacing: "0.25em", textTransform: "uppercase", color: sub }}>Enhanced Distillate</p>
        </div>
      );
    case "oversized":
      return (
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "15vh 0 12vh" }}>
          <div>
            <h1 style={{ fontFamily: CORMORANT, fontWeight: 700, fontSize: "clamp(5.5rem, 24vw, 9rem)", color: ink, lineHeight: 0.82, letterSpacing: "-0.04em", marginLeft: "-0.05em" }}>BIOMAX</h1>
          </div>
          <div>
            <div style={{ height: 1, background: rule, marginBottom: "1.25rem" }} />
            <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "clamp(1rem, 4vw, 1.3rem)", color: ink, lineHeight: 1.55, marginBottom: "0.25rem" }}>Hits in 30 minutes.</p>
            <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "clamp(1rem, 4vw, 1.3rem)", color: gold, lineHeight: 1.55 }}>No weed taste.</p>
          </div>
        </div>
      );
    case "bottom-heavy":
      return (
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 0 14vh" }}>
          <h1 style={{ fontFamily: CORMORANT, fontWeight: 600, fontSize: "clamp(3.5rem, 16vw, 5.5rem)", color: ink, lineHeight: 0.9, letterSpacing: "-0.03em", marginBottom: "1.25rem" }}>BIOMAX</h1>
          <p style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: sub, marginBottom: "1.5rem" }}>Enhanced Distillate</p>
          <div style={{ height: 1, background: `linear-gradient(to right, ${gold}, transparent)`, marginBottom: "1.5rem" }} />
          <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "clamp(1.1rem, 4.5vw, 1.4rem)", color: ink, lineHeight: 1.5 }}>
            Hits in 30 minutes.<br /><span style={{ color: gold }}>No weed taste.</span>
          </p>
        </div>
      );
    case "minimal-top":
    default:
      return (
        <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-start", padding: "14vh 0 0" }}>
          <h1 style={{ fontFamily: CORMORANT, fontWeight: 600, fontSize: "clamp(4rem, 18vw, 6.5rem)", color: ink, lineHeight: 0.88, letterSpacing: "-0.03em", marginBottom: "1rem" }}>BIOMAX</h1>
          <p style={{ fontFamily: DM_SANS, fontWeight: 300, fontSize: "0.55rem", letterSpacing: "0.22em", textTransform: "uppercase", color: sub, marginBottom: "2.5rem" }}>Enhanced Distillate</p>
          <div style={{ height: 1, width: 56, background: gold, marginBottom: "2.5rem" }} />
          <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "clamp(1rem, 4vw, 1.3rem)", color: ink, lineHeight: 1.6 }}>Hits in 30 minutes.</p>
          <p style={{ fontFamily: CORMORANT, fontStyle: "italic", fontSize: "clamp(1rem, 4vw, 1.3rem)", color: gold, lineHeight: 1.6 }}>No weed taste.</p>
        </div>
      );
  }
}

export function Slide({ bg, layout, isFirst, onRetailer, onCalculator }: {
  bg: BgEntry; layout: LayoutName; isFirst: boolean;
  onRetailer: () => void; onCalculator: () => void;
}) {
  const dark = bg.dark;
  const ink = dark ? "#FFFFFF" : "#0F0E0C";
  const sub = dark ? "rgba(255,255,255,0.55)" : "rgba(15,14,12,0.45)";
  const rule = dark ? "rgba(255,255,255,0.18)" : "rgba(15,14,12,0.12)";
  const overlay = dark ? "rgba(0,0,0,0.50)" : "rgba(250,248,244,0.38)";

  return (
    <section style={{ position: "relative", width: "100%", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", scrollSnapAlign: "start", scrollSnapStop: "always" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={bg.url} alt="" loading="eager" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />
      <div style={{ position: "absolute", inset: 0, backgroundColor: overlay }} />
      <div style={{ background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.35) 100%)", position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 2, width: "min(100vw, 420px)", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 2rem", boxSizing: "border-box" }}>
        <button
          onClick={onRetailer}
          style={{ position: "absolute", top: "1.5rem", right: "1.75rem", zIndex: 10, fontFamily: DM_SANS, fontWeight: 400, fontSize: "0.6rem", letterSpacing: "0.28em", textTransform: "uppercase", color: dark ? "rgba(200,151,90,0.9)" : "rgba(200,151,90,0.95)", background: "none", border: "none", cursor: "pointer", padding: 0, textShadow: dark ? "0 1px 6px rgba(0,0,0,0.6)" : "0 1px 4px rgba(255,255,255,0.5)" }}
        >
          Retailer
        </button>

        <button
          onClick={onCalculator}
          style={{ position: "absolute", bottom: "1.75rem", right: "1.75rem", zIndex: 10, fontFamily: DM_SANS, fontWeight: 700, fontSize: "0.58rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#fff", background: "linear-gradient(135deg, #1a7a3c, #145c2d)", border: "none", borderRadius: 6, cursor: "pointer", padding: "0.45rem 0.85rem", boxShadow: "0 2px 16px rgba(26,122,60,0.6)", display: "flex", alignItems: "center", gap: "0.35rem", animation: "calcPulse 2.5s ease-in-out infinite" }}
        >
          <span style={{ fontSize: "0.85rem" }}>💰</span> PROFIT CALCULATOR
        </button>

        <div style={{ position: "absolute", bottom: "1.75rem", left: "1.75rem", zIndex: 10, textAlign: "left", pointerEvents: "none" }}>
          <p style={{ fontFamily: CORMORANT, fontWeight: 500, fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", color: dark ? "rgba(200,151,90,0.85)" : "rgba(200,151,90,0.9)", lineHeight: 1.25, margin: 0, textShadow: dark ? "0 1px 6px rgba(0,0,0,0.6)" : "0 1px 4px rgba(255,255,255,0.5)" }}>
            Better<br />Edibles
          </p>
        </div>

        <SlideContent layout={layout} ink={ink} sub={sub} gold={GOLD} rule={rule} />
      </div>

      {isFirst && (
        <div style={{ position: "absolute", bottom: "2rem", left: "50%", transform: "translateX(-50%)", zIndex: 3, display: "flex", flexDirection: "column", alignItems: "center", opacity: 0.3 }}>
          <div style={{ width: 1, height: 40, background: `linear-gradient(to bottom, ${ink}, transparent)`, animation: "scrollPulse 2s ease-in-out infinite" }} />
        </div>
      )}
    </section>
  );
}
