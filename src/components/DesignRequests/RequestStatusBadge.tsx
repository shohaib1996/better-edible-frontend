import { Badge } from "@/components/ui/badge";
import { DesignRequestStatus } from "@/types/designRequests/designRequests";

const STATUS_CONFIG: Record<
  DesignRequestStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  "in-progress": {
    label: "In Progress",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  "revision-requested": {
    label: "Revision Requested",
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-800 border-green-200",
  },
};
// request status badge component

interface RequestStatusBadgeProps {
  status: DesignRequestStatus;
  className?: string;
}

export function RequestStatusBadge({
  status,
  className,
}: RequestStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <Badge
      variant="outline"
      className={`rounded-xs text-xs font-medium ${config.className} ${className ?? ""}`}
    >
      {config.label}
    </Badge>
  );
}
