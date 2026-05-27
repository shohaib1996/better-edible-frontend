"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  useGetAllContactsQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
} from "@/redux/api/Contacts/contactsApi";
import { useAdminResetStorePasswordMutation } from "@/redux/api/StoreAuth/storeAuthApi";
import { Button } from "@/components/ui/button";
import { ContactCard, type ContactItem } from "./ContactCard";
import { ResetPasswordDialog } from "./ResetPasswordDialog";

interface ContactTabProps {
  storeId: string;
  isActive: boolean;
}

export const ContactTab = ({ storeId, isActive }: ContactTabProps) => {
  const { data: contactsData, isLoading: contactsLoading, refetch: refetchContacts } =
    useGetAllContactsQuery(storeId, { skip: !storeId });

  const [createContact] = useCreateContactMutation();
  const [updateContact] = useUpdateContactMutation();
  const [deleteContact] = useDeleteContactMutation();
  const [adminResetStorePassword] = useAdminResetStorePasswordMutation();

  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  useEffect(() => {
    if (isActive) refetchContacts();
  }, [isActive, refetchContacts]);

  useEffect(() => {
    if (contactsData && Array.isArray(contactsData)) {
      setContacts(
        contactsData.map((c: any) => ({
          _id: c._id,
          name: c.name || "",
          role: c.role || "",
          email: c.email || "",
          phone: c.phone || "",
          importantToKnow: c.importantToKnow || "",
          store: String(c.store || storeId),
          editing: false,
          isNew: false,
        })),
      );
    } else {
      setContacts([]);
    }
  }, [contactsData, storeId]);

  const toggleEdit = (idx: number) =>
    setContacts((prev) => prev.map((c, i) => (i === idx ? { ...c, editing: !c.editing } : c)));

  const updateContactField = (idx: number, field: keyof ContactItem, value: string) =>
    setContacts((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));

  const handleAddContactRow = () =>
    setContacts((prev) => [
      ...prev,
      { name: "", role: "", email: "", phone: "", importantToKnow: "", store: storeId, editing: true, isNew: true },
    ]);

  const handleSaveContact = async (idx: number) => {
    const item = contacts[idx];
    if (!item) return;
    if (!item.name?.trim()) return toast.error("Contact name is required.");

    setContacts((prev) => prev.map((c, i) => (i === idx ? { ...c, saving: true } : c)));
    try {
      if (item.isNew) {
        await createContact({ name: item.name, role: item.role, email: item.email, phone: item.phone, importantToKnow: item.importantToKnow, store: storeId }).unwrap();
        toast.success("Contact created");
      } else {
        if (!item._id) throw new Error("Missing contact id for update");
        await updateContact({ id: item._id, name: item.name, role: item.role, email: item.email, phone: item.phone, importantToKnow: item.importantToKnow, store: storeId }).unwrap();
        toast.success("Contact updated");
      }
      await refetchContacts();
    } catch {
      toast.error("Failed to save contact");
    } finally {
      setContacts((prev) =>
        prev.map((c, i) => (i === idx ? { ...c, saving: false, editing: false, isNew: false } : c)),
      );
    }
  };

  const handleDeleteContact = async (idx: number) => {
    const item = contacts[idx];
    if (!item) return;
    if (!item._id) { setContacts((prev) => prev.filter((_, i) => i !== idx)); return; }
    if (!window.confirm("Delete this contact?")) return;

    setContacts((prev) => prev.map((c, i) => (i === idx ? { ...c, deleting: true } : c)));
    try {
      await deleteContact(item._id).unwrap();
      setContacts((prev) => prev.filter((_, i) => i !== idx));
      toast.success("Contact deleted");
      await refetchContacts();
    } catch {
      toast.error("Failed to delete contact");
      setContacts((prev) => prev.map((c, i) => (i === idx ? { ...c, deleting: false } : c)));
    }
  };

  const confirmResetPassword = async () => {
    if (!resetTarget) return;
    const target = resetTarget;
    setResettingId(target.id);
    setResetTarget(null);
    try {
      await adminResetStorePassword(target.id).unwrap();
      toast.success(`Password reset. ${target.name} can now log in with their store's ZIP code.`);
    } catch {
      toast.error("Failed to reset password");
    }
    setResettingId(null);
  };

  return (
    <>
      <div className="space-y-4 max-h-[60vh] overflow-y-auto scrollbar-hidden p-0.5 flex-1 min-h-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-foreground">Store Contacts</h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchContacts()}
              className="flex-1 sm:flex-none rounded-xs border-border hover:bg-muted"
            >
              <RefreshCw className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button
              onClick={handleAddContactRow}
              size="sm"
              className="flex-1 sm:flex-none rounded-xs bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Contact</span>
            </Button>
          </div>
        </div>

        {contactsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin h-6 w-6 text-primary" />
          </div>
        ) : contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No contacts found for this store.</p>
        ) : (
          <div className="space-y-3">
            {contacts.map((c, idx) => (
              <ContactCard
                key={c._id ?? `new-${idx}`}
                contact={c}
                idx={idx}
                resettingId={resettingId}
                onToggleEdit={toggleEdit}
                onFieldChange={updateContactField}
                onSave={handleSaveContact}
                onDelete={handleDeleteContact}
                onResetPassword={(id, name) => setResetTarget({ id, name })}
              />
            ))}
          </div>
        )}
        <div className="pt-4" />
      </div>

      <ResetPasswordDialog
        target={resetTarget}
        onConfirm={confirmResetPassword}
        onClose={() => setResetTarget(null)}
      />
    </>
  );
};
