"use client";

export function FilterRow({
  options,
  active,
  onChange,
}: {
  options: string[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => { if (active !== opt) onChange(opt); }}
          className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
          style={{
            background: active === opt ? "#2a2518" : "#f0ece0",
            color: active === opt ? "#f5f2e8" : "#4a4535",
            border: "1px solid",
            borderColor: active === opt ? "#2a2518" : "#d6d0b4",
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
