"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Loader2, Edit, Plus } from "lucide-react";
import {
  EntityModal,
  Field,
} from "@/src/components/ReUsableComponents/EntityModal";
import { ConfirmDialog } from "@/src/components/ReUsableComponents/ConfirmDialog";
import {
  useCreateStoreMutation,
  useDeleteStoreMutation,
  useGetAllStoresQuery,
  useUpdateStoreMutation,
} from "@/src/redux/api/Stores/stores";

const Stores = () => {
  const { data, isLoading } = useGetAllStoresQuery(
    { page: 1, limit: 25 },
    { refetchOnMountOrArgChange: true }
  );
  const [createStore, { isLoading: creating }] = useCreateStoreMutation();
  const [updateStore, { isLoading: updating }] = useUpdateStoreMutation();
  const [deleteStore] = useDeleteStoreMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<any | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const stores = data?.stores || [];

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (values: any) => {
    try {
      // ✅ Convert flat contact fields to array of contacts
      const payload = {
        ...values,
        contacts: [
          {
            name: values.contactName,
            role: values.contactRole,
            email: values.contactEmail,
            phone: values.contactPhone,
          },
        ],
      };

      // Remove temporary single contact fields (not in schema)
      delete payload.contactName;
      delete payload.contactRole;
      delete payload.contactEmail;
      delete payload.contactPhone;

      if (editingStore) {
        await updateStore({ id: editingStore._id, body: payload });
      } else {
        await createStore(payload);
      }

      setModalOpen(false);
      setEditingStore(null);
    } catch (err) {
      console.error("Failed to save store:", err);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteStore(id);
  };

  // --- FORM FIELDS ---
  const fields: Field[] = [
    {
      name: "name",
      label: "Store Name",
      type: "text",
      placeholder: "Enter store name",
    },
    {
      name: "address",
      label: "Address",
      type: "text",
      placeholder: "123 Main St",
    },
    { name: "city", label: "City", type: "text", placeholder: "Enter city" },
    { name: "state", label: "State", type: "text", placeholder: "Enter state" },
    {
      name: "zip",
      label: "Zip Code",
      type: "text",
      placeholder: "Enter zip code",
    },

    // --- New contact fields ---
    {
      name: "contactName",
      label: "Contact Name",
      type: "text",
      placeholder: "Enter contact name",
    },
    {
      name: "contactRole",
      label: "Contact Role",
      type: "text",
      placeholder: "Enter contact role",
    },
    {
      name: "contactEmail",
      label: "Contact Email",
      type: "text",
      placeholder: "Enter contact email",
    },
    {
      name: "contactPhone",
      label: "Contact Phone",
      type: "text",
      placeholder: "Enter contact phone",
    },

    {
      name: "terms",
      label: "Terms",
      type: "select",
      options: [
        { label: "COD", value: "COD" },
        { label: "15 Days", value: "15 days" },
        { label: "30 Days", value: "30 days" },
      ],
    },
    {
      name: "group",
      label: "Group",
      type: "select",
      options: Array.from({ length: 10 }, (_, i) => ({
        label: `${i + 1}`,
        value: `${i + 1}`,
      })),
    },
  ];

  // --- LOADING STATE ---
  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-gray-600" />
      </div>
    );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Stores</h2>
        <Button
          onClick={() => {
            setEditingStore(null);
            setModalOpen(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Store
        </Button>
      </div>

      {/* Store Cards */}
      <div className="grid gap-4">
        {stores.map((store: any) => (
          <Card
            key={store._id}
            className="flex flex-col md:flex-row items-center justify-between p-4 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4 w-full">
              <Checkbox
                className="border-accent"
                checked={selected.includes(store._id)}
                onCheckedChange={() => handleSelect(store._id)}
              />
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{store.name}</h3>
                <p className="text-sm text-gray-500">
                  {store.address || "No address"}
                </p>

                {store.contacts && store.contacts.length > 0 ? (
                  <div className="mt-2 space-y-1 text-sm flex">
                    <p className="font-medium text-gray-700">Contacts:</p>
                    {store.contacts.map((c: any, idx: number) => (
                      <div key={idx} className="pl-2 flex flex-wrap gap-2">
                        <span>
                          <strong>{c?.name}</strong>{" "}
                          {c?.role && <span>({c.role})</span>}
                        </span>
                        {c?.email && <span>| {c.email}</span>}
                        {c?.phone && <span>| {c.phone}</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mt-1">
                    No contacts available.
                  </p>
                )}
                {store.rep && (
                  <div className="text-sm mt-1">
                    <strong>Rep:</strong> {store.rep.name || store.rep}
                  </div>
                )}
                <div className="text-sm mt-1">
                  <strong>Blocked:</strong>{" "}
                  {store.blocked ? (
                    <span className="text-red-500">Yes</span>
                  ) : (
                    <span className="text-green-600">No</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 md:mt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingStore(store);
                  setModalOpen(true);
                }}
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>

              <ConfirmDialog
                triggerText="Delete"
                onConfirm={() => handleDelete(store._id)}
                title={`Delete ${store.name}?`}
                description="This action cannot be undone."
                confirmText="Yes, delete"
              />
            </div>
          </Card>
        ))}
      </div>

      {stores.length === 0 && (
        <p className="text-gray-500 text-center mt-8">No stores found.</p>
      )}

      {/* Modal for Add/Edit */}
      <EntityModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingStore ? "Edit Store" : "Add Store"}
        fields={fields}
        initialData={editingStore || {}}
        isSubmitting={creating || updating}
      />
    </div>
  );
};

export default Stores;
