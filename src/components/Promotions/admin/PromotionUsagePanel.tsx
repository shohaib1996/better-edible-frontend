"use client";

import { useState } from "react";
import { Loader2, ArrowLeft } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { useGetPromotionUsageQuery } from "@/redux/api/Promotions/promotionsApi";
import { fmtDate } from "@/utils/promotionHelpers";

interface Props {
  promotionId: string;
  onBack: () => void;
}

export function PromotionUsagePanel({ promotionId, onBack }: Props) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetPromotionUsageQuery({ id: promotionId, page, limit: 20 });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <h2 className="text-base font-semibold">{data?.promotion?.name ?? "Usage"}</h2>
      </div>

      {data && (
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xs border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total Uses</p>
            <p className="text-2xl font-bold mt-1">{data.promotion.usedCount}</p>
          </div>
          <div className="rounded-xs border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total Discount Given</p>
            <p className="text-2xl font-bold mt-1">${data.totalDiscount.toFixed(2)}</p>
          </div>
          <div className="rounded-xs border bg-card p-4">
            <p className="text-xs text-muted-foreground">Avg Discount</p>
            <p className="text-2xl font-bold mt-1">
              {data.totalCount > 0 ? `$${(data.totalDiscount / data.totalCount).toFixed(2)}` : "—"}
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading usage…</span>
        </div>
      ) : !data?.usages.length ? (
        <p className="text-sm text-muted-foreground py-4">No usage records yet.</p>
      ) : (
        <>
          <div className="rounded-xs border border-border bg-card shadow-sm">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="px-4 py-3 font-medium text-muted-foreground">Store</TableHead>
                  <TableHead className="px-4 py-3 font-medium text-muted-foreground">Order</TableHead>
                  <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Discount</TableHead>
                  <TableHead className="px-4 py-3 font-medium text-muted-foreground">Applied By</TableHead>
                  <TableHead className="px-4 py-3 font-medium text-muted-foreground">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.usages.map((u) => {
                  const store = typeof u.storeId === "object" ? (u.storeId as any).name : u.storeId;
                  const order = u.orderId
                    ? typeof u.orderId === "object" ? `#${(u.orderId as any).orderNumber}` : u.orderId
                    : "—";
                  return (
                    <TableRow key={u._id}>
                      <TableCell className="px-4 py-3 text-sm font-medium">{store}</TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">{order}</TableCell>
                      <TableCell className="px-4 py-3 text-right text-sm font-semibold text-green-700">
                        ${u.discountAmount.toFixed(2)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground capitalize">{u.appliedBy}</TableCell>
                      <TableCell className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(u.appliedAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {data.totalPages > 1 && (
            <GlobalPagination
              currentPage={page} totalPages={data.totalPages}
              totalItems={data.totalCount} itemsPerPage={20}
              onPageChange={setPage} onLimitChange={() => {}}
            />
          )}
        </>
      )}
    </div>
  );
}
