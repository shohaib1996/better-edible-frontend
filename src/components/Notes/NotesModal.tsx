"use client";

import { skipToken } from "@reduxjs/toolkit/query";
import { useGetAllNotesQuery } from "@/src/redux/api/Notes/notes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface NotesModalProps {
  open: boolean;
  onClose: () => void;
  entityId: string | null;
}

export const NotesModal = ({ open, onClose, entityId }: NotesModalProps) => {
  const { data, isLoading, isFetching } = useGetAllNotesQuery(
    entityId ? entityId : skipToken,
    { skip: !entityId }
  );

  const notes = data?.notes || [];
  const store = notes[0]?.entityId; // populated store info if available
  console.log(notes)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>🗒️ Store Notes</DialogTitle>
        </DialogHeader>

        {/* 🏪 Store Info Section */}
        {store && (
          <div className="bg-gray-50 border rounded-md p-3 mb-4">
            <h2 className="text-lg font-semibold">{store.name}</h2>
            <p className="text-sm text-gray-600">
              {store.address
                ? `${store.address}${
                    store.city ? `, ${store.city}` : ""
                  }${store.state ? `, ${store.state}` : ""}`
                : "Address not available"}
            </p>
          </div>
        )}

        {isLoading || isFetching ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="animate-spin h-6 w-6 text-gray-600" />
          </div>
        ) : notes.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No notes available for this store.
          </p>
        ) : (
          <div className="space-y-3 max-h-[70vh] overflow-y-auto">
            {notes.map((note: any) => (
              <div
                key={note._id}
                className="border rounded-lg p-3 shadow-sm bg-white hover:bg-gray-50 transition"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-500">
                    Date: {new Date(note.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm font-medium">
                  Disposition: {note.disposition || "—"}
                </div>
                <div className="text-sm text-gray-600">
                  Visit Type: {note.visitType || "—"}
                </div>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">
                  Notes: {note.notes}
                </p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
