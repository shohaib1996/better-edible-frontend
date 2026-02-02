"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Repeat } from "lucide-react";
import { useGetPrivateLabelClientByIdQuery } from "@/redux/api/PrivateLabel/privateLabelClientApi";
import { useGetAllLabelsQuery } from "@/redux/api/PrivateLabel/labelApi";
import { LabelCard } from "./LabelCard";
import { AddLabelModal } from "./AddLabelModal";
import { RecurringScheduleSection } from "./RecurringScheduleSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

interface SingleClientPageProps {
  clientId: string;
}

export const SingleClientPage = ({ clientId }: SingleClientPageProps) => {
  const router = useRouter();
  const [addLabelModalOpen, setAddLabelModalOpen] = useState(false);

  const {
    data: client,
    isLoading: clientLoading,
    refetch: refetchClient,
  } = useGetPrivateLabelClientByIdQuery(clientId, {
    refetchOnMountOrArgChange: true,
  });

  const {
    data: labelsData,
    isLoading: labelsLoading,
    refetch: refetchLabels,
  } = useGetAllLabelsQuery(
    { clientId, limit: 100 },
    { refetchOnMountOrArgChange: true }
  );

  const labels = labelsData?.labels || [];

  const handleUpdate = () => {
    refetchClient();
    refetchLabels();
  };

  if (clientLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-4 sm:p-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/manage-clients")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Clients
        </Button>
        <p className="text-muted-foreground text-center mt-8">
          Client not found.
        </p>
      </div>
    );
  }

  const statusColor =
    client.status === "active"
      ? "bg-green-500 text-white"
      : "bg-yellow-500 text-white";

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/admin/manage-clients")}
        className="mb-2"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Clients
      </Button>

      {/* Client Header */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold">
                {client.store?.name}
              </h1>
              <Badge className={statusColor}>
                {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
              </Badge>
              {client.recurringSchedule?.enabled && (
                <span title="Recurring Schedule">
                  <Repeat className="h-5 w-5 text-blue-600" />
                </span>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              {client.store?.city}, {client.store?.state}
            </p>
          </div>

          <div className="flex gap-6 text-sm">
            <div className="text-center">
              <span className="text-2xl font-bold text-green-600">
                {client.labelCounts?.approved || 0}
              </span>
              <p className="text-muted-foreground">Approved Labels</p>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-yellow-600">
                {client.labelCounts?.inProgress || 0}
              </span>
              <p className="text-muted-foreground">In Progress</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
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

          {labelsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin h-6 w-6" />
            </div>
          ) : labels.length > 0 ? (
            <div className="space-y-3">
              {labels.map((label) => (
                <LabelCard
                  key={label._id}
                  label={label}
                  onUpdate={handleUpdate}
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
          <RecurringScheduleSection client={client} onUpdate={handleUpdate} />
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div>
                <span className="text-muted-foreground">Store Name:</span>
                <p className="font-medium text-lg">{client.store?.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Contact Email:</span>
                <p className="font-medium text-lg">{client.contactEmail}</p>
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
                <p className="font-medium text-lg">{client.assignedRep?.name}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <p className="font-medium capitalize text-lg">{client.status}</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Label Modal */}
      <AddLabelModal
        open={addLabelModalOpen}
        onClose={() => setAddLabelModalOpen(false)}
        clientId={client._id}
        onSuccess={handleUpdate}
      />
    </div>
  );
};
