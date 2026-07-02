export const categoryColors: Record<string, { bg: string; text: string }> = {
  productimage: { bg: "#fdf3ec", text: "#c45a1a" },
  flyer:        { bg: "#f0f7f2", text: "#2a7a4e" },
  banner:       { bg: "#fdf8ec", text: "#b5860e" },
  logo:         { bg: "#f0f0f8", text: "#5a5a9e" },
  social:       { bg: "#fdf3ec", text: "#c45a1a" },
  video:        { bg: "#f0f7f2", text: "#2a7a4e" },
  document:     { bg: "#fdf8ec", text: "#b5860e" },
  default:      { bg: "#f5f2e8", text: "#6b6045" },
};

export function getCategoryColor(cat?: string) {
  const key = (cat || "").toLowerCase().replace(/\s+/g, "");
  return categoryColors[key] || categoryColors.default;
}

export function fmtDate(d?: string) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function categoryIcon(cat?: string) {
  const k = (cat || "").toLowerCase();
  if (k.includes("video")) return "🎬";
  if (k.includes("flyer") || k.includes("print")) return "🖨";
  if (k.includes("social")) return "📱";
  if (k.includes("logo")) return "✦";
  if (k.includes("banner")) return "🖼";
  if (k.includes("product")) return "📦";
  return "🖼";
}

export const STATUS_LABELS: Record<string, string> = {
  pending:              "Pending",
  "in-progress":        "In Progress",
  "revision-requested": "Revision",
  completed:            "Completed",
};

export const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  pending:              { bg: "#f5f2e8", text: "#6b6045", dot: "#9a8f6e" },
  "in-progress":        { bg: "#fdf8ec", text: "#b5860e", dot: "#e8a832" },
  "revision-requested": { bg: "#fdf3ec", text: "#c45a1a", dot: "#e07040" },
  completed:            { bg: "#f0f7f2", text: "#2a7a4e", dot: "#3a9a5e" },
};
