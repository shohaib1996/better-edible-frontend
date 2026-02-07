"use client";

import { useRouter } from "next/navigation";
import { Repeat, Eye } from "lucide-react";
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
      ? "bg-green-500 text-white"
      : "bg-yellow-500 text-white";

  const handleViewClient = () => {
    const basePath = isRepView ? "/rep/manage-clients" : "/admin/manage-clients";
    router.push(`${basePath}/${client._id}`);
  };

  return (
    <Card className="p-4 rounded-xs">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 flex-1">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base sm:text-lg font-semibold truncate">{client.store?.name}</h3>
              <Badge className={`${statusColor} rounded-xs`}>
                {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </Badge>
              {client.recurringSchedule?.enabled && (
                <span title="Recurring Schedule">
                  <Repeat className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 truncate">
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

          <div className="flex flex-wrap gap-4 sm:gap-6 text-xs sm:text-sm">
            <div>
              <span className="text-muted-foreground">Rep: </span>
              <span className="font-medium">
                {client.assignedRep?.name || "Unassigned"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Approved: </span>
              <span className="font-medium text-green-600 dark:text-green-400">
                {client.labelCounts?.approved || 0}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">In Progress: </span>
              <span className="font-medium text-yellow-600 dark:text-yellow-400">
                {client.labelCounts?.inProgress || 0}
              </span>
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" className="rounded-xs self-start lg:self-center" onClick={handleViewClient}>
          <Eye className="mr-2 h-4 w-4" />
          View
        </Button>
      </div>
    </Card>
  );
};
