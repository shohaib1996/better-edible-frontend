"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useCreateNoteMutation,
  useUpdateNoteMutation,
} from "@/redux/api/Notes/notes";
import { useGetAllContactsQuery } from "@/redux/api/Contacts/contactsApi";
import { useUpdateDeliveryStatusMutation } from "@/redux/api/Deliveries/deliveryApi";
import { toast } from "sonner";
import { FileText, Users } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { INote } from "@/types/note/note";
import { ContactTab } from "./ContactTab";
import { NoteForm, noteSchema, type NoteFormData } from "./NoteForm";

interface AddNoteModalProps {
  open: boolean;
  onClose: () => void;
  storeId: string;
  repId: string;
  note?: INote | null;
  deliveryId?: string;
  deliveryData?: {
    orderId?: string;
    sampleId?: string;
    clientOrderId?: string;
    scheduledAt?: string;
  };
}

export const AddNoteModal = ({
  open,
  onClose,
  storeId,
  repId,
  note,
  deliveryId,
}: AddNoteModalProps) => {
  const [createNote, { isLoading: isCreating }] = useCreateNoteMutation();
  const [updateNote, { isLoading: isUpdating }] = useUpdateNoteMutation();
  const [updateDeliveryStatus, { isLoading: isUpdatingDelivery }] = useUpdateDeliveryStatusMutation();
  const isNoteLoading = isCreating || isUpdating || isUpdatingDelivery;

  const { data: contactsData } = useGetAllContactsQuery(storeId, { skip: !storeId });
  const [activeTab, setActiveTab] = useState<"note" | "contacts">("note");

  const { control, handleSubmit, reset, setValue } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema) as unknown as Resolver<NoteFormData, any>,
  });

  useEffect(() => {
    if (note) {
      reset({
        disposition: note.disposition || "",
        visitType: note.visitType || "",
        content: note.content || "",
        sample: note.sample || false,
        delivery: note.delivery || false,
        deliveryStatus: deliveryId ? "completed" : undefined,
        payment: {
          cash: note.payment?.cash || false,
          check: note.payment?.check || false,
          noPay: note.payment?.noPay || false,
          amount: note.payment?.amount || "",
        },
      });
    } else {
      reset({
        disposition: "",
        visitType: "",
        content: "",
        sample: false,
        delivery: deliveryId ? true : false,
        deliveryStatus: deliveryId ? "completed" : undefined,
        payment: { cash: false, check: false, noPay: false, amount: "" },
      });
    }
  }, [note, reset, deliveryId]);

  useEffect(() => {
    if (!open) {
      setActiveTab("note");
      reset();
    }
  }, [open, reset]);

  const onSubmit = async (data: NoteFormData) => {
    try {
      const { deliveryStatus, ...noteFields } = data;

      if (note) {
        await updateNote({ id: note._id, ...noteFields }).unwrap();
        toast.success("Note updated successfully!");
      } else {
        const now = new Date();
        const pstTime = new Intl.DateTimeFormat("en-US", {
          timeZone: "America/Los_Angeles",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }).formatToParts(now);

        const dateParts: Record<string, string> = {};
        pstTime.forEach((part) => { dateParts[part.type] = part.value; });
        const dateString = `${dateParts.year}-${dateParts.month}-${dateParts.day} ${dateParts.hour}:${dateParts.minute}`;

        await createNote({
          ...noteFields,
          entityId: storeId,
          author: repId,
          date: dateString,
          ...(deliveryId && { deliveryId }),
        }).unwrap();
        toast.success("Note created successfully!");
      }

      if (deliveryId && deliveryStatus) {
        try {
          const today = format(new Date(), "yyyy-MM-dd");
          await updateDeliveryStatus({ id: deliveryId, status: deliveryStatus, today }).unwrap();
          toast.success(
            deliveryStatus === "completed"
              ? "Delivery marked as completed"
              : "Delivery marked as cancelled"
          );
        } catch {
          toast.error("Note saved, but failed to update delivery status");
        }
      }

      reset();
      onClose();
    } catch {
      toast.error(`Failed to ${note ? "update" : "create"} note.`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] bg-background border-border rounded-xs flex flex-col">
        <DialogHeader className="border-b border-border pb-3 shrink-0">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-primary" />
            {note ? "Edit Note" : "Add a New Note"}
          </DialogTitle>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("note")}
              className={`px-4 py-2 rounded-xs text-sm font-medium transition-all ${
                activeTab === "note"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <FileText className="h-4 w-4 inline-block mr-1.5" />
              Add Note
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("contacts")}
              className={`px-4 py-2 rounded-xs text-sm font-medium transition-all ${
                activeTab === "contacts"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              <Users className="h-4 w-4 inline-block mr-1.5" />
              Contacts {contactsData?.length ? `(${contactsData.length})` : ""}
            </button>
          </div>
        </DialogHeader>

        {activeTab === "note" && (
          <NoteForm
            control={control}
            setValue={setValue}
            deliveryId={deliveryId}
            note={note}
            isLoading={isNoteLoading}
            onCancel={onClose}
            onSubmit={handleSubmit(onSubmit)}
          />
        )}

        {activeTab === "contacts" && (
          <ContactTab storeId={storeId} isActive={activeTab === "contacts"} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddNoteModal;
