"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useGetAllPartnershipStoresQuery,
  useApprovePartnershipMutation,
  useRejectPartnershipMutation,
  useRemovePartnershipMutation,
} from "@/redux/api/Partnership/partnershipApi";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { IPartnershipEnrollment } from "@/types/partnership/partnership";

const STATUS_BADGE: Record<IPartnershipEnrollment["status"], string> = {
  pending_approval: "bg-amber-100 text-amber-800 border-amber-300",
  active: "bg-green-100 text-green-800 border-green-300",
  pending_setup: "bg-blue-100 text-blue-800 border-blue-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
};

const STATUS_LABEL: Record<IPartnershipEnrollment["status"], string> = {
  pending_approval: "Pending Approval",
  active: "Active",
  pending_setup: "Pending Setup",
  rejected: "Rejected",
};

type FilterStatus = "all" | IPartnershipEnrollment["status"];

export default function AdminPartnershipPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [removingStore, setRemovingStore] = useState<{ storeId: string; name: string } | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data: pendingData, isLoading: pendingLoading } =
    useGetAllPartnershipStoresQuery({ status: "pending_approval" });

  const { data: allData, isLoading: allLoading } = useGetAllPartnershipStoresQuery(
    filter === "all" ? { page, limit } : { status: filter, page, limit }
  );

  const [approvePartnership, { isLoading: isApproving }] = useApprovePartnershipMutation();
  const [rejectPartnership, { isLoading: isRejecting }] = useRejectPartnershipMutation();
  const [removePartnership, { isLoading: isRemoving }] = useRemovePartnershipMutation();

  const pendingStores = pendingData?.stores ?? [];
  const allStores = allData?.stores ?? [];
  const totalCount = allData?.totalCount ?? 0;
  const totalPages = allData?.totalPages ?? 1;

  async function handleApprove(storeId: string) {
    try {
      await approvePartnership({ storeId }).unwrap();
      toast.success("Partnership approved");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to approve");
    }
  }

  async function handleReject(storeId: string) {
    setRejectingId(storeId);
    try {
      await rejectPartnership({ storeId }).unwrap();
      toast.success("Partnership rejected");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to reject");
    } finally {
      setRejectingId(null);
    }
  }

  async function handleRemove() {
    if (!removingStore) return;
    try {
      await removePartnership({ storeId: removingStore.storeId }).unwrap();
      toast.success("Partnership removed");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to remove partnership");
    } finally {
      setRemovingStore(null);
    }
  }

  function handleFilterChange(f: FilterStatus) {
    setFilter(f);
    setPage(1);
  }

  const FILTERS: { key: FilterStatus; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "pending_setup", label: "Pending Setup" },
    { key: "pending_approval", label: "Pending Approval" },
    { key: "rejected", label: "Rejected" },
  ];

  return (
    <div className="p-6 flex flex-col gap-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Partnership Program</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage store consignment enrollments, inventory, and billing.
        </p>
      </div>

      {/* ── Pending approval section ──────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">Pending Approval</h2>
          {pendingStores.length > 0 && (
            <Badge className="rounded-xs bg-amber-100 text-amber-800 border-amber-300">
              {pendingData?.totalCount ?? pendingStores.length}
            </Badge>
          )}
        </div>

        {pendingLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : pendingStores.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            No pending applications.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {pendingStores.map((s) => {
              const store = (s.storeId as any);
              const storeName = store?.name ?? "Unknown Store";
              const city = store?.city ?? "";
              const state = store?.state ?? "";

              return (
                <div
                  key={s._id}
                  className="rounded-xs border bg-card px-4 py-3 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{storeName}</p>
                    {(city || state) && (
                      <p className="text-xs text-muted-foreground">
                        {[city, state].filter(Boolean).join(", ")}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Requested{" "}
                      {new Date(s.requestedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="rounded-xs bg-green-600 hover:bg-green-700 text-white gap-1.5"
                      onClick={() => handleApprove((s.storeId as any)?._id ?? s.storeId)}
                      disabled={isApproving}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xs text-destructive border-destructive/40 hover:bg-destructive/5 gap-1.5"
                      onClick={() => handleReject((s.storeId as any)?._id ?? s.storeId)}
                      disabled={rejectingId === s._id && isRejecting}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── All stores section ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold">All Stores</h2>

        <div className="flex gap-0.5 flex-wrap p-1 bg-muted/60 border border-border rounded-xs w-fit">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => handleFilterChange(f.key)}
              className={`px-3 py-1.5 rounded-xs text-sm font-medium transition-colors ${
                filter === f.key
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {allLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : allStores.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No stores found.</p>
        ) : (
          <>
            <div className="rounded-xs border border-border bg-card shadow-sm">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-muted/50">
                    <TableHead className="px-4 py-3 font-medium text-muted-foreground">Store</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-muted-foreground">City</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-muted-foreground">Status</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-muted-foreground">POS</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-muted-foreground">Requested</TableHead>
                    <TableHead className="px-4 py-3 w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allStores.map((s) => {
                    const store = (s.storeId as any);
                    const storeName = store?.name ?? "Unknown Store";
                    const city = store?.city ?? "—";
                    const storeIdStr = store?._id ?? s.storeId;

                    return (
                      <TableRow
                        key={s._id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/admin/partnership/${storeIdStr}`)}
                      >
                        <TableCell className="px-4 py-3 font-medium">{storeName}</TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground">{city}</TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge className={`rounded-xs text-xs ${STATUS_BADGE[s.status]}`}>
                            {STATUS_LABEL[s.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          {s.posApiConnected ? (
                            <span className="text-green-700 text-xs font-medium">Connected</span>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground">
                          {new Date(s.requestedAt).toLocaleDateString("en-US", {
                            month: "short", day: "numeric", year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="px-2 py-3 text-right">
                          {s.status === "active" && (
                            <button
                              className="p-1.5 rounded-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Remove partnership"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRemovingStore({ storeId: storeIdStr, name: storeName });
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <GlobalPagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={limit}
              onPageChange={setPage}
              onLimitChange={(l) => { setLimit(l); setPage(1); }}
              limitOptions={[10, 20, 50, 100]}
            />
          </>
        )}
      </div>
      <AlertDialog open={!!removingStore} onOpenChange={(open) => { if (!open) setRemovingStore(null); }}>
        <AlertDialogContent className="rounded-xs">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Partnership</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <span className="font-semibold text-foreground">{removingStore?.name}</span> from the partnership program and delete their POS API key. Sales from this store will no longer be monitored. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xs" disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xs bg-destructive hover:bg-destructive/90 text-white"
              onClick={handleRemove}
              disabled={isRemoving}
            >
              {isRemoving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Remove Partnership
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
