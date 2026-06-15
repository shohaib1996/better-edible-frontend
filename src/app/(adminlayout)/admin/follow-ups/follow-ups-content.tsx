"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarDays, MessageSquare } from "lucide-react";
import { useGetAllFollowupsQuery } from "@/redux/api/Followups/followupsApi";
import { useDebounced } from "@/redux/hooks/hooks";
import { useGetAllRepsQuery } from "@/redux/api/Rep/repApi";
import { ManageFollowUpModal } from "@/components/Followup/ManageFollowUpModal";
import { FollowUpFilters } from "@/components/Followup/FollowUpFilters";
import { useFollowUpColumns } from "@/components/Followup/useFollowUpColumns";
import { DataTable } from "@/components/ReUsableComponents/DataTable";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { Card } from "@/components/ui/card";
import type { IFollowUp, IRep } from "@/types";

export default function FollowUpsContent() {
  const [selectedRepId, setSelectedRepId] = useState<string | undefined>(undefined);
  const [selectedRep, setSelectedRep] = useState<IRep | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedFollowup, setSelectedFollowup] = useState<IFollowUp | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data: repsData } = useGetAllRepsQuery({});
  const debouncedSearch = useDebounced({ searchQuery: search, delay: 500 });

  const { data, isLoading } = useGetAllFollowupsQuery({
    repId: selectedRepId,
    date: showAll ? undefined : format(selectedDate, "yyyy-MM-dd"),
    storeName: debouncedSearch,
    page: currentPage,
    limit: itemsPerPage,
  });

  const followups: IFollowUp[] = data?.followups || [];
  const totalItems = data?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const columns = useFollowUpColumns((f) => {
    setSelectedFollowup(f);
    setEditModalOpen(true);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-muted-foreground">Loading follow-ups...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="h-6 w-6 text-primary" />
        <h1 className="text-xl md:text-2xl font-semibold text-foreground">Follow Ups</h1>
      </div>

      <FollowUpFilters
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        showAll={showAll}
        setShowAll={setShowAll}
        search={search}
        setSearch={setSearch}
        selectedRepId={selectedRepId}
        setSelectedRepId={setSelectedRepId}
        setSelectedRep={setSelectedRep}
        repsData={repsData}
        onPageReset={() => setCurrentPage(1)}
      />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-lg text-foreground">Followups</h2>
          <span className="text-sm text-muted-foreground">({totalItems} total)</span>
        </div>

        {followups.length === 0 ? (
          <Card className="p-6 rounded-xs text-center border-border">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="h-12 w-12 rounded-full bg-muted/20 flex items-center justify-center">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">No followups found.</p>
            </div>
          </Card>
        ) : (
          <>
            <DataTable columns={columns} data={followups} />
            {totalItems > 0 && (
              <GlobalPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onLimitChange={(limit) => { setItemsPerPage(limit); setCurrentPage(1); }}
                limitOptions={[10, 20, 50, 100]}
              />
            )}
          </>
        )}
      </div>

      <ManageFollowUpModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        followup={selectedFollowup}
      />
    </div>
  );
}
