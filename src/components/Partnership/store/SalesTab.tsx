"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  useGetPartnershipSalesQuery,
  useGetPartnershipInventoryQuery,
} from "@/redux/api/Partnership/partnershipApi";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";

interface Props {
  storeId: string;
}

function getDefaultDates() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
}

export default function SalesTab({ storeId }: Props) {
  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data, isLoading } = useGetPartnershipSalesQuery({ storeId, startDate, endDate, page, limit });
  // fetch all inventory for sku → name lookup (store won't have hundreds of products)
  const { data: inventoryData } = useGetPartnershipInventoryQuery({ storeId, page: 1, limit: 1000 });

  const sales = data?.sales ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const skuToName = Object.fromEntries(
    (inventoryData?.inventory ?? []).map((item) => [item.sku, item.productName])
  );

  function handleDateChange(field: "startDate" | "endDate", value: string) {
    if (field === "startDate") setStartDate(value);
    else setEndDate(value);
    setPage(1);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <label className="text-muted-foreground">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleDateChange("startDate", e.target.value)}
            className="rounded-xs border border-border bg-background px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:border-primary"
          />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label className="text-muted-foreground">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleDateChange("endDate", e.target.value)}
            className="rounded-xs border border-border bg-background px-2.5 py-1.5 text-sm focus-visible:outline-none focus-visible:border-primary"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : sales.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No sales data yet — make sure your POS is connected.
        </p>
      ) : (
        <>
          <div className="rounded-xs border border-border bg-card shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">SKU</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Units Sold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sales.map((sale) => (
                  <tr key={sale._id} className="bg-card hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(sale.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {sale.sku}
                    </td>
                    <td className="px-4 py-3 font-medium">{skuToName[sale.sku] ?? ""}</td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {sale.unitsSold.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
  );
}
