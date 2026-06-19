"use client";

import { useState } from "react";
import { Loader2, ChevronDown, ChevronUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  useGetAdminReplenishmentsQuery,
  useGetAdminInventoryQuery,
  useCreateReplenishmentMutation,
  useUpdateReplenishmentStatusMutation,
  useDeliverReplenishmentMutation,
} from "@/redux/api/Partnership/partnershipApi";
import type { IPartnershipReplenishment } from "@/types/partnership/partnership";

interface Props {
  storeId: string;
}

const STATUS_BADGE: Record<IPartnershipReplenishment["status"], string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  in_transit: "bg-blue-100 text-blue-800 border-blue-300",
  delivered: "bg-green-100 text-green-800 border-green-300",
  reconciled: "bg-purple-100 text-purple-800 border-purple-300",
};

const STATUS_LABEL: Record<IPartnershipReplenishment["status"], string> = {
  pending: "Pending",
  in_transit: "In Transit",
  delivered: "Delivered",
  reconciled: "Reconciled",
};

function ReplenishmentCard({
  r,
  storeId,
}: {
  r: IPartnershipReplenishment;
  storeId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showDriverForm, setShowDriverForm] = useState(false);
  const [driverCounts, setDriverCounts] = useState<Record<string, string>>({});
  const [driverNotes, setDriverNotes] = useState("");

  const [updateStatus, { isLoading: isUpdating }] = useUpdateReplenishmentStatusMutation();
  const [deliverReplenishment, { isLoading: isDelivering }] = useDeliverReplenishmentMutation();

  async function handleStatusUpdate(status: "pending" | "in_transit" | "delivered") {
    try {
      await updateStatus({ id: r._id, status }).unwrap();
      toast.success(`Marked as ${STATUS_LABEL[status]}`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to update status");
    }
  }

  async function handleReconcile() {
    const counts = r.items.map((item) => ({
      productId: item.productId,
      actualCount: parseInt(driverCounts[item.productId] ?? "0") || 0,
    }));
    try {
      await deliverReplenishment({ id: r._id, driverCounts: counts, driverNotes }).unwrap();
      toast.success("Reconciliation complete — inventory updated");
      setShowDriverForm(false);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to reconcile");
    }
  }

  return (
    <div className="rounded-xs border bg-card">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">
            {new Date(r.requestedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <Badge className={`rounded-xs text-xs ${STATUS_BADGE[r.status]}`}>
            {STATUS_LABEL[r.status]}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {r.items.length} product{r.items.length !== 1 ? "s" : ""}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t px-4 py-3 flex flex-col gap-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-2 font-medium text-muted-foreground">Product</th>
                <th className="pb-2 font-medium text-muted-foreground">SKU</th>
                <th className="pb-2 text-right font-medium text-muted-foreground">Requested</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {r.items.map((item, i) => (
                <tr key={i}>
                  <td className="py-2">{item.productName}</td>
                  <td className="py-2 font-mono text-xs text-muted-foreground">{item.sku}</td>
                  <td className="py-2 text-right">{item.unitsRequested}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Status action buttons */}
          <div className="flex gap-2 flex-wrap">
            {r.status === "pending" && (
              <Button
                size="sm"
                variant="outline"
                className="rounded-xs"
                onClick={() => handleStatusUpdate("in_transit")}
                disabled={isUpdating}
              >
                {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Mark In Transit
              </Button>
            )}
            {r.status === "in_transit" && (
              <Button
                size="sm"
                variant="outline"
                className="rounded-xs"
                onClick={() => handleStatusUpdate("delivered")}
                disabled={isUpdating}
              >
                {isUpdating && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                Mark Delivered
              </Button>
            )}
            {(r.status === "in_transit" || r.status === "delivered") && (
              <Button
                size="sm"
                className="rounded-xs"
                onClick={() => setShowDriverForm((v) => !v)}
              >
                {showDriverForm ? "Cancel" : "Enter Driver Counts"}
              </Button>
            )}
          </div>

          {/* Driver count form */}
          {showDriverForm && (
            <div className="rounded-xs border bg-muted/30 p-4 flex flex-col gap-3">
              <p className="text-sm font-semibold">Driver Physical Count</p>
              <p className="text-xs text-muted-foreground">
                These counts will override inventory remaining — driver count is source of truth.
              </p>
              <div className="flex flex-col gap-2">
                {r.items.map((item) => (
                  <div key={item.productId} className="flex items-center gap-3">
                    <span className="text-sm flex-1">{item.productName}</span>
                    <span className="font-mono text-xs text-muted-foreground w-24 text-right">
                      {item.sku}
                    </span>
                    <Input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={driverCounts[item.productId] ?? ""}
                      onChange={(e) =>
                        setDriverCounts((prev) => ({
                          ...prev,
                          [item.productId]: e.target.value,
                        }))
                      }
                      className="rounded-xs text-sm w-24"
                    />
                  </div>
                ))}
              </div>
              <textarea
                placeholder="Driver notes (optional)"
                value={driverNotes}
                onChange={(e) => setDriverNotes(e.target.value)}
                rows={2}
                className="rounded-xs border border-border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:border-primary"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="rounded-xs bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleReconcile}
                  disabled={isDelivering}
                >
                  {isDelivering && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                  Confirm Reconciliation
                </Button>
              </div>
            </div>
          )}

          {r.status === "reconciled" && r.driverCounts.length > 0 && (
            <div className="border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Driver counts</p>
              <div className="flex flex-col gap-1">
                {r.driverCounts.map((dc, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="font-mono text-xs text-muted-foreground">{dc.sku}</span>
                    <span className="font-semibold">{dc.actualCount} units</span>
                  </div>
                ))}
              </div>
              {r.driverNotes && (
                <p className="text-xs text-muted-foreground mt-2 italic">{r.driverNotes}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreateReplenishmentForm({
  storeId,
  onClose,
}: {
  storeId: string;
  onClose: () => void;
}) {
  const { data } = useGetAdminInventoryQuery(storeId);
  const [createReplenishment, { isLoading }] = useCreateReplenishmentMutation();
  const [quantities, setQuantities] = useState<Record<string, string>>({});

  const inventory = data?.inventory ?? [];

  async function handleCreate() {
    const items = inventory
      .filter((item) => parseInt(quantities[item._id] ?? "0") > 0)
      .map((item) => ({
        productId: item.productId,
        unitsRequested: parseInt(quantities[item._id]),
      }));

    if (items.length === 0) {
      toast.error("Enter at least one quantity");
      return;
    }

    try {
      await createReplenishment({ storeId, items }).unwrap();
      toast.success("Replenishment order created");
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to create replenishment");
    }
  }

  return (
    <div className="rounded-xs border bg-muted/30 p-4 flex flex-col gap-3">
      <p className="text-sm font-semibold">Create Replenishment Order</p>
      {inventory.length === 0 ? (
        <p className="text-sm text-muted-foreground">No inventory items found for this store.</p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {inventory.map((item) => (
              <div key={item._id} className="flex items-center gap-3">
                <span className="text-sm flex-1">{item.productName}</span>
                <span className="font-mono text-xs text-muted-foreground w-28 text-right">
                  {item.sku}
                </span>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={quantities[item._id] ?? ""}
                  onChange={(e) =>
                    setQuantities((prev) => ({ ...prev, [item._id]: e.target.value }))
                  }
                  className="rounded-xs text-sm w-24"
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" className="rounded-xs" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" className="rounded-xs" onClick={handleCreate} disabled={isLoading}>
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Create Order
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminReplenishmentsTab({ storeId }: Props) {
  const { data, isLoading } = useGetAdminReplenishmentsQuery(storeId);
  const [showCreate, setShowCreate] = useState(false);

  const replenishments = data?.replenishments ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          className="rounded-xs gap-1.5"
          onClick={() => setShowCreate((v) => !v)}
        >
          {showCreate ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showCreate ? "Cancel" : "Create Replenishment"}
        </Button>
      </div>

      {showCreate && (
        <CreateReplenishmentForm storeId={storeId} onClose={() => setShowCreate(false)} />
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : replenishments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No replenishments yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {replenishments.map((r) => (
            <ReplenishmentCard key={r._id} r={r} storeId={storeId} />
          ))}
        </div>
      )}
    </div>
  );
}
