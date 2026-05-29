import type { OptionBtn } from "@/lib/gummyBuilderConfig";

export function SegmentGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: OptionBtn<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex-1 sm:flex-none flex flex-col items-center sm:items-start justify-center px-3 py-3 sm:py-2 rounded-xs border transition-all text-center sm:text-left min-h-14 sm:min-h-0 ${
            value === o.value
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "border-border text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <span className="text-sm font-semibold leading-tight">{o.label}</span>
          {o.sub && (
            <span
              className={`text-[11px] leading-tight mt-0.5 ${
                value === o.value ? "text-primary-foreground/70" : "text-muted-foreground"
              }`}
            >
              {o.sub}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
      {children}
    </p>
  );
}
