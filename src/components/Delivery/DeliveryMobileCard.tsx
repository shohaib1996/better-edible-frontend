"use client";

import { cn } from "@/lib/utils";
import type { Delivery } from "@/types/delivery/delivery";
import { useGetAllNotesQuery } from "@/redux/api/Notes/notes";

function getStatusStyles(status: string) {
  switch (status) {
    case "pending":    return "bg-yellow-500 text-white";
    case "assigned":   return "bg-blue-500 text-white";
    case "in_transit": return "bg-purple-500 text-white";
    case "completed":  return "bg-emerald-500 text-white";
    case "cancelled":  return "bg-red-500 text-white";
    default:           return "bg-gray-500 text-white";
  }
}

function formatNoteTime(iso?: string) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return null;
  }
}

interface DeliveryMobileCardProps {
  delivery: Delivery;
  index: string;
  stopNumber?: number; // route stop position (1-based)
}

export function DeliveryMobileCard({ delivery, index, stopNumber }: DeliveryMobileCardProps) {
  const disposition = (
    Array.isArray(delivery.disposition) ? delivery.disposition : [delivery.disposition]
  )
    .map((d: string) => d.replace(/_/g, " "))
    .join(", ");

  const { data: notesData } = useGetAllNotesQuery(
    { deliveryId: delivery._id, limit: 5 },
    { skip: !delivery._id }
  );
  const notes = notesData?.note || [];

  const paymentParts: { label: string; time?: string }[] = [];
  for (const note of notes) {
    const parts: string[] = [];
    if (note.payment?.cash) parts.push("Cash");
    if (note.payment?.check) parts.push("Check");
    if (note.payment?.noPay) parts.push("No Pay");
    if (note.payment?.amount && note.payment.amount === "")
      parts.push(`$${note.payment.amount}`);
    if (parts.length) paymentParts.push({ label: parts.join(" · "), time: note.createdAt });
  }

  const repNotes = notes.filter((n: any) => n.content);

  return (
    <div className="bg-card border border-border rounded-md p-4 space-y-3">
      {/* Header row: stop # + store name + status badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className="text-xs text-muted-foreground font-medium mt-0.5 shrink-0">
            {stopNumber != null ? `Stop ${stopNumber}` : `#${index}`}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-foreground leading-tight">
              {delivery.storeId?.name || "N/A"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {delivery.storeId?.address}
              {delivery.storeId?.city && `, ${delivery.storeId.city}`}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium capitalize",
            getStatusStyles(delivery.status)
          )}
        >
          {delivery.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* Details row */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Rep</p>
          <p className="text-primary font-medium">
            {delivery.assignedTo?.name || "Unassigned"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Amount</p>
          <p className="text-foreground font-semibold">${delivery.amount.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Type</p>
          <p className="text-foreground capitalize">{disposition}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Payment</p>
          <p className="text-foreground capitalize">
            {delivery.paymentAction.replace(/_/g, " ")}
          </p>
        </div>
      </div>

      {/* Payment collected with timestamp */}
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">Payment Collected</p>
        {paymentParts.length ? (
          <div className="space-y-1">
            {paymentParts.map((p, i) => (
              <div key={i}>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
                  {p.label}
                </span>
                {p.time && (
                  <p className="text-xs text-muted-foreground">{formatNoteTime(p.time)}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </div>

      {/* Admin note */}
      {delivery.notes && (
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Admin Note</p>
          <p className="text-sm text-foreground">{delivery.notes}</p>
        </div>
      )}

      {/* Rep notes with timestamps */}
      <div>
        <p className="text-xs text-muted-foreground mb-0.5">Rep Note</p>
        {repNotes.length ? (
          <div className="space-y-2">
            {repNotes.map((note: any) => (
              <div key={note._id}>
                <p className="text-sm text-foreground whitespace-normal leading-snug">
                  {note.content}
                </p>
                {note.createdAt && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatNoteTime(note.createdAt)}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        )}
      </div>
    </div>
  );
}
