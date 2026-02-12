"use client";

import { useRouter } from "next/navigation";
import { Repeat, Eye, MapPin, User, CheckCircle2, Clock } from "lucide-react";
import { IPrivateLabelClient } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ClientCardProps {
  client: IPrivateLabelClient;
  isRepView?: boolean;
}

export const ClientCard = ({ client, isRepView = false }: ClientCardProps) => {
  const router = useRouter();

  const statusColor =
    client.status === "active"
      ? "bg-green-500 hover:bg-green-600 text-white"
      : "bg-yellow-500 hover:bg-yellow-600 text-white";

  const handleViewClient = () => {
    const basePath = isRepView
      ? "/rep/manage-clients"
      : "/admin/manage-clients";
    router.push(`${basePath}/${client._id}`);
  };

  return (
    <Card className="p-3 rounded-xs shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex flex-col gap-3">
        {/* Header: Store Name & Status */}
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold leading-tight">
                {client.store?.name}
              </h3>
              {client.recurringSchedule?.enabled && (
                <Repeat className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              )}
            </div>
            <div className="flex items-start gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <p className="text-xs">
                {[
                  client.store?.address,
                  client.store?.city,
                  client.store?.state,
                  client.store?.zip,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
          </div>
          <Badge
            className={`${statusColor} rounded-xs px-2 py-0.5 text-xs font-medium shrink-0`}
          >
            {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
          </Badge>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-2 text-xs bg-secondary/20 p-2 rounded-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="truncate text-muted-foreground">
              Rep:{" "}
              <span className="font-medium text-foreground">
                {client.assignedRep?.name || "Unassigned"}
              </span>
            </span>
          </div>
          <div className="hidden"></div> {/* Spacer for grid */}
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-500 shrink-0" />
            <span className="text-muted-foreground">
              Approved:{" "}
              <span className="font-medium text-green-700 dark:text-green-400">
                {client.labelCounts?.approved || 0}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500 shrink-0" />
            <span className="text-muted-foreground">
              In Progress:{" "}
              <span className="font-medium text-yellow-700 dark:text-yellow-400">
                {client.labelCounts?.inProgress || 0}
              </span>
            </span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-xs h-8 text-xs font-medium hover:bg-primary/5 hover:text-primary hover:border-primary/20"
          onClick={handleViewClient}
        >
          <Eye className="mr-1.5 h-3.5 w-3.5" />
          View Details
        </Button>
      </div>
    </Card>
  );
};
