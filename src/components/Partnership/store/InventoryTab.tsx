"use client";

import { useState } from "react";
import { useGetPartnershipInventoryQuery } from "@/redux/api/Partnership/partnershipApi";
import { Loader2 } from "lucide-react";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  storeId: string;
}

function getStockColor(placed: number, remaining: number): string {
  if (placed === 0) return "text-muted-foreground";
  const pct = remaining / placed;
  if (pct >= 0.5) return "text-green-700 dark:text-green-400";
  if (pct >= 0.2) return "text-amber-700 dark:text-amber-400";
  return "text-red-700 dark:text-red-400";
}

export default function InventoryTab({ storeId }: Props) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading } = useGetPartnershipInventoryQuery({ storeId, page, limit });

  const inventory = data?.inventory ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (inventory.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        No products in your store yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xs border border-border bg-card shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="hover:bg-muted/50">
              <TableHead className="px-4 py-3 font-medium text-muted-foreground">Product</TableHead>
              <TableHead className="px-4 py-3 font-medium text-muted-foreground">SKU</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Placed</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Sold</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Remaining</TableHead>
              <TableHead className="px-4 py-3 text-right font-medium text-muted-foreground">Wholesale</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((item) => (
              <TableRow key={item._id}>
                <TableCell className="px-4 py-3 font-medium">{item.productName}</TableCell>
                <TableCell className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.sku}</TableCell>
                <TableCell className="px-4 py-3 text-right text-muted-foreground">{item.unitsPlaced.toLocaleString()}</TableCell>
                <TableCell className="px-4 py-3 text-right text-muted-foreground">{item.unitsSold.toLocaleString()}</TableCell>
                <TableCell className={`px-4 py-3 text-right font-semibold ${getStockColor(item.unitsPlaced, item.unitsRemaining)}`}>
                  {item.unitsRemaining.toLocaleString()}
                </TableCell>
                <TableCell className="px-4 py-3 text-right text-muted-foreground">${item.wholesalePrice.toFixed(2)}</TableCell>
              </TableRow>
            ))}
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
        limitOptions={[10, 25, 50, 100]}
      />
    </div>
  );
}
