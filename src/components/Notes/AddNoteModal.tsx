// src/components/Notes/AddNoteModal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  useCreateNoteMutation,
  useUpdateNoteMutation,
} from "@/redux/api/Notes/notes";
import { useGetAllContactsQuery } from "@/redux/api/Contacts/contactsApi";
import { toast } from "sonner";
import { Loader2, FileText, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { INote } from "@/types/note/note";
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
  const { control, handleSubmit, reset, setValue } = useForm<NoteFormData>({
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
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] bg-background border-border rounded-xs flex flex-col">
        <DialogHeader className="border-b border-border pb-3 shrink-0">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
            <FileText className="h-5 w-5 text-primary" />
            {note ? "Edit Note" : "Add a New Note"}
          </DialogTitle>

          {/* Tab buttons */}
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

        {/* Tab: Note Form */}
        {activeTab === "note" && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto scrollbar-hidden p-0.5 flex-1 min-h-0">
            <div className="space-y-1.5">
              <Label htmlFor="disposition" className="text-xs font-semibold text-foreground">
                Disposition
              </Label>
              <Controller
                name="disposition"
                control={control}
                render={({ field }) => (
                  <Input
                    id="disposition"
                    {...field}
                    className="border border-border rounded-xs bg-input text-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-primary"
                    placeholder="Enter disposition"
                  />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="visitType" className="text-xs font-semibold text-foreground">
                Visit Type
              </Label>
              <Controller
                name="visitType"
                control={control}
                render={({ field }) => (
                  <Input
                    id="visitType"
                    {...field}
                    className="border border-border rounded-xs bg-input text-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-primary"
                    placeholder="Enter visit type"
                  />
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Pre-written Text</Label>
              <Select onValueChange={(value) => setValue("content", value)}>
                <SelectTrigger className="border-border rounded-xs bg-input text-foreground focus:ring-0 focus:border-primary">
                  <SelectValue placeholder="Select a pre-written message" />
                </SelectTrigger>
                <SelectContent className="rounded-xs">
                  {prewrittenTexts.map((text) => (
                    <SelectItem key={text} value={text} className="rounded-xs">
                      {text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content" className="text-xs font-semibold text-foreground">
                Content
              </Label>
              <Controller
                name="content"
                control={control}
                render={({ field }) => (
                  <Textarea
                    id="content"
                    {...field}
                    className="border border-border rounded-xs bg-input text-foreground resize-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-primary min-h-[100px]"
                    placeholder="Enter note content"
                    rows={4}
                  />
                )}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center space-x-2">
                <Controller
                  name="sample"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="sample"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border-accent"
                    />
                  )}
                />
                <Label htmlFor="sample" className="text-sm font-medium text-foreground cursor-pointer">
                  Sample
                </Label>
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
                      className="border-accent"
                    />
                  )}
                />
                <Label htmlFor="delivery" className="text-sm font-medium text-foreground cursor-pointer">
                  Delivery
                </Label>
              </div>
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <h4 className="text-base font-semibold text-foreground">Payment</h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="payment.cash"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="cash"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border-accent"
                      />
                    )}
                  />
                  <Label htmlFor="cash" className="text-sm font-medium text-foreground cursor-pointer">
                    Cash
                  </Label>
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
                        className="border-accent"
                      />
                    )}
                  />
                  <Label htmlFor="check" className="text-sm font-medium text-foreground cursor-pointer">
                    Check
                  </Label>
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
                        className="border-accent"
                      />
                    )}
                  />
                  <Label htmlFor="noPay" className="text-sm font-medium text-foreground cursor-pointer">
                    No Pay
                  </Label>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-xs font-semibold text-foreground">
                  Amount
                </Label>
                <Controller
                  name="payment.amount"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="amount"
                      {...field}
                      type="number"
                      placeholder="0.00"
                      className="border border-border rounded-xs bg-input text-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-primary"
                    />
                  )}
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 border-t border-border pt-3 shrink-0">
              <Button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto rounded-xs bg-accent text-accent-foreground hover:bg-accent/90"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isNoteLoading}
                className="w-full sm:w-auto rounded-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
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
