import {
  DollarSign,
  FileText,
  Truck,
  Package,
  Calendar,
  ClipboardList,
  User,
  Pencil,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useGetAllNotesQuery } from "@/redux/api/Notes/notes";
import { skipToken } from "@reduxjs/toolkit/query";
import { useState } from "react";
import { AddNoteModal } from "./AddNoteModal";
import { INote } from "@/types/note/note";
import { Button } from "../ui/button";
import { useUser } from "@/redux/hooks/useAuth";
import { GlobalPagination } from "../ReUsableComponents/GlobalPagination";

interface NotesModalProps {
  open: boolean;
  onClose: () => void;
  entityId?: {
    _id: string;
    name: string;
    address: string;
  } | null;
}

export const NotesModal = ({ open, onClose, entityId }: NotesModalProps) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const { data, isLoading, isFetching } = useGetAllNotesQuery(
    entityId
      ? {
          entityId: entityId._id.toString(),
          page: currentPage,
          limit: limit,
        }
      : skipToken,
    { skip: !entityId }
  );
  console.log(data);

  const user = useUser();

  const [isAddNoteModalOpen, setAddNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<INote | undefined>(
    undefined
  );

  const notes = data?.notes || [];
  const totalNotes = data?.total || 0;
  const totalPages = Math.ceil(totalNotes / limit);
  const store = entityId;

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
  };

  const handleEdit = (note: INote) => {
    setSelectedNote(note);
    setAddNoteModalOpen(true);
  };

  const handleCloseAddNoteModal = () => {
    setAddNoteModalOpen(false);
    setSelectedNote(undefined);
  };

  const renderPaymentInfo = (payment: any) => {
    if (!payment) return <Badge variant="outline">No Payment Info</Badge>;

    const details = [];
    if (payment.cash) details.push("Cash");
    if (payment.check) details.push("Check");
    if (payment.noPay) details.push("No Pay");

    const hasPaymentInfo =
      details.length > 0 || (payment.amount && payment.amount !== "");

    if (!hasPaymentInfo) {
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
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden rounded-xs bg-background text-foreground border-border flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg text-foreground">
              🗒️ Store Notes
            </DialogTitle>
          </DialogHeader>

          {store && (
            <div className="bg-primary/10 dark:bg-primary/20 border border-primary/30 rounded-xs p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <div>
                  <h2 className="text-base sm:text-xl font-bold text-foreground">
                    {store.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {store.address
                      ? `${store.address}`
                      : "Address not available"}
                  </p>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">
                  <strong>Total Notes:</strong> {totalNotes}
                </div>
              </div>
            </div>
          )}

          {isLoading || isFetching ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-muted-foreground text-center py-10">
              No notes found for this store.
            </p>
          ) : (
            <div className="space-y-3 sm:space-y-4 overflow-y-auto scrollbar-hidden pr-2 flex-1">
              {notes.map((note: any) => (
                <div
                  key={note._id}
                  className="border border-border rounded-xs p-3 sm:p-4 shadow-sm bg-card transition-all hover:shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-border bg-muted/20 dark:bg-muted/10 p-2 sm:p-3 rounded-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <Calendar
                          size={12}
                          className="sm:w-[14px] sm:h-[14px]"
                        />
                        <span>
                          {note.date
                            ? new Date(note.date).toLocaleDateString()
                            : "No date"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                        <User size={12} className="sm:w-[14px] sm:h-[14px]" />
                        <span>
                          {(typeof note.author === "object" &&
                            note.author.name) ||
                            "Unknown Author"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {note.sample && (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 text-xs"
                        >
                          <Package size={10} className="sm:w-3 sm:h-3" />{" "}
                          <span className="hidden sm:inline">Sample</span>
                        </Badge>
                      )}
                      {note.delivery && (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1 text-xs"
                        >
                          <Truck size={10} className="sm:w-3 sm:h-3" />{" "}
                          <span className="hidden sm:inline">Delivery</span>
                        </Badge>
                      )}
                      {user?.role !== "superadmin" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 sm:h-8 sm:w-8"
                          onClick={() => handleEdit(note)}
                        >
                          <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 mt-2 sm:mt-3">
                    <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/30 p-2 sm:p-3 rounded-xs">
                      <ClipboardList
                        size={14}
                        className="text-blue-600 dark:text-blue-400 mt-1 sm:w-4 sm:h-4 shrink-0"
                      />
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                          Disposition
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {note.disposition || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 bg-purple-50 dark:bg-purple-950/30 p-2 sm:p-3 rounded-xs">
                      <ClipboardList
                        size={14}
                        className="text-purple-600 dark:text-purple-400 mt-1 sm:w-4 sm:h-4 shrink-0"
                      />
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                          Visit Type
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {note.visitType || "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {note.content && (
                    <div className="flex items-start gap-2 mt-2 sm:mt-4 bg-amber-50 dark:bg-amber-950/30 p-2 sm:p-3 rounded-xs">
                      <FileText
                        size={14}
                        className="text-amber-600 dark:text-amber-400 mt-1 sm:w-4 sm:h-4 shrink-0"
                      />
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                          Content
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-2 sm:mt-4 border-t border-border pt-2 sm:pt-3 bg-green-50 dark:bg-green-950/30 p-2 sm:p-3 rounded-xs">
                    <h4 className="text-xs sm:text-sm font-semibold mb-2 text-foreground">
                      Payment
                    </h4>
                    {renderPaymentInfo(note.payment)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalNotes > 0 && (
            <GlobalPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalNotes}
              itemsPerPage={limit}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          )}
        </DialogContent>
      </Dialog>
      {isAddNoteModalOpen && (
        <AddNoteModal
          open={isAddNoteModalOpen}
          onClose={handleCloseAddNoteModal}
          storeId={entityId?._id ?? ""}
          repId={
            typeof selectedNote?.author === "object"
              ? selectedNote.author._id.toString()
              : selectedNote?.author?.toString() ?? ""
          }
          note={selectedNote}
        />
      )}
    </>
  );
};
