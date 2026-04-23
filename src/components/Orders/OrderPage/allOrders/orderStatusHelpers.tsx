import { cn } from "@/lib/utils";

export const STATUS_OPTIONS = ["submitted", "manifested", "shipped", "cancelled"] as const;

export function getStatusSelectBg(status: string) {
  switch (status) {
    case "submitted":  return "bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:text-white";
    case "accepted":   return "bg-yellow-500 hover:bg-yellow-600 text-white dark:bg-yellow-500 dark:text-white";
    case "manifested": return "bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:text-white";
    case "shipped":    return "bg-green-600 hover:bg-green-700 text-white dark:bg-green-600 dark:text-white";
    case "cancelled":  return "bg-red-600 hover:bg-red-700 text-white dark:bg-red-600 dark:text-white";
    default:           return "bg-gray-700 hover:bg-gray-800 text-white dark:bg-gray-700 dark:text-white";
  }
}

export function getStatusStyle(status: string) {
  switch (status) {
    case "submitted":  return "border-l-4 border-l-blue-600";
    case "accepted":   return "border-l-4 border-l-yellow-500";
    case "manifested": return "border-l-4 border-l-emerald-600";
    case "shipped":    return "border-l-4 border-l-green-600";
    case "cancelled":  return "border-l-4 border-l-red-600";
    default:           return "border-l-4 border-l-border";
  }
}

export function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    submitted:  { bg: "bg-blue-600",    text: "text-white" },
    accepted:   { bg: "bg-yellow-500",  text: "text-white" },
    manifested: { bg: "bg-emerald-600", text: "text-white" },
    shipped:    { bg: "bg-green-600",   text: "text-white" },
    cancelled:  { bg: "bg-red-600",     text: "text-white" },
  };
  const colors = colorMap[status] || { bg: "bg-muted", text: "text-muted-foreground" };
  return (
    <span className={cn("px-2 py-0.5 rounded-xs text-xs font-semibold capitalize", colors.bg, colors.text)}>
      {status}
    </span>
  );
}
