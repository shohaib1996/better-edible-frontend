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
import { Badge } from "@/src/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useGetAllNotesQuery } from "@/src/redux/api/Notes/notes";
import { skipToken } from "@reduxjs/toolkit/query";
import { useState } from "react";
import { AddNoteModal } from "./AddNoteModal";
import { INote } from "@/src/types/note/note";
import { Button } from "../ui/button";
import { useUser } from "@/src/redux/hooks/useAuth";

interface NotesModalProps {
  open: boolean;
  onClose: () => void;
  entityId: {
    name: string;
    address: string;
    _id: string;
  };
}

export const NotesModal = ({ open, onClose, entityId }: NotesModalProps) => {
  const { data, isLoading, isFetching } = useGetAllNotesQuery(
    entityId ? entityId._id : skipToken,
    { skip: !entityId }
  );

  const user = useUser();

  const [isAddNoteModalOpen, setAddNoteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<INote | undefined>(
    undefined
  );

  const notes = data?.notes || [];
  const store = entityId;


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
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>🗒️ Store Notes</DialogTitle>
          </DialogHeader>

          {store && (
            <div className="bg-gray-50 border rounded-md p-4 mb-4">
              <h2 className="text-xl font-bold">{store.name}</h2>
              <p className="text-md text-gray-600">
                {store.address
                  ? `${store.address}`
                  : "Address not available"}
              </p>
            </div>
          )}

          {isLoading || isFetching ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin h-8 w-8 text-gray-600" />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-gray-500 text-center py-10">
              No notes found for this store.
            </p>
          ) : (
            <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
              {notes.map((note: any) => (
                <div
                  key={note._id}
                  className="border rounded-xl p-4 shadow-sm bg-white transition-all hover:shadow-lg"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar size={14} />
                        <span>{new Date(note.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <User size={14} />
                        <span>{note.author?.name || "Unknown Author"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {note.sample && (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Package size={12} /> Sample
                        </Badge>
                      )}
                      {note.delivery && (
                        <Badge
                          variant="outline"
                          className="flex items-center gap-1"
                        >
                          <Truck size={12} /> Delivery
                        </Badge>
                      )}
                      {user?.role !== "superadmin" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(note)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="flex items-start gap-2">
                      <ClipboardList
                        size={16}
                        className="text-gray-600 mt-1"
                      />
                      <div>
                        <h4 className="font-semibold">Disposition</h4>
                        <p className="text-sm text-gray-700">
                          {note.disposition || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <ClipboardList
                        size={16}
                        className="text-gray-600 mt-1"
                      />
                      <div>
                        <h4 className="font-semibold">Visit Type</h4>
                        <p className="text-sm text-gray-700">
                          {note.visitType || "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {note.content && (
                    <div className="flex items-start gap-2 mt-4">
                      <FileText size={16} className="text-gray-600 mt-1" />
                      <div>
                        <h4 className="font-semibold">Content</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 border-t pt-3">
                    <h4 className="font-semibold mb-2">Payment</h4>
                    {renderPaymentInfo(note.payment)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {isAddNoteModalOpen && (
        <AddNoteModal
          open={isAddNoteModalOpen}
          onClose={handleCloseAddNoteModal}
          storeId={entityId._id!}
          repId={selectedNote?.author?._id?.toString() ?? ""}
          note={selectedNote}
        />
      )}
    </>
  );
};

