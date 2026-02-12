"use client";

import { useState } from "react";
import { Loader2, Users, Repeat, Eye } from "lucide-react";
import { useGetAllPrivateLabelClientsQuery } from "@/redux/api/PrivateLabel/privateLabelClientApi";
import { useGetAllRepsQuery } from "@/redux/api/Rep/repApi";
import { ClientCard } from "./ClientCard";
import { ClientFilters } from "./ClientFilters";
import { AddClientModal } from "./AddClientModal";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { Button } from "@/components/ui/button";
import { useUser } from "@/redux/hooks/useAuth";
import { DataTable, Column } from "@/components/ReUsableComponents/DataTable";
import { IPrivateLabelClient } from "@/types";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

interface ManageClientsPageProps {
  isRepView?: boolean;
  currentRepId?: string;
}

export const ManageClientsPage = ({
  isRepView = false,
  currentRepId,
}: ManageClientsPageProps) => {
  const router = useRouter();
  const user = useUser();
  const isAdmin = user?.role === "superadmin";

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [repFilter, setRepFilter] = useState<string>(
    isRepView && currentRepId ? currentRepId : "",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const { data: reps } = useGetAllRepsQuery({});
  const allReps = reps?.data || [];

  const { data, isLoading } = useGetAllPrivateLabelClientsQuery(
    {
      status: statusFilter !== "all" ? statusFilter : undefined,
      repId: repFilter || undefined,
      search: searchQuery || undefined,
      page: currentPage,
      limit: limit,
    },
    { refetchOnMountOrArgChange: true },
  );

  const clients = data?.clients || [];
  const totalClients = data?.total || 0;
  const totalPages = Math.ceil(totalClients / limit);

  const handleViewClient = (clientId: string) => {
    const basePath = isRepView
      ? "/rep/manage-clients"
      : "/admin/manage-clients";
    router.push(`${basePath}/${clientId}`);
  };

  const columns: Column<IPrivateLabelClient>[] = [
    {
      key: "store",
      header: "Store Details",
      render: (client) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{client.store?.name}</span>
          <span className="text-xs text-muted-foreground">
            {[
              client.store?.address,
              client.store?.city,
              client.store?.state,
              client.store?.zip,
            ]
              .filter(Boolean)
              .join(", ")}
          </span>
        </div>
      ),
    },
    {
      key: "rep",
      header: "Rep",
      render: (client) => (
        <span className="text-sm">
          {client.assignedRep?.name || "Unassigned"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (client) => {
        const statusColor =
          client.status === "active"
            ? "bg-green-500 hover:bg-green-600"
            : "bg-yellow-500 hover:bg-yellow-600";
        return (
          <div className="flex items-center gap-2">
            <Badge className={`${statusColor} text-white rounded-xs`}>
              {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
            </Badge>
            {client.recurringSchedule?.enabled && (
              <span title="Recurring Schedule">
                <Repeat className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "orders",
      header: "Orders",
      render: (client) => (
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Approved:</span>
            <span className="font-medium text-green-600 dark:text-green-400">
              {client.labelCounts?.approved || 0}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">In Progress:</span>
            <span className="font-medium text-yellow-600 dark:text-yellow-400">
              {client.labelCounts?.inProgress || 0}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (client) => (
        <Button
          variant="outline"
          size="sm"
          className="rounded-xs h-8 dark:bg-primary dark:text-white hover:dark:bg-primary/80 hover:dark:text-white"
          onClick={() => handleViewClient(client._id)}
        >
          <Eye className="mr-2 h-3.5 w-3.5" />
          View
        </Button>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            <span>
              {isRepView
                ? "My Private Label Clients"
                : "Manage Private Label Clients"}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Total Clients: <span className="font-medium">{totalClients}</span>
          </p>
        </div>
        <Button
          className="w-full sm:w-auto rounded-xs"
          onClick={() => setAddModalOpen(true)}
        >
          + Add New Client
        </Button>
      </div>

      {/* Filters */}
      <ClientFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        repFilter={repFilter}
        onRepFilterChange={setRepFilter}
        allReps={allReps}
        hideRepFilter={isRepView}
      />

      {clients.length === 0 ? (
        <p className="text-muted-foreground text-center mt-8">
          No clients found.
        </p>
      ) : (
        <>
          {/* Desktop View: Table */}
          <div className="hidden md:block">
            <DataTable
              columns={columns}
              data={clients}
              isLoading={isLoading}
              emptyMessage="No clients found"
            />
          </div>

          {/* Mobile View: Cards */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {clients.map((client) => (
              <ClientCard
                key={client._id}
                client={client}
                isRepView={isRepView}
              />
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalClients > 0 && (
        <GlobalPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalClients}
          itemsPerPage={limit}
          onPageChange={setCurrentPage}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setCurrentPage(1);
          }}
        />
      )}

      {/* Add Client Modal */}
      <AddClientModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={() => {}}
        isRepView={isRepView}
        currentRepId={currentRepId}
      />
    </div>
  );
};
