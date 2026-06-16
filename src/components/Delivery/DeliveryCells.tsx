"use client";

import { useGetAllNotesQuery } from "@/redux/api/Notes/notes";

export function PaymentCollectedCell({ deliveryId }: { deliveryId: string }) {
  const { data, isLoading } = useGetAllNotesQuery(
    { deliveryId, limit: 5 },
    { skip: !deliveryId }
  );

  if (isLoading) return <span className="text-muted-foreground text-xs">…</span>;

  const notes = data?.notes || [];
  const payments: string[] = [];

  for (const note of notes) {
    if (note.payment?.cash) payments.push("Cash");
    if (note.payment?.check) payments.push("Check");
    if (note.payment?.noPay) payments.push("No Pay");
    if (note.payment?.amount && note.payment.amount !== "")
      payments.push(`$${note.payment.amount}`);
  }

  if (!payments.length)
    return <span className="text-muted-foreground font-normal">—</span>;

  return (
    <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
      {payments.join(" · ")}
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
    <div className="space-y-1.5 max-w-[220px]">
      {notes.map((note: any) => (
        <div key={note._id} className="text-sm">
          {note.content ? (
            <p className="text-foreground whitespace-normal leading-snug">{note.content}</p>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ))}
    </div>
  );
}
