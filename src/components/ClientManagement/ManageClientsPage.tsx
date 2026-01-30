"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useGetAllPrivateLabelClientsQuery } from "@/redux/api/PrivateLabel/privateLabelClientApi";
import { useGetAllRepsQuery } from "@/redux/api/Rep/repApi";
import { ClientCard } from "./ClientCard";
import { ClientFilters } from "./ClientFilters";
import { AddClientModal } from "./AddClientModal";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { Button } from "@/components/ui/button";

export const ManageClientsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [repFilter, setRepFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(
    new Set()
  );

  const { data: reps } = useGetAllRepsQuery({});
  const allReps = reps?.data || [];

  const { data, isLoading, refetch } = useGetAllPrivateLabelClientsQuery(
    {
      status: statusFilter !== "all" ? statusFilter : undefined,
      repId: repFilter || undefined,
      search: searchQuery || undefined,
      page: currentPage,
      limit: limit,
    },
    { refetchOnMountOrArgChange: true }
  );

  const clients = data?.clients || [];
  const totalClients = data?.total || 0;
  const totalPages = Math.ceil(totalClients / limit);

  const toggleExpanded = (clientId: string) => {
    setExpandedClients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-foreground">
            Manage Clients
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
      />

      {/* Client List */}
      <div className="space-y-4">
        {clients.map((client) => (
          <ClientCard
            key={client._id}
            client={client}
            isExpanded={expandedClients.has(client._id)}
            onToggleExpand={() => toggleExpanded(client._id)}
            onUpdate={refetch}
          />
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
        onSuccess={refetch}
      />
    </div>
  );
};
