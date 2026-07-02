"use client";

export function Chip({
  label,
  sublabel,
  active,
  onClick,
}: {
  label: string;
  sublabel?: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center px-3 py-1.5 rounded text-xs font-medium transition-all active:scale-95"
      style={{
        background: active ? "#c45a1a" : "#f0ece0",
        color: active ? "#fff" : "#4a4535",
        border: `1px solid ${active ? "#c45a1a" : "#d6d0b4"}`,
        minWidth: 52,
        boxShadow: active ? "0 1px 4px rgba(196,90,26,0.25)" : "none",
      }}
    >
      <span>{label}</span>
      {sublabel && (
        <span
          className="text-[9px] mt-0.5 font-normal leading-none"
          style={{ color: active ? "rgba(255,255,255,0.75)" : "#9a8f6e" }}
        >
          {sublabel}
        </span>
      )}
    </button>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[10px] font-semibold uppercase tracking-wider mb-1.5"
      style={{ color: "#9a8f6e" }}
    >
      {children}
    </div>
  );
}
