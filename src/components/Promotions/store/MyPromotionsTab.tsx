"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useGetMyPromotionsQuery } from "@/redux/api/Promotions/promotionsApi";
import type { IStorePromotion } from "@/types/promotions/promotions";
import SalesLogForm from "./SalesLogForm";

interface Props {
  storeId: string;
}

const STATUS_BADGE: Record<IStorePromotion["status"], string> = {
  active: "bg-green-100 text-green-800 border-green-300",
  pending_sales_log: "bg-amber-100 text-amber-800 border-amber-300",
  sales_logged: "bg-blue-100 text-blue-800 border-blue-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABEL: Record<IStorePromotion["status"], string> = {
  active: "Active",
  pending_sales_log: "Log Sales",
  sales_logged: "Sales Logged",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function MyPromotionsTab({ storeId }: Props) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loggingId, setLoggingId] = useState<string | null>(null);

  const { data, isLoading } = useGetMyPromotionsQuery({ storeId, page, limit });

  const storePromotions = data?.storePromotions ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (storePromotions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        You haven't joined any promotions yet.
      </p>
    );
  }

  const logging = loggingId ? storePromotions.find((sp) => sp._id === loggingId) : null;

  if (logging) {
    const rate = logging.creditRatePerUnit ?? 0;
    return (
      <div className="max-w-md">
        <SalesLogForm
          storeId={storeId}
          storePromotion={logging}
          creditRatePerUnit={rate}
          onDone={() => setLoggingId(null)}
          onCancel={() => setLoggingId(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xs border border-border bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-muted/50">
              <TableHead className="px-4 py-3 font-medium text-muted-foreground">Promotion</TableHead>
              <TableHead className="px-4 py-3 font-medium text-muted-foreground">Product</TableHead>
              <TableHead className="px-4 py-3 font-medium text-muted-foreground">Status</TableHead>
              <TableHead className="px-4 py-3 font-medium text-muted-foreground">Dates</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Units Sold</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Credits</TableHead>
              <TableHead className="px-4 py-3 w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {storePromotions.map((sp) => {
              const name = sp.name ?? sp.productName ?? "—";
              const product = sp.productName ?? "—";
              const startStr = sp.startDate
                ? new Date(sp.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "—";
              const endStr = sp.endDate
                ? new Date(sp.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "—";

              return (
                <TableRow key={sp._id}>
                  <TableCell className="px-4 py-3 font-medium text-sm">{name}</TableCell>
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground">{product}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge className={`rounded-xs text-xs ${STATUS_BADGE[sp.status]}`}>
                      {STATUS_LABEL[sp.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {startStr} — {endStr}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right text-sm text-muted-foreground">
                    {sp.unitsSold.toLocaleString()}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right text-sm font-semibold text-green-700">
                    ${sp.creditsEarned.toFixed(2)}
                  </TableCell>
                  <TableCell className="px-2 py-3 text-right">
                    {sp.status === "pending_sales_log" && (
                      <button
                        className="text-xs font-medium text-primary hover:underline whitespace-nowrap"
                        onClick={() => setLoggingId(sp._id)}
                      >
                        Log Sales
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
        limitOptions={[10, 20, 50]}
      />
    </div>
  );
}
