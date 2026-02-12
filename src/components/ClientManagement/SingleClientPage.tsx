"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Repeat, Pencil } from "lucide-react";
import { useGetPrivateLabelClientByIdQuery } from "@/redux/api/PrivateLabel/privateLabelClientApi";
import { useGetAllLabelsQuery } from "@/redux/api/PrivateLabel/labelApi";
import { LabelCard } from "./LabelCard";
import { AddLabelModal } from "./AddLabelModal";
import { EditClientInfoModal } from "./EditClientInfoModal";
import { RecurringScheduleSection } from "./RecurringScheduleSection";
import { BulkStageUpdateSection } from "./BulkStageUpdateSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import {
  CLIENT_STATUS_COLORS,
  CLIENT_STATUS_LABELS,
  ClientStatus,
} from "@/constants/privateLabel";

interface SingleClientPageProps {
  clientId: string;
  isRepView?: boolean;
}

export const SingleClientPage = ({
  clientId,
  isRepView = false,
}: SingleClientPageProps) => {
  const router = useRouter();
  const [addLabelModalOpen, setAddLabelModalOpen] = useState(false);
  const [editInfoModalOpen, setEditInfoModalOpen] = useState(false);

  const backPath = isRepView ? "/rep/manage-clients" : "/admin/manage-clients";

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
    { refetchOnMountOrArgChange: true },
  );

  const labels = labelsData?.labels || [];

  // Calculate label counts from the labels data
  const labelCounts = useMemo(() => {
    const approved = labels.filter(
      (label) => label.currentStage === "ready_for_production",
    ).length;
    const inProgress = labels.filter(
      (label) => label.currentStage !== "ready_for_production",
    ).length;
    return { approved, inProgress };
  }, [labels]);

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
          onClick={() => router.push(backPath)}
          className="mb-4 rounded-xs"
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
    CLIENT_STATUS_COLORS[client.status as ClientStatus] ||
    CLIENT_STATUS_COLORS.onboarding;
  const statusLabel =
    CLIENT_STATUS_LABELS[client.status as ClientStatus] || client.status;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push(backPath)}
        className="mb-2 rounded-xs"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Clients
      </Button>

      {/* Client Header */}
      <Card className="p-4 sm:p-6 rounded-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold truncate">
                {client.store?.name}
              </h1>
              <Badge className={`${statusColor} rounded-xs`}>
                {statusLabel}
              </Badge>
              {client.recurringSchedule?.enabled && (
                <span title="Recurring Schedule">
                  <Repeat className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {client.store?.city}, {client.store?.state}
            </p>
          </div>

          <div className="flex gap-4 sm:gap-6 text-sm">
            <div className="text-center">
              <span className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                {labelCounts.approved}
              </span>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Approved
              </p>
            </div>
            <div className="text-center">
              <span className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {labelCounts.inProgress}
              </span>
              <p className="text-xs sm:text-sm text-muted-foreground">
                In Progress
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="labels" className="w-full">
        <TabsList className="w-full sm:w-auto flex justify-start rounded-xs overflow-x-auto scrollbar-hidden">
          <TabsTrigger
            value="labels"
            className="flex-1 sm:flex-initial rounded-xs text-xs sm:text-sm"
          >
            Labels
          </TabsTrigger>
          <TabsTrigger
            value="schedule"
            className="flex-1 sm:flex-initial rounded-xs text-xs sm:text-sm"
          >
            Schedule
          </TabsTrigger>
          <TabsTrigger
            value="info"
            className="flex-1 sm:flex-initial rounded-xs text-xs sm:text-sm"
          >
            Store Info
          </TabsTrigger>
        </TabsList>

        {/* Labels Tab */}
        <TabsContent value="labels" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="text-base sm:text-lg font-semibold">
              Labels ({labels.length})
            </h3>
            <Button
              onClick={() => setAddLabelModalOpen(true)}
              className="rounded-xs"
            >
              + Add New Label
            </Button>
          </div>

          {labelsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin h-6 w-6" />
            </div>
          ) : labels.length > 0 ? (
            <div className="space-y-4">
              {/* Bulk Stage Update Section */}
              <BulkStageUpdateSection
                clientId={clientId}
                labels={labels}
                onUpdate={handleUpdate}
              />

              {/* Label Cards */}
              <div className="space-y-3">
                {labels.map((label) => (
                  <LabelCard
                    key={label._id}
                    label={label}
                    onUpdate={handleUpdate}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-center py-8 bg-muted/30 rounded-xs border border-dashed">
              No labels yet. Add a label to get started.
            </div>
          )}
        </TabsContent>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="mt-4">
          <RecurringScheduleSection client={client} onUpdate={handleUpdate} />
        </TabsContent>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="text-base sm:text-lg font-semibold">
              Store Information
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditInfoModalOpen(true)}
              className="rounded-xs bg-accent text-accent-foreground dark:bg-primary dark:text-white dark:hover:bg-primary/80"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Info
            </Button>
          </div>
          <Card className="p-4 sm:p-6 rounded-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-sm">
              <div className="space-y-1">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Store Name
                </span>
                <p className="font-medium text-base sm:text-lg">
                  {client.store?.name}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Contact Email
                </span>
                <p className="font-medium text-base sm:text-lg break-all">
                  {client.contactEmail}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Address
                </span>
                <p className="font-medium text-sm sm:text-base">
                  {client.store?.address}, {client.store?.city},{" "}
                  {client.store?.state} {client.store?.zip}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Assigned Rep
                </span>
                <p className="font-medium text-base sm:text-lg">
                  {client.assignedRep?.name}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Status
                </span>
                <p className="font-medium capitalize text-base sm:text-lg">
                  {client.status}
                </p>
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

      {/* Edit Client Info Modal */}
      <EditClientInfoModal
        open={editInfoModalOpen}
        onClose={() => setEditInfoModalOpen(false)}
        client={client}
        onSuccess={handleUpdate}
        isRepView={isRepView}
      />
    </div>
  );
};
