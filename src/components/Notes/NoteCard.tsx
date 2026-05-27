"use client";

import { DollarSign, FileText, Truck, Package, Calendar, ClipboardList, User, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { INote } from "@/types/note/note";

function formatNoteDate(date: string): string {
  try {
    const [datePart, timePart] = date.split(" ");
    const [year, month, day] = datePart.split("-");
    const [hours, minutes] = timePart ? timePart.split(":") : ["00", "00"];
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
    const dateStr = dateObj.toLocaleDateString();
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? "PM" : "AM";
    return `${dateStr}, ${hour12}:${minutes} ${ampm}`;
  } catch {
    return date;
  }
}

function PaymentInfo({ payment }: { payment: any }) {
  if (!payment) return <Badge variant="outline">No Payment Info</Badge>;

  const details: string[] = [];
  if (payment.cash) details.push("Cash");
  if (payment.check) details.push("Check");
  if (payment.noPay) details.push("No Pay");

  if (details.length === 0 && (!payment.amount || payment.amount === "")) {
    return <Badge variant="outline">No Payment Info</Badge>;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {details.length > 0 && (
        <Badge variant="secondary" className="flex items-center gap-1">
          <DollarSign size={12} />
          {details.join(", ")}
        </Badge>
      )}
      {payment.amount && payment.amount !== "" && (
        <Badge variant="outline">Amount: ${payment.amount}</Badge>
      )}
    </div>
  );
}

interface Props {
  note: INote;
  canEdit: boolean;
  onEdit: (note: INote) => void;
}

export function NoteCard({ note, canEdit, onEdit }: Props) {
  return (
    <div className="border border-border rounded-xs p-3 sm:p-4 shadow-sm bg-card transition-all hover:shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-border bg-muted/20 dark:bg-muted/10 p-2 sm:p-3 rounded-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
            <span>{note.date ? formatNoteDate(note.date) : "No date"}</span>
          </div>
          <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
            <User size={12} className="sm:w-3.5 sm:h-3.5" />
            <span>{(typeof note.author === "object" && note.author.name) || "Unknown Author"}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {note.sample && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Package size={10} className="sm:w-3 sm:h-3" />
              <span className="hidden sm:inline">Sample</span>
            </Badge>
          )}
          {note.delivery && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <Truck size={10} className="sm:w-3 sm:h-3" />
              <span className="hidden sm:inline">Delivery</span>
            </Badge>
          )}
          {canEdit && (
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => onEdit(note)}>
              <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 mt-2 sm:mt-3">
        <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/30 p-2 sm:p-3 rounded-xs">
          <ClipboardList size={14} className="text-blue-600 dark:text-blue-400 mt-1 sm:w-4 sm:h-4 shrink-0" />
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-foreground">Disposition</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">{note.disposition || "—"}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 bg-purple-50 dark:bg-purple-950/30 p-2 sm:p-3 rounded-xs">
          <ClipboardList size={14} className="text-purple-600 dark:text-purple-400 mt-1 sm:w-4 sm:h-4 shrink-0" />
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-foreground">Visit Type</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">{note.visitType || "—"}</p>
          </div>
        </div>
      </div>

      {note.content && (
        <div className="flex items-start gap-2 mt-2 sm:mt-4 bg-amber-50 dark:bg-amber-950/30 p-2 sm:p-3 rounded-xs">
          <FileText size={14} className="text-amber-600 dark:text-amber-400 mt-1 sm:w-4 sm:h-4 shrink-0" />
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-foreground">Content</h4>
            <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
          </div>
        </div>
      )}

      <div className="mt-2 sm:mt-4 border-t border-border pt-2 sm:pt-3 bg-green-50 dark:bg-green-950/30 p-2 sm:p-3 rounded-xs">
        <h4 className="text-xs sm:text-sm font-semibold mb-2 text-foreground">Payment</h4>
        <PaymentInfo payment={note.payment} />
      </div>
    </div>
  );
}
