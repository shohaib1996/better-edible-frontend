"use client";

import {
  useGetAllContactsQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
} from "@/redux/api/Contacts/contactsApi";
import { toast } from "sonner";
import { Loader2, Pencil, Trash, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Store Contacts</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchContacts()}>
            Refresh
          </Button>
          <Button onClick={handleAddContactRow} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add Contact
          </Button>
        </div>
      </div>

      {contactsLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="animate-spin h-6 w-6 text-gray-600" />
        </div>
      ) : contacts.length === 0 ? (
        <p className="text-sm text-gray-500">
          No contacts found for this store.
        </p>
      ) : (
        <div className="space-y-3">
          {contacts.map((c, idx) => (
            <div key={c._id ?? `new-${idx}`} className="border rounded-md p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={c.name}
                        onChange={(e) =>
                          updateContactField(idx, "name", e.target.value)
                        }
                        disabled={!c.editing}
                        placeholder="Contact name"
                        className="border border-green-500"
                      />
                    </div>
                    <div>
                      <Label>Role</Label>
                      <Input
                        value={c.role}
                        onChange={(e) =>
                          updateContactField(idx, "role", e.target.value)
                        }
                        disabled={!c.editing}
                        placeholder="Role"
                        className="border border-green-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <div>
                      <Label>Email</Label>
                      <Input
                        value={c.email}
                        onChange={(e) =>
                          updateContactField(idx, "email", e.target.value)
                        }
                        disabled={!c.editing}
                        placeholder="Email"
                        className="border border-green-500"
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={c.phone}
                        onChange={(e) =>
                          updateContactField(idx, "phone", e.target.value)
                        }
                        disabled={!c.editing}
                        placeholder="Phone"
                        className="border border-green-500"
                      />
                    </div>
                  </div>

                  <div className="mt-2">
                    <Label>Important things to know</Label>
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
                      className="border border-green-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {c.saving || c.deleting ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <>
                      {!c.editing ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleEdit(idx)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => handleSaveContact(idx)}
                            size="sm"
                          >
                            Save
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => toggleEdit(idx)}
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteContact(idx)}
                        title="Delete Contact"
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="pt-4" />
    </div>
  );
};
