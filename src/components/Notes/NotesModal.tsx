import { useState } from "react";
import { Loader2 } from "lucide-react";
import { skipToken } from "@reduxjs/toolkit/query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useGetAllNotesQuery } from "@/redux/api/Notes/notes";
import { useUser } from "@/redux/hooks/useAuth";
import { GlobalPagination } from "../ReUsableComponents/GlobalPagination";
import { INote } from "@/types/note/note";
import { AddNoteModal } from "./AddNoteModal";
import { NoteCard } from "./NoteCard";

interface NotesModalProps {
  open: boolean;
  onClose: () => void;
  entityId?: { _id: string; name: string; address: string } | null;
}

export const NotesModal = ({ open, onClose, entityId }: NotesModalProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isAddNoteModalOpen, setAddNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<INote | undefined>(undefined);

  const { data, isLoading, isFetching } = useGetAllNotesQuery(
    entityId ? { entityId: entityId._id.toString(), page: currentPage, limit } : skipToken,
    { skip: !entityId },
  );

  const user = useUser();

  const notes = data?.notes || [];
  const totalNotes = data?.total || 0;
  const totalPages = Math.ceil(totalNotes / limit);

  const handleEdit = (note: INote) => {
    setSelectedNote(note);
    setAddNoteModalOpen(true);
  };

  const handleCloseAddNoteModal = () => {
    setAddNoteModalOpen(false);
    setSelectedNote(undefined);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden rounded-xs bg-background text-foreground border-border flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg text-foreground">🗒️ Store Notes</DialogTitle>
          </DialogHeader>

          {entityId && (
            <div className="bg-primary/10 dark:bg-primary/20 border border-primary/30 rounded-xs p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                <div>
                  <h2 className="text-base sm:text-xl font-bold text-foreground">{entityId.name}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {entityId.address || "Address not available"}
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
            <p className="text-muted-foreground text-center py-10">No notes found for this store.</p>
          ) : (
            <div className="space-y-3 sm:space-y-4 overflow-y-auto scrollbar-hidden pr-2 flex-1">
              {notes.map((note: INote) => (
                <NoteCard
                  key={note._id}
                  note={note}
                  canEdit={user?.role !== "superadmin"}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          )}

          {totalNotes > 0 && (
            <GlobalPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalNotes}
              itemsPerPage={limit}
              onPageChange={setCurrentPage}
              onLimitChange={(newLimit) => { setLimit(newLimit); setCurrentPage(1); }}
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
