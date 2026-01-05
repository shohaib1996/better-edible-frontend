"use client";

import {
  useGetAllContactsQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
} from "@/redux/api/Contacts/contactsApi";
import { toast } from "sonner";
import { Loader2, Pencil, Trash, Plus, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

type ContactItem = {
  _id?: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  importantToKnow?: string;
  store?: string;
  // UI meta
  editing?: boolean;
  isNew?: boolean;
  saving?: boolean;
  deleting?: boolean;
};

interface ContactTabProps {
  storeId: string;
  isActive: boolean;
}

export const ContactTab = ({ storeId, isActive }: ContactTabProps) => {
  const {
    data: contactsData,
    isLoading: contactsLoading,
    refetch: refetchContacts,
  } = useGetAllContactsQuery(storeId, {
    skip: !storeId,
  });

  const [createContact] = useCreateContactMutation();
  const [updateContact] = useUpdateContactMutation();
  const [deleteContact] = useDeleteContactMutation();

  const [contacts, setContacts] = useState<ContactItem[]>([]);

  useEffect(() => {
    if (isActive) {
      refetchContacts();
    }
  }, [isActive, refetchContacts]);

  useEffect(() => {
    if (contactsData && Array.isArray(contactsData)) {
      const normalized: ContactItem[] = contactsData.map((c: any) => ({
        _id: c._id,
        name: c.name || "",
        role: c.role || "",
        email: c.email || "",
        phone: c.phone || "",
        importantToKnow: c.importantToKnow || "",
        store: String(c.store || storeId),
        editing: false,
        isNew: false,
      }));
      setContacts(normalized);
    } else {
      setContacts([]);
    }
  }, [contactsData, storeId]);

  const toggleEdit = (idx: number) => {
    setContacts((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, editing: !c.editing } : c))
    );
  };

  const updateContactField = (
    idx: number,
    field: keyof ContactItem,
    value: any
  ) => {
    setContacts((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    );
  };

  const handleAddContactRow = () => {
    setContacts((prev) => [
      ...prev,
      {
        name: "",
        role: "",
        email: "",
        phone: "",
        importantToKnow: "",
        store: storeId,
        editing: true,
        isNew: true,
      },
    ]);
  };

  const handleSaveContact = async (idx: number) => {
    const item = contacts[idx];
    if (!item) return;
    if (!item.name || item.name.trim().length === 0) {
      return toast.error("Contact name is required.");
    }

    setContacts((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, saving: true } : c))
    );

    try {
      if (item.isNew) {
        const payload = {
          name: item.name,
          role: item.role,
          email: item.email,
          phone: item.phone,
          importantToKnow: item.importantToKnow,
          store: storeId,
        };
        await createContact(payload).unwrap();
        toast.success("Contact created");
      } else {
        if (!item._id) {
          throw new Error("Missing contact id for update");
        }
        const payload = {
          id: item._id,
          name: item.name,
          role: item.role,
          email: item.email,
          phone: item.phone,
          importantToKnow: item.importantToKnow,
          store: storeId,
        };
        await updateContact(payload).unwrap();
        toast.success("Contact updated");
      }
      await refetchContacts();
    } catch (err) {
      console.error("Contact save error:", err);
      toast.error("Failed to save contact");
    } finally {
      setContacts((prev) =>
        prev.map((c, i) =>
          i === idx ? { ...c, saving: false, editing: false, isNew: false } : c
        )
      );
    }
  };

  const handleDeleteContact = async (idx: number) => {
    const item = contacts[idx];
    if (!item) return;
    if (!item._id) {
      setContacts((prev) => prev.filter((_, i) => i !== idx));
      return;
    }
    const confirmDelete = window.confirm("Delete this contact?");
    if (!confirmDelete) return;

    setContacts((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, deleting: true } : c))
    );
    try {
      await deleteContact(item._id).unwrap();
      setContacts((prev) => prev.filter((_, i) => i !== idx));
      toast.success("Contact deleted");
      await refetchContacts();
    } catch (err) {
      console.error("Delete contact error:", err);
      toast.error("Failed to delete contact");
      setContacts((prev) =>
        prev.map((c, i) => (i === idx ? { ...c, deleting: false } : c))
      );
    }
  };

  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto scrollbar-hidden p-0.5 flex-1 min-h-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-foreground">
          Store Contacts
        </h3>
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
        <p className="text-sm text-muted-foreground text-center py-8">
          No contacts found for this store.
        </p>
      ) : (
        <div className="space-y-3">
          {contacts.map((c, idx) => (
            <Card
              key={c._id ?? `new-${idx}`}
              className="p-4 rounded-xs border-border bg-card"
            >
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">
                        Name *
                      </Label>
                      <Input
                        value={c.name}
                        onChange={(e) =>
                          updateContactField(idx, "name", e.target.value)
                        }
                        disabled={!c.editing}
                        placeholder="Contact name"
                        className="border border-border rounded-xs bg-input text-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-primary disabled:opacity-60"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">
                        Role
                      </Label>
                      <Input
                        value={c.role}
                        onChange={(e) =>
                          updateContactField(idx, "role", e.target.value)
                        }
                        disabled={!c.editing}
                        placeholder="Role"
                        className="border border-border rounded-xs bg-input text-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-primary disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">
                        Email
                      </Label>
                      <Input
                        value={c.email}
                        onChange={(e) =>
                          updateContactField(idx, "email", e.target.value)
                        }
                        disabled={!c.editing}
                        placeholder="Email"
                        type="email"
                        className="border border-border rounded-xs bg-input text-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-primary disabled:opacity-60"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">
                        Phone
                      </Label>
                      <Input
                        value={c.phone}
                        onChange={(e) =>
                          updateContactField(idx, "phone", e.target.value)
                        }
                        disabled={!c.editing}
                        placeholder="Phone"
                        type="tel"
                        className="border border-border rounded-xs bg-input text-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-primary disabled:opacity-60"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-foreground">
                      Important things to know
                    </Label>
                    <Textarea
                      value={c.importantToKnow}
                      onChange={(e) =>
                        updateContactField(
                          idx,
                          "importantToKnow",
                          e.target.value
                        )
                      }
                      disabled={!c.editing}
                      placeholder="Important to know"
                      className="border border-border rounded-xs bg-input text-foreground resize-none focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_2px] focus-visible:shadow-primary disabled:opacity-60 min-h-[60px]"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex lg:flex-col items-center lg:items-end justify-end gap-2 lg:min-w-[100px]">
                  {c.saving || c.deleting ? (
                    <Loader2 className="animate-spin h-5 w-5 text-primary" />
                  ) : (
                    <>
                      {!c.editing ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleEdit(idx)}
                          className="rounded-xs border hover:text-primary hover:bg-muted cursor-pointer"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      ) : (
                        <div className="flex lg:flex-col gap-2 w-full lg:w-auto">
                          <Button
                            onClick={() => handleSaveContact(idx)}
                            size="sm"
                            className="flex-1 lg:flex-none rounded-xs bg-primary text-primary-foreground hover:bg-primary/90"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={() => toggleEdit(idx)}
                            size="sm"
                            className="flex-1 lg:flex-none rounded-xs bg-accent text-accent-foreground hover:bg-accent/90"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteContact(idx)}
                        title="Delete Contact"
                        className="rounded-xs border-destructive/30 text-destructive hover:bg-accent hover:text-white cursor-pointer"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <div className="pt-4" />
    </div>
  );
};
