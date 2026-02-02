"use client";

import { useRouter } from "next/navigation";
import { Repeat, Eye } from "lucide-react";
import { IPrivateLabelClient } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ClientCardProps {
  client: IPrivateLabelClient;
}

export const ClientCard = ({ client }: ClientCardProps) => {
  const router = useRouter();

  const statusColor =
    client.status === "active"
      ? "bg-green-500 text-white"
      : "bg-yellow-500 text-white";

  const handleViewClient = () => {
    router.push(`/admin/manage-clients/${client._id}`);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{client.store?.name}</h3>
              <Badge className={statusColor}>
                {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </Badge>
              {client.recurringSchedule?.enabled && (
                <span title="Recurring Schedule">
                  <Repeat className="h-4 w-4 text-blue-600" />
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {client.store?.city}, {client.store?.state}
            </p>
          </div>

          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Approved Labels: </span>
              <span className="font-medium">
                {client.labelCounts?.approved || 0}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">In Progress: </span>
              <span className="font-medium">
                {client.labelCounts?.inProgress || 0}
              </span>
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleViewClient}>
          <Eye className="mr-2 h-4 w-4" />
          View
        </Button>
      </div>
    </Card>
  );
};
