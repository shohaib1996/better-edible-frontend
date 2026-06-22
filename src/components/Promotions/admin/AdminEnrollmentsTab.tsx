"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  useGetAllPromotionEnrollmentsQuery,
  useApprovePromotionEnrollmentMutation,
  useRejectPromotionEnrollmentMutation,
} from "@/redux/api/Promotions/promotionsApi";
import type { IPromotionEnrollment } from "@/types/promotions/promotions";

const STATUS_BADGE: Record<IPromotionEnrollment["status"], string> = {
  pending_approval: "bg-amber-100 text-amber-800 border-amber-300",
  active: "bg-green-100 text-green-800 border-green-300",
  rejected: "bg-red-100 text-red-800 border-red-300",
};

const STATUS_LABEL: Record<IPromotionEnrollment["status"], string> = {
  pending_approval: "Pending",
  active: "Active",
  rejected: "Rejected",
};

export default function AdminEnrollmentsTab() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const { data: pendingData } = useGetAllPromotionEnrollmentsQuery({ status: "pending_approval" });
  const { data, isLoading } = useGetAllPromotionEnrollmentsQuery({ page, limit });

  const [approve, { isLoading: isApproving }] = useApprovePromotionEnrollmentMutation();
  const [reject, { isLoading: isRejecting }] = useRejectPromotionEnrollmentMutation();

  const pendingEnrollments = pendingData?.enrollments ?? [];
  const enrollments = data?.enrollments ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? 0;

  async function handleApprove(storeId: string) {
    try {
      await approve({ storeId }).unwrap();
      toast.success("Enrollment approved");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to approve");
    }
  }

  async function handleReject(storeId: string) {
    setRejectingId(storeId);
    try {
      await reject({ storeId }).unwrap();
      toast.success("Enrollment rejected");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to reject");
    } finally {
      setRejectingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Pending section */}
      {pendingEnrollments.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Pending Approval</h3>
            <Badge className="rounded-xs bg-amber-100 text-amber-800 border-amber-300">
              {pendingEnrollments.length}
            </Badge>
          </div>
          <div className="flex flex-col gap-2">
            {pendingEnrollments.map((e) => {
              const store = e.storeId as any;
              const storeName = store?.name ?? "Unknown Store";
              const storeIdStr = store?._id ?? (e.storeId as string);
              return (
                <div key={e._id} className="rounded-xs border bg-card px-4 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{storeName}</p>
                    {(store?.city || store?.state) && (
                      <p className="text-xs text-muted-foreground">{[store.city, store.state].filter(Boolean).join(", ")}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Requested {new Date(e.requestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="rounded-xs bg-green-600 hover:bg-green-700 text-white gap-1.5"
                      onClick={() => handleApprove(storeIdStr)}
                      disabled={isApproving}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xs text-destructive border-destructive/40 hover:bg-destructive/5 gap-1.5"
                      onClick={() => handleReject(storeIdStr)}
                      disabled={rejectingId === storeIdStr && isRejecting}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All enrollments table */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">All Enrollments</h3>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading…</span>
          </div>
        ) : enrollments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">No enrollments found.</p>
        ) : (
          <>
            <div className="rounded-xs border border-border bg-card shadow-sm">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-muted/50">
                    <TableHead className="px-4 py-3 font-medium text-muted-foreground">Store</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-muted-foreground">Status</TableHead>
                    <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Credit Balance</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-muted-foreground">Requested</TableHead>
                    <TableHead className="px-4 py-3 font-medium text-muted-foreground">Approved</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((e) => {
                    const store = e.storeId as any;
                    const storeName = store?.name ?? "Unknown Store";
                    return (
                      <TableRow key={e._id}>
                        <TableCell className="px-4 py-3 font-medium text-sm">{storeName}</TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge className={`rounded-xs text-xs ${STATUS_BADGE[e.status]}`}>
                            {STATUS_LABEL[e.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right font-semibold text-green-700">
                          ${e.creditBalance.toFixed(2)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                          {new Date(e.requestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                          {e.approvedAt
                            ? new Date(e.approvedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                            : "—"}
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
    </div>
  );
}
