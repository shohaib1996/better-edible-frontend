// src/components/Notes/AddNoteModal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useForm, Controller, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateNoteMutation,
  useUpdateNoteMutation,
} from "@/src/redux/api/Notes/notes";
import { useGetAllContactsQuery } from "@/src/redux/api/Contacts/contactsApi";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { INote } from "@/src/types/note/note";
import { ContactTab } from "./ContactTab";

/* -----------------------
   Types
   ----------------------- */
interface AddNoteModalProps {
  open: boolean;
  onClose: () => void;
  storeId: string; // required store id
  repId: string;
  note?: INote | null;
}

type NoteFormData = z.infer<typeof noteSchema>;

/* -----------------------
   Note form schema
   ----------------------- */
const noteSchema = z.object({
  disposition: z.string().optional(),
  visitType: z.string().optional(),
  content: z.string().optional(),
  sample: z.boolean().default(false),
  delivery: z.boolean().default(false),
  payment: z
    .object({
      cash: z.boolean().default(false),
      check: z.boolean().default(false),
      noPay: z.boolean().default(false),
      amount: z.string().optional(),
    })
    .optional(),
});

/* -----------------------
   Pre-written texts
   ----------------------- */
const prewrittenTexts = [
  "Called, Manager is not available",
  "Called, No answer",
  "stopped by no one was available",
  "Stopped by No manager",
];

/* -----------------------
   Component
   ----------------------- */
export const AddNoteModal = ({
  open,
  onClose,
  storeId,
  repId,
  note,
}: AddNoteModalProps) => {
  // Notes
  const [createNote, { isLoading: isCreating }] = useCreateNoteMutation();
  const [updateNote, { isLoading: isUpdating }] = useUpdateNoteMutation();
  const isNoteLoading = isCreating || isUpdating;

  // Contacts RTK hook for getting the count
  const { data: contactsData } = useGetAllContactsQuery(storeId, {
    skip: !storeId,
  });

  const [activeTab, setActiveTab] = useState<"note" | "contacts">("note");

  // react-hook-form for notes
  const {
    control,
    handleSubmit,
    reset,
    setValue,
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema) as unknown as Resolver<NoteFormData, any>,
  });

  // Load note into form when editing
  useEffect(() => {
    if (note) {
      reset({
        disposition: note.disposition || "",
        visitType: note.visitType || "",
        content: note.content || "",
        sample: note.sample || false,
        delivery: note.delivery || false,
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
        delivery: false,
        payment: {
          cash: false,
          check: false,
          noPay: false,
          amount: "",
        },
      });
    }
  }, [note, reset]);

  // reset when modal closes
  useEffect(() => {
    if (!open) {
      setActiveTab("note");
      reset(); // also reset note form
    }
  }, [open, reset]);

  /* -----------------------
     Note handlers
     ----------------------- */
  const onSubmit = async (data: NoteFormData) => {
    try {
      if (note) {
        await updateNote({ id: note._id, ...data }).unwrap();
        toast.success("Note updated successfully!");
      } else {
        const noteData = {
          ...data,
          entityId: storeId,
          author: repId,
          date: new Date().toISOString(),
        };
        await createNote(noteData).unwrap();
        toast.success("Note created successfully!");
      }
      reset();
      onClose();
    } catch (error) {
      toast.error(`Failed to ${note ? "update" : "create"} note.`);
      console.error(error);
    }
  };

  /* -----------------------
     Rendering
     ----------------------- */
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{note ? "Edit Note" : "Add a New Note"}</DialogTitle>

          {/* simple tab buttons */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("note")}
              className={`px-3 py-1 rounded-md ${
                activeTab === "note"
                  ? "bg-accent text-white"
                  : "bg-transparent border"
              }`}
            >
              Add Note
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("contacts")}
              className={`px-3 py-1 rounded-md ${
                activeTab === "contacts"
                  ? "bg-accent text-white"
                  : "bg-transparent border"
              }`}
            >
              Contacts {contactsData?.length ? `(${contactsData.length})` : ""}
            </button>
          </div>
        </DialogHeader>

        {/* Tab: Note Form */}
        {activeTab === "note" && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="disposition">Disposition</Label>
              <Controller
                name="disposition"
                control={control}
                render={({ field }) => <Input id="disposition" {...field} className="border border-green-500" />}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visitType">Visit Type</Label>
              <Controller
                name="visitType"
                control={control}
                render={({ field }) => <Input id="visitType" {...field} className="border border-green-500" />}
              />
            </div>

            <div className="space-y-2">
              <Label>Pre-written Text</Label>
              <Select onValueChange={(value) => setValue("content", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a pre-written message" />
                </SelectTrigger>
                <SelectContent>
                  {prewrittenTexts.map((text) => (
                    <SelectItem key={text} value={text}>
                      {text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Controller
                name="content"
                control={control}
                render={({ field }) => <Textarea id="content" {...field} className="border border-green-500" />}
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Controller
                  name="sample"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="sample"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border border-green-500"
                    />
                  )}
                />
                <Label htmlFor="sample">Sample</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  name="delivery"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="delivery"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border border-green-500"
                    />
                  )}
                />
                <Label htmlFor="delivery">Delivery</Label>
              </div>
            </div>

            <div className="space-y-2 border-t pt-4">
              <h4 className="font-medium">Payment</h4>

              <div className="flex items-center space-x-2">
                <Controller
                  name="payment.cash"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="cash"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border border-green-500"
                    />
                  )}
                />
                <Label htmlFor="cash">Cash</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  name="payment.check"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="check"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border border-green-500"
                    />
                  )}
                />
                <Label htmlFor="check">Check</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  name="payment.noPay"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="noPay"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border border-green-500"
                    />
                  )}
                />
                <Label htmlFor="noPay">No Pay</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Controller
                  name="payment.amount"
                  control={control}
                  render={({ field }) => <Input id="amount" {...field} className="border border-green-500" />}
                />
              </div>
            </div>

            <DialogFooter className="flex items-center justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isNoteLoading}>
                {isNoteLoading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {note ? "Update Note" : "Create Note"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Tab: Contacts */}
        {activeTab === "contacts" && (
          <ContactTab storeId={storeId} isActive={activeTab === "contacts"} />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddNoteModal;
