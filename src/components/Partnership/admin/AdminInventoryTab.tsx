"use client";

import { useState } from "react";
import { Loader2, Plus, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  useGetAdminInventoryQuery,
  usePlaceInventoryMutation,
} from "@/redux/api/Partnership/partnershipApi";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Props {
  storeId: string;
}
// Returns a color class based on stock levels: green for healthy, amber for low, red for critical. 
// If no stock placed, returns muted color.
// placed = total units ever placed in inventory, remaining = current units available.
function getStockColor(placed: number, remaining: number): string {
  if (placed === 0) return "text-muted-foreground";
  const pct = remaining / placed;
  if (pct >= 0.5) return "text-green-700 dark:text-green-400";
  if (pct >= 0.2) return "text-amber-700 dark:text-amber-400";
  return "text-red-700 dark:text-red-400";
}

export default function AdminInventoryTab({ storeId }: Props) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading } = useGetAdminInventoryQuery({ storeId, page, limit });
  const [placeInventory, { isLoading: isPlacing }] = usePlaceInventoryMutation();

  const [showForm, setShowForm] = useState(false);
  const [productId, setProductId] = useState("");
  const [sku, setSku] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [unitsToAdd, setUnitsToAdd] = useState("");

  const inventory = data?.inventory ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = data?.totalPages ?? 1;

  function resetForm() {
    setProductId("");
    setSku("");
    setWholesalePrice("");
    setUnitsToAdd("");
    setShowForm(false);
  }

  async function handlePlace() {
    if (!productId || !sku || !wholesalePrice || !unitsToAdd) {
      toast.error("All fields are required");
      return;
    }
    try {
      await placeInventory({
        storeId,
        productId,
        sku: sku.trim().toUpperCase(),
        wholesalePrice: parseFloat(wholesalePrice),
        unitsToAdd: parseInt(unitsToAdd),
      }).unwrap();
      toast.success("Inventory placed");
      resetForm();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to place inventory");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 rounded-xs bg-blue-50 border border-blue-200 px-3 py-2.5 text-xs text-blue-800">
        <Info className="w-3.5 h-3.5 shrink-0" />
        Inventory is automatically synced when a client order is marked as shipped. Use manual placement for corrections only.
      </div>

      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          className="rounded-xs gap-1.5"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancel" : "Manual Adjustment"}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xs border bg-muted/30 p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold">Manual Inventory Adjustment</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Product ID
              </label>
              <Input
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="MongoDB ObjectId"
                className="rounded-xs text-sm font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                SKU
              </label>
              <Input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. B052"
                className="rounded-xs text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Wholesale Price ($)
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={wholesalePrice}
                onChange={(e) => setWholesalePrice(e.target.value)}
                placeholder="0.00"
                className="rounded-xs text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Units to Add
              </label>
              <Input
                type="number"
                min="1"
                value={unitsToAdd}
                onChange={(e) => setUnitsToAdd(e.target.value)}
                placeholder="0"
                className="rounded-xs text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              size="sm"
              className="rounded-xs"
              onClick={handlePlace}
              disabled={isPlacing}
            >
              {isPlacing && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Confirm
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : inventory.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No products placed yet.
        </p>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
