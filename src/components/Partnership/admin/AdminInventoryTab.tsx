"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  useGetAdminInventoryQuery,
  usePlaceInventoryMutation,
} from "@/redux/api/Partnership/partnershipApi";

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

export default function AdminInventoryTab({ storeId }: Props) {
  const { data, isLoading } = useGetAdminInventoryQuery(storeId);
  const [placeInventory, { isLoading: isPlacing }] = usePlaceInventoryMutation();

  const [showForm, setShowForm] = useState(false);
  const [productId, setProductId] = useState("");
  const [sku, setSku] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [unitsToAdd, setUnitsToAdd] = useState("");

  const inventory = data?.inventory ?? [];

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
      <div className="flex justify-end">
        <Button
          size="sm"
          className="rounded-xs gap-1.5"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancel" : "Place Product"}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xs border bg-muted/30 p-4 flex flex-col gap-3">
          <p className="text-sm font-semibold">Place Product in Store</p>
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
                placeholder="e.g. BE-GUMMY-250"
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
        <div className="rounded-xs border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">SKU</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Placed</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Sold</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Remaining</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Wholesale</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Last Reconciled</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inventory.map((item) => (
                <tr key={item._id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 font-medium">{item.productName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{item.sku}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {item.unitsPlaced.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {item.unitsSold.toLocaleString()}
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${getStockColor(item.unitsPlaced, item.unitsRemaining)}`}>
                    {item.unitsRemaining.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    ${item.wholesalePrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {item.lastReconciliationAt
                      ? new Date(item.lastReconciliationAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
