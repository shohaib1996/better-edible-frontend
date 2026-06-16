"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useKioskClockMutation } from "@/redux/api/Rep/repApi";

// ─── Types ────────────────────────────────────────────────────────────────────
type KioskState =
  | { mode: "idle" }
  | { mode: "pin"; digits: string }
  | { mode: "submitting" }
  | { mode: "success"; action: "checkin" | "checkout"; name: string }
  | { mode: "error"; message: string };

// ─── Constants ────────────────────────────────────────────────────────────────
const PIN_LENGTH = 4;
const FEEDBACK_DURATION_MS = 3500;
const FOB_DEBOUNCE_MS = 80; // RFID readers fire chars rapidly; collect until gap

// ─── Component ────────────────────────────────────────────────────────────────
export default function KioskPage() {
  const [state, setState] = useState<KioskState>({ mode: "idle" });
  const [kioskClock] = useKioskClockMutation();

  // Fob input buffer — USB HID RFID reader sends chars as keyboard events
  const fobBuffer = useRef("");
  const fobTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Clock call ──────────────────────────────────────────────────────────────
  const doClock = useCallback(
    async (payload: { pin?: string; fobId?: string }) => {
      setState({ mode: "submitting" });
      try {
        const result = await kioskClock(payload).unwrap();
        setState({
          mode: "success",
          action: result.action,
          name: result.rep?.name ?? "Employee",
        });
        setTimeout(() => setState({ mode: "idle" }), FEEDBACK_DURATION_MS);
      } catch (err: any) {
        const msg =
          err?.data?.message || "Something went wrong. Please try again.";
        setState({ mode: "error", message: msg });
        setTimeout(() => setState({ mode: "idle" }), FEEDBACK_DURATION_MS);
      }
    },
    [kioskClock]
  );

  // ── Fob listener (global keydown) ───────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Ignore modifier keys and function keys
      if (e.key.length > 1 && e.key !== "Enter") return;

      // If PIN numpad is active, let the PIN handler deal with it
      if (
        state.mode === "pin" ||
        state.mode === "submitting" ||
        state.mode === "success" ||
        state.mode === "error"
      )
        return;

      if (e.key === "Enter") {
        // End of fob scan — flush buffer
        if (fobBuffer.current.length > 0) {
          const fobId = fobBuffer.current.trim();
          fobBuffer.current = "";
          if (fobTimer.current) clearTimeout(fobTimer.current);
          doClock({ fobId });
        }
        return;
      }

      // Accumulate fob chars
      fobBuffer.current += e.key;

      // Debounce: if no more chars arrive within FOB_DEBOUNCE_MS, treat as complete
      if (fobTimer.current) clearTimeout(fobTimer.current);
      fobTimer.current = setTimeout(() => {
        if (fobBuffer.current.length > 0) {
          const fobId = fobBuffer.current.trim();
          fobBuffer.current = "";
          doClock({ fobId });
        }
      }, FOB_DEBOUNCE_MS);
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [state.mode, doClock]);

  // ── PIN numpad handlers ─────────────────────────────────────────────────────
  const handleDigit = (d: string) => {
    if (state.mode !== "pin") return;
    const next = state.digits + d;
    if (next.length < PIN_LENGTH) {
      setState({ mode: "pin", digits: next });
    } else {
      // Last digit — submit immediately
      doClock({ pin: next });
    }
  };

  const handleBackspace = () => {
    if (state.mode !== "pin") return;
    setState({ mode: "pin", digits: state.digits.slice(0, -1) });
  };

  const handleCancel = () => setState({ mode: "idle" });

  const openPin = () => {
    if (state.mode === "idle") setState({ mode: "pin", digits: "" });
  };

  // ── Current time display ────────────────────────────────────────────────────
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0a0f0d] text-white flex flex-col items-center justify-center select-none overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-emerald-900/20 blur-[120px]" />
      </div>

      {/* Logo + company name */}
      <div className="relative z-10 flex flex-col items-center gap-2 mb-10">
        <div className="text-emerald-400 text-sm font-semibold tracking-[0.3em] uppercase">
          Better Edibles
        </div>
      </div>

      {/* Clock */}
      <div className="relative z-10 text-center mb-10">
        <div className="text-7xl font-thin tabular-nums tracking-tight text-white/90">
          {timeStr}
        </div>
        <div className="text-lg text-white/40 mt-2 font-light">{dateStr}</div>
      </div>

      {/* ── Idle state ── */}
      {state.mode === "idle" && (
        <div className="relative z-10 flex flex-col items-center gap-6">
          <p className="text-white/50 text-lg font-light tracking-wide">
            Tap your fob or enter your PIN
          </p>
          <button
            onClick={openPin}
            className="px-10 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white font-semibold text-lg shadow-lg shadow-emerald-900/50"
          >
            Enter PIN
          </button>
        </div>
      )}

      {/* ── PIN entry ── */}
      {state.mode === "pin" && (
        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Dot indicators */}
          <div className="flex gap-4">
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <div
                key={i}
                className={`w-5 h-5 rounded-full transition-all duration-150 ${
                  i < state.digits.length
                    ? "bg-emerald-400 scale-110"
                    : "bg-white/20"
                }`}
              />
            ))}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <NumKey key={d} label={d} onClick={() => handleDigit(d)} />
            ))}
            <NumKey label="⌫" onClick={handleBackspace} variant="ghost" />
            <NumKey label="0" onClick={() => handleDigit("0")} />
            <NumKey label="✕" onClick={handleCancel} variant="cancel" />
          </div>
        </div>
      )}

      {/* ── Submitting ── */}
      {state.mode === "submitting" && (
        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin" />
          <p className="text-white/60 text-lg">Verifying…</p>
        </div>
      )}

      {/* ── Success ── */}
      {state.mode === "success" && (
        <div className="relative z-10 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
          <div
            className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg ${
              state.action === "checkin"
                ? "bg-emerald-500 shadow-emerald-900/50"
                : "bg-amber-500 shadow-amber-900/50"
            }`}
          >
            {state.action === "checkin" ? "✓" : "👋"}
          </div>
          <div className="text-center">
            <p className="text-3xl font-semibold text-white">{state.name}</p>
            <p
              className={`text-lg mt-1 font-light ${
                state.action === "checkin"
                  ? "text-emerald-400"
                  : "text-amber-400"
              }`}
            >
              {state.action === "checkin" ? "Clocked In" : "Clocked Out"}
            </p>
            <p className="text-white/40 text-sm mt-1">{timeStr}</p>
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {state.mode === "error" && (
        <div className="relative z-10 flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center text-4xl shadow-lg shadow-red-900/50">
            ✕
          </div>
          <p className="text-red-400 text-xl font-medium text-center max-w-xs">
            {state.message}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-6 text-white/20 text-xs tracking-widest uppercase">
        Employee Time Clock
      </div>
    </div>
  );
}

// ─── NumKey sub-component ──────────────────────────────────────────────────────
function NumKey({
  label,
  onClick,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  variant?: "default" | "ghost" | "cancel";
}) {
  const base =
    "w-20 h-20 rounded-2xl text-2xl font-medium flex items-center justify-center active:scale-90 transition-all duration-100 cursor-pointer select-none";
  const styles = {
    default: "bg-white/10 hover:bg-white/20 text-white",
    ghost: "bg-white/5 hover:bg-white/10 text-white/60",
    cancel: "bg-red-900/40 hover:bg-red-800/60 text-red-400",
  };
  return (
    <button className={`${base} ${styles[variant]}`} onClick={onClick}>
      {label}
    </button>
  );
}
