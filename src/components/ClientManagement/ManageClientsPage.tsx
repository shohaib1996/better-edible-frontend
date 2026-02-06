"use client";

import { useState } from "react";
import { Loader2, Users } from "lucide-react";
import { useGetAllPrivateLabelClientsQuery } from "@/redux/api/PrivateLabel/privateLabelClientApi";
import { useGetAllRepsQuery } from "@/redux/api/Rep/repApi";
import { ClientCard } from "./ClientCard";
import { ClientFilters } from "./ClientFilters";
import { AddClientModal } from "./AddClientModal";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { Button } from "@/components/ui/button";
import { useUser } from "@/redux/hooks/useAuth";

interface ManageClientsPageProps {
  isRepView?: boolean;
  currentRepId?: string;
}

export const ManageClientsPage = ({
  isRepView = false,
  currentRepId,
}: ManageClientsPageProps) => {
  const user = useUser();
  const isAdmin = user?.role === "superadmin";

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [repFilter, setRepFilter] = useState<string>(isRepView && currentRepId ? currentRepId : "");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [addModalOpen, setAddModalOpen] = useState(false);

  const { data: reps } = useGetAllRepsQuery({});
  const allReps = reps?.data || [];

  const { data, isLoading } = useGetAllPrivateLabelClientsQuery(
    {
      status: statusFilter !== "all" ? statusFilter : undefined,
      repId: isRepView ? currentRepId : (repFilter || undefined),
      search: searchQuery || undefined,
      page: currentPage,
      limit: limit,
    },
    { refetchOnMountOrArgChange: true },
  );

  const clients = data?.clients || [];
  const totalClients = data?.total || 0;
  const totalPages = Math.ceil(totalClients / limit);

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
            <span>{isRepView ? "My Private Label Clients" : "Manage Private Label Clients"}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Total Clients: <span className="font-medium">{totalClients}</span>
          </p>
        </div>
        <Button onClick={() => setAddModalOpen(true)}>+ Add New Client</Button>
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

      {/* Client List */}
      <div className="space-y-4">
        {clients.map((client) => (
          <ClientCard key={client._id} client={client} isRepView={isRepView} />
        ))}
      </div>

      {clients.length === 0 && (
        <p className="text-muted-foreground text-center mt-8">
          No clients found.
        </p>
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
