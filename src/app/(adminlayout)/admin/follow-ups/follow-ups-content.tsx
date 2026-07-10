"use client";

import { useState } from "react";
import { format, differenceInCalendarDays } from "date-fns";
import { CalendarDays, MessageSquare, Pencil } from "lucide-react";
import { useGetAllFollowupsQuery } from "@/redux/api/Followups/followupsApi";
import { useDebounced } from "@/redux/hooks/hooks";
import { useGetAllRepsQuery } from "@/redux/api/Rep/repApi";
import { ManageFollowUpModal } from "@/components/Followup/ManageFollowUpModal";
import { FollowUpFilters } from "@/components/Followup/FollowUpFilters";
import { useFollowUpColumns } from "@/components/Followup/useFollowUpColumns";
import { DataTable } from "@/components/ReUsableComponents/DataTable";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toLocalDate } from "@/lib/followupUtils";
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
            {/* ── Mobile cards (< md) ─────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 md:hidden">
              {followups.map((f) => {
                const dateStr = (f as any).followupDate as string | undefined;
                const local = toLocalDate(dateStr);
                const delay = local ? Math.max(0, differenceInCalendarDays(new Date(), local)) : 0;
                return (
                  <div
                    key={f._id}
                    className="bg-card border border-border rounded-md p-4 space-y-3"
                  >
                    {/* Store name + edit */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground leading-tight truncate">
                          {f.store?.name || "—"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {f.store?.address || ""}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 shrink-0 rounded-xs bg-secondary text-white border-secondary hover:bg-primary hover:border-primary"
                        onClick={() => { setSelectedFollowup(f); setEditModalOpen(true); }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Rep</p>
                        <p className="text-primary font-medium">{f.rep?.name || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Follow-up Date</p>
                        <p className="text-foreground">
                          {dateStr && local ? format(local, "MMM dd, yyyy") : "No date"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Status</p>
                        {delay > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-xs bg-accent/20 text-accent font-medium text-xs">
                            {delay} day{delay > 1 ? "s" : ""} late
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-xs bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                            On time
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Note */}
                    {f.comments && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Note</p>
                        <p className="text-sm text-foreground whitespace-normal leading-snug">
                          {f.comments}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── Desktop table (≥ md) ─────────────────────────────────────────── */}
            <div className="hidden md:block">
              <DataTable columns={columns} data={followups} />
            </div>

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
