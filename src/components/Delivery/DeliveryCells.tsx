"use client";

import { useGetAllNotesQuery } from "@/redux/api/Notes/notes";

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

export function PaymentCollectedCell({ deliveryId }: { deliveryId: string }) {
  const { data, isLoading } = useGetAllNotesQuery(
    { deliveryId, limit: 5 },
    { skip: !deliveryId }
  );

  if (isLoading) return <span className="text-muted-foreground text-xs">…</span>;

  const notes = data?.notes || [];
  const payments: { label: string; time?: string }[] = [];

  for (const note of notes) {
    const parts: string[] = [];
    if (note.payment?.cash) parts.push("Cash");
    if (note.payment?.check) parts.push("Check");
    if (note.payment?.noPay) parts.push("No Pay");
    if (note.payment?.amount && note.payment.amount !== "")
      parts.push(`$${note.payment.amount}`);
    if (parts.length) {
      payments.push({ label: parts.join(" · "), time: note.createdAt });
    }
  }

  if (!payments.length)
    return <span className="text-muted-foreground font-normal">—</span>;

  return (
    <div className="space-y-1">
      {payments.map((p, i) => (
        <div key={i}>
          <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
            {p.label}
          </div>
          {p.time && (
            <div className="text-xs text-muted-foreground">{formatNoteTime(p.time)}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export function DeliveryNoteCell({ deliveryId }: { deliveryId: string }) {
  const { data, isLoading } = useGetAllNotesQuery(
    { deliveryId, limit: 5 },
    { skip: !deliveryId }
  );

  if (isLoading) return <span className="text-muted-foreground text-xs">…</span>;

  const notes = data?.notes || [];

  if (!notes.length) return <span className="text-muted-foreground">—</span>;

  return (
    <div className="space-y-2 max-w-[220px]">
      {notes.map((note: any) => (
        <div key={note._id}>
          {note.content ? (
            <p className="text-foreground text-sm whitespace-normal leading-snug">
              {note.content}
            </p>
          ) : (
            <span className="text-muted-foreground text-sm">—</span>
          )}
          {note.createdAt && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatNoteTime(note.createdAt)}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
