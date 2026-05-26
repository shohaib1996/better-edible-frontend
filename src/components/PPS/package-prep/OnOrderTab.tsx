"use client";

import { useState } from "react";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ImagePreviewModal } from "@/components/Orders/OrderPage/ImagePreviewModal";
import {
  useGetActiveLabelOrdersQuery,
  useReceiveLabelOrderMutation,
  useUpdateLabelOrderMutation,
  useDeleteLabelOrderMutation,
} from "@/redux/api/PrivateLabel/ppsApi";
import type { ILabelOrder } from "@/types/privateLabel/packagePrep";
import { Thumbnail, LoadingState, ErrorState, EmptyState, fieldClass, type PreviewImage } from "./PackagePrepShared";

type Panel = "receive" | "edit" | "delete" | null;

export function OnOrderTab({ compact, isAdmin }: { compact?: boolean; isAdmin: boolean }) {
  const { data, isLoading, isError } = useGetActiveLabelOrdersQuery();
  const [receiveOrder, { isLoading: receiving }] = useReceiveLabelOrderMutation();
  const [updateOrder, { isLoading: updating }] = useUpdateLabelOrderMutation();
  const [deleteOrder, { isLoading: deleting }] = useDeleteLabelOrderMutation();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<Panel>(null);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [editForms, setEditForms] = useState<Record<string, { qty: string; notes: string }>>({});
  const [previewImage, setPreviewImage] = useState<PreviewImage>(null);

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState msg="Failed to load orders." />;

  const orders = data?.orders ?? [];
  if (orders.length === 0) return <EmptyState msg="No labels on order." />;

  function openPanel(orderId: string, panel: Panel, order?: ILabelOrder) {
    setExpandedId(orderId);
    setActivePanel(panel);
    if (panel === "receive" && order) {
      setQuantities((q) => ({ ...q, [orderId]: String(order.quantityOrdered) }));
    }
    if (panel === "edit" && order) {
      setEditForms((f) => ({ ...f, [orderId]: { qty: String(order.quantityOrdered), notes: order.notes ?? "" } }));
    }
  }

  function closePanel() {
    setExpandedId(null);
    setActivePanel(null);
  }

  async function handleReceive(order: ILabelOrder) {
    const qty = parseInt(quantities[order._id] ?? String(order.quantityOrdered), 10);
    if (isNaN(qty) || qty < 1) { toast.error("Enter a valid quantity"); return; }
    try {
      await receiveOrder({ orderId: order._id, quantityReceived: qty }).unwrap();
      toast.success(`Received ${qty} labels for ${order.labelName}`);
      closePanel();
    } catch {
      toast.error("Failed to record receipt");
    }
  }

  async function handleEdit(order: ILabelOrder) {
    const form = editForms[order._id];
    if (!form) return;
    const qty = parseInt(form.qty, 10);
    if (isNaN(qty) || qty < 1) { toast.error("Enter a valid quantity"); return; }
    try {
      await updateOrder({ orderId: order._id, quantityOrdered: qty, notes: form.notes || undefined }).unwrap();
      toast.success("Order updated");
      closePanel();
    } catch {
      toast.error("Failed to update order");
    }
  }

  async function handleDelete(order: ILabelOrder) {
    try {
      await deleteOrder({ orderId: order._id }).unwrap();
      toast.success(`Order ${order.orderNumber} cancelled`);
      closePanel();
    } catch {
      toast.error("Failed to cancel order");
    }
  }

  return (
    <>
      <ImagePreviewModal image={previewImage} onClose={() => setPreviewImage(null)} />
      <div className="flex flex-col gap-3">
        {orders.map((order) => {
          const isThisExpanded = expandedId === order._id;
          const panel = isThisExpanded ? activePanel : null;
          const editForm = editForms[order._id] ?? { qty: String(order.quantityOrdered), notes: order.notes ?? "" };

          return (
            <div key={order._id} className="rounded-xs border border-border bg-card overflow-hidden">
              <div className="px-4 pt-4 pb-3 flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Thumbnail url={order.labelImageUrl} name={order.labelName} onPreview={setPreviewImage} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-muted-foreground">{order.orderNumber}</span>
                      <span className="text-xs px-2 py-0.5 rounded-xs bg-amber-100 text-amber-800 border border-amber-200 font-medium dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700">
                        On Order
                      </span>
                    </div>
                    <p className={cn("font-bold", compact ? "text-base" : "text-lg")}>{order.storeName}</p>
                    <p className={cn("font-medium text-foreground mt-0.5", compact ? "text-sm" : "text-base")}>{order.labelName}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ordered:{" "}
                      <span className="font-semibold text-foreground">{order.quantityOrdered.toLocaleString()}</span>
                      <span className="mx-1.5 text-border">·</span>
                      {new Date(order.orderedAt).toLocaleDateString()}
                    </p>
                    {order.notes && <p className="text-xs text-muted-foreground mt-1 italic">{order.notes}</p>}
                  </div>
                </div>

                {!isThisExpanded && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openPanel(order._id, "edit", order)}
                          className="p-2 rounded-xs border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Edit order"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openPanel(order._id, "delete", order)}
                          className="p-2 rounded-xs border border-border bg-background text-muted-foreground hover:text-destructive hover:border-destructive/50 transition-colors"
                          title="Cancel order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => openPanel(order._id, "receive", order)}
                      className="px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                    >
                      Receive
                    </button>
                  </div>
                )}
              </div>

              {panel === "receive" && (
                <div className="border-t border-amber-400/30 bg-amber-400/10 px-4 py-4 flex flex-col gap-3">
                  <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">Enter actual quantity received:</p>
                  <input
                    type="number"
                    min={1}
                    value={quantities[order._id] ?? order.quantityOrdered}
                    onChange={(e) => setQuantities((q) => ({ ...q, [order._id]: e.target.value }))}
                    className={fieldClass}
                    autoFocus
                  />
                  {order.notes && (
                    <p className="text-xs text-amber-800/70 dark:text-amber-400/70 italic">Note: {order.notes}</p>
                  )}
                  <div className="flex flex-col-reverse sm:flex-row gap-2">
                    <button onClick={closePanel} className="px-4 py-2 rounded-xs border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReceive(order)}
                      disabled={receiving}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {receiving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Confirm Receipt
                    </button>
                  </div>
                </div>
              )}

              {panel === "edit" && (
                <div className="border-t border-blue-400/30 bg-blue-400/10 px-4 py-4 flex flex-col gap-3">
                  <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">Edit order details:</p>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-muted-foreground font-medium">Quantity ordered</label>
                    <input
                      type="number"
                      min={1}
                      value={editForm.qty}
                      onChange={(e) => setEditForms((f) => ({ ...f, [order._id]: { ...editForm, qty: e.target.value } }))}
                      className={fieldClass}
                      autoFocus
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-muted-foreground font-medium">Notes (optional)</label>
                    <input
                      type="text"
                      value={editForm.notes}
                      onChange={(e) => setEditForms((f) => ({ ...f, [order._id]: { ...editForm, notes: e.target.value } }))}
                      placeholder="Add a note…"
                      className={fieldClass}
                    />
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row gap-2">
                    <button onClick={closePanel} className="px-4 py-2 rounded-xs border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={() => handleEdit(order)}
                      disabled={updating}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xs bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Changes
                    </button>
                  </div>
                </div>
              )}

              {panel === "delete" && (
                <div className="border-t border-destructive/30 bg-destructive/5 px-4 py-4 flex flex-col gap-3">
                  <p className="text-sm text-destructive font-medium">
                    Cancel order <span className="font-mono">{order.orderNumber}</span>? This cannot be undone.
                  </p>
                  <div className="flex flex-col-reverse sm:flex-row gap-2">
                    <button onClick={closePanel} className="px-4 py-2 rounded-xs border border-border bg-background text-foreground text-sm font-medium hover:bg-muted transition-colors">
                      Keep Order
                    </button>
                    <button
                      onClick={() => handleDelete(order)}
                      disabled={deleting}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-xs bg-destructive text-white text-sm font-semibold hover:bg-destructive/90 transition-colors disabled:opacity-50"
                    >
                      {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Yes, Cancel Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
