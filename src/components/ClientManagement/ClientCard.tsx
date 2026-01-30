"use client";

import { ChevronDown, ChevronUp, Repeat } from "lucide-react";
import { IPrivateLabelClient } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ClientExpandedView } from "./ClientExpandedView";

interface ClientCardProps {
  client: IPrivateLabelClient;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: () => void;
}

export const ClientCard = ({
  client,
  isExpanded,
  onToggleExpand,
  onUpdate,
}: ClientCardProps) => {
  const statusColor =
    client.status === "active"
      ? "bg-green-500 text-white"
      : "bg-yellow-500 text-white";

  return (
    <Card className="p-4">
      {/* Collapsed View */}
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

        <Button variant="ghost" size="sm" onClick={onToggleExpand}>
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t">
          <ClientExpandedView client={client} onUpdate={onUpdate} />
        </div>
      )}
    </Card>
  );
};
