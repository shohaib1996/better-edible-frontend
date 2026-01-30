"use client";

import { useState } from "react";
import { IPrivateLabelClient } from "@/types";
import { useGetAllLabelsQuery } from "@/redux/api/PrivateLabel/labelApi";
import { LabelCard } from "./LabelCard";
import { AddLabelModal } from "./AddLabelModal";
import { BulkStageUpdateSection } from "./BulkStageUpdateSection";
import { RecurringScheduleSection } from "./RecurringScheduleSection";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

interface ClientExpandedViewProps {
  client: IPrivateLabelClient;
  onUpdate: () => void;
}

export const ClientExpandedView = ({
  client,
  onUpdate,
}: ClientExpandedViewProps) => {
  const [addLabelModalOpen, setAddLabelModalOpen] = useState(false);

  const { data, isLoading, refetch } = useGetAllLabelsQuery(
    {
      clientId: client._id,
      limit: 100,
    },
    { refetchOnMountOrArgChange: true }
  );

  const labels = data?.labels || [];

  return (
    <div className="space-y-6">
      {/* Tabs for different sections */}
      <Tabs defaultValue="labels" className="w-full">
        <TabsList>
          <TabsTrigger value="labels">Labels</TabsTrigger>
          <TabsTrigger value="schedule">Recurring Schedule</TabsTrigger>
          <TabsTrigger value="info">Store Info</TabsTrigger>
        </TabsList>

        {/* Labels Tab */}
        <TabsContent value="labels" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Labels ({labels.length})</h3>
            <Button onClick={() => setAddLabelModalOpen(true)}>
              + Add New Label
            </Button>
          </div>

          {/* Bulk Stage Update */}
          {labels.length > 0 && (
            <BulkStageUpdateSection
              clientId={client._id}
              labels={labels}
              onUpdate={() => {
                refetch();
                onUpdate();
              }}
            />
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin h-6 w-6" />
            </div>
          ) : labels.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {labels.map((label) => (
                <LabelCard
                  key={label._id}
                  label={label}
                  onUpdate={() => {
                    refetch();
                    onUpdate();
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No labels yet. Add a label to get started.
            </p>
          )}
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <RecurringScheduleSection client={client} onUpdate={onUpdate} />
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Store Name:</span>
              <p className="font-medium">{client.store?.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Contact Email:</span>
              <p className="font-medium">{client.contactEmail}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Address:</span>
              <p className="font-medium">
                {client.store?.address}, {client.store?.city},{" "}
                {client.store?.state} {client.store?.zip}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Assigned Rep:</span>
              <p className="font-medium">{client.assignedRep?.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p className="font-medium capitalize">{client.status}</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Label Modal */}
      <AddLabelModal
        open={addLabelModalOpen}
        onClose={() => setAddLabelModalOpen(false)}
        clientId={client._id}
        onSuccess={() => {
          refetch();
          onUpdate();
        }}
      />
    </div>
  );
};
