"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Loader2, Edit, Plus } from "lucide-react";
import {
  EntityModal,
  Field,
} from "@/src/components/ReUsableComponents/EntityModal";
import {
  useCreateStoreMutation,
  useGetAllStoresQuery,
  useUpdateStoreMutation,
} from "@/src/redux/api/Stores/stores";
import { useDebounced } from "@/src/redux/hooks/hooks";
import { IRep, IStore } from "@/src/types";
import { toast } from "sonner";
import { NotesModal } from "@/src/components/Notes/NotesModal";
import { OrdersModal } from "@/src/components/Orders/OrdersModal";
import { DeliveryModal } from "@/src/components/Delivery/DeliveryModal";
import { useUser } from "@/src/redux/hooks/useAuth";
import { AddNoteModal } from "@/src/components/Notes/AddNoteModal";

const Stores = () => {
  // 🔍 Search + Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounced({ searchQuery, delay: 500 });
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // 📦 Local state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<any | null>(null);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [addNoteModalOpen, setAddNoteModalOpen] = useState(false);
  const [selectedStoreForNote, setSelectedStoreForNote] = useState<IStore | null>(null);

  const user = useUser();
  const currentRep: Partial<IRep> | null = {
    _id: user?.id,
    name: user?.name
  }

  // 📡 API hooks
  const { data, isLoading, refetch } = useGetAllStoresQuery(
    {
      page: 1,
      limit: 25,
      search: debouncedSearch || "",
      repId: user?.id || "",
      paymentStatus:
        paymentFilter !== "all" && paymentFilter !== "due" ? paymentFilter : "",
      isDue: paymentFilter === "due" ? "true" : undefined,
    },
    { refetchOnMountOrArgChange: true, skip: !user?.id }
  );

  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedStoreData, setSelectedStoreData] = useState<{
    _id: string;
    name: string;
    address: string;
  } | null>(null);

  const [createStore, { isLoading: creating }] = useCreateStoreMutation();
  const [updateStore, { isLoading: updating }] = useUpdateStoreMutation();

  const stores: IStore[] = data?.stores || [];

  // ✅ Add/Edit submit
  const handleSubmit = async (values: any) => {
    try {
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
        rep: user?.id,
      };
      delete payload.contactName;
      delete payload.contactRole;
      delete payload.contactEmail;
      delete payload.contactPhone;

      if (editingStore) {
        await updateStore({ id: editingStore._id, body: payload });
      } else {
        await createStore(payload);
      }

      toast.success("Store saved successfully!");
      setModalOpen(false);
      setEditingStore(null);
      refetch();
    } catch (err) {
      console.error("Failed to save store:", err);
      toast.error("Failed to save store.");
    }
  };

  // --- Form fields ---
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

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin h-8 w-8 text-gray-600" />
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <h2 className="text-2xl font-semibold">Stores</h2>

        <div className="flex flex-wrap items-center gap-3 justify-end">
          <Input
            type="text"
            placeholder="Search by store name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 border border-accent"
          />
          <Select
            value={paymentFilter}
            onValueChange={(value) => setPaymentFilter(value)}
          >
            <SelectTrigger className="w-[200px] border border-accent">
              <SelectValue placeholder="Filter by Due" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stores</SelectItem>
              <SelectItem value="due">
                <span className="flex items-center gap-2">⚪ All Due</span>
              </SelectItem>
              <SelectItem value="green">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Less than 7 days
                </span>
              </SelectItem>
              <SelectItem value="yellow">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  Less than 30 days
                </span>
              </SelectItem>
              <SelectItem value="red">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  More than 30 days
                </span>
              </SelectItem>
            </SelectContent>
          </Select>

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
      </div>

      {/* Store Cards */}
      <div className="grid gap-4">
        {stores.map((store: any) => {
          const hasDue = store.dueAmount > 0;
          const paymentColor =
            store.paymentStatus === "red"
              ? "text-red-500"
              : store.paymentStatus === "yellow"
              ? "text-yellow-500"
              : store.paymentStatus === "green"
              ? "text-green-600"
              : "text-gray-500";

          return (
            <Card
              key={store._id}
              className={`flex flex-col md:flex-row justify-between p-4 shadow-sm hover:shadow-md transition-all ${
                store.blocked ? "opacity-70 border-red-300" : ""
              }`}
            >
              {/* LEFT CONTENT */}
              <div className="flex items-start gap-4 w-full md:w-2/3">
                <div className="flex-1">
                  <h3
                    className="text-lg text-black font-bold dark:text-white relative inline-block after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-0.5 after:bg-[#326EA6] after:transition-all after:duration-300 hover:after:w-full cursor-pointer"
                    onClick={() => {
                      setSelectedStoreForNote(store);
                      setAddNoteModalOpen(true);
                    }}
                  >
                    {store.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {store.address || "No address"}
                  </p>

                  <div className="text-sm mt-1">
                    <strong>Rep:</strong> {store.rep.name}
                  </div>

                  {/* Contact Info */}
                  {store.contacts?.length > 0 ? (
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

                  <div className="text-sm mt-1">
                    <strong>Status:</strong>{" "}
                    {store.blocked ? (
                      <span className="text-red-500">Paused</span>
                    ) : (
                      <span className="text-green-600">Active</span>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE: DUE INFO + BUTTONS */}
              <div className="flex flex-col items-end justify-between w-full md:w-1/3 mt-4 md:mt-0">
                {hasDue && (
                  <div
                    className={`text-sm font-medium ${paymentColor} mb-2 text-right`}
                  >
                    Due: ${store.dueAmount.toLocaleString()}
                    {store.lastPaidAt && (
                      <span className="block text-gray-500 text-xs">
                        Last paid:{" "}
                        {new Date(store.lastPaidAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedStoreId(store._id);
                      setNotesModalOpen(true);
                      setSelectedStoreData(store);
                    }}
                  >
                    🗒️ Notes
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedStoreId(store._id);
                      setOrdersModalOpen(true);
                    }}
                  >
                    🗒️ Orders
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedStore(store);
                      setDeliveryModalOpen(true);
                    }}
                  >
                    🚚 Delivery
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const contact = store.contacts?.[0] || {};
                      setEditingStore({
                        ...store,
                        contactName: contact.name || "",
                        contactRole: contact.role || "",
                        contactEmail: contact.email || "",
                        contactPhone: contact.phone || "",
                        rep: store.rep?._id || store.rep || "",
                      });
                      setModalOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {stores.length === 0 && (
        <p className="text-gray-500 text-center mt-8">No stores found.</p>
      )}

      {/* Add/Edit Modal */}
      <EntityModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        title={editingStore ? "Edit Store" : "Add Store"}
        fields={fields}
        initialData={editingStore || {}}
        isSubmitting={creating || updating}
      />

      <NotesModal
        open={notesModalOpen}
        onClose={() => setNotesModalOpen(false)}
        entityId={selectedStoreData ?? undefined}
      />

      <OrdersModal
        open={ordersModalOpen}
        onClose={() => setOrdersModalOpen(false)}
        storeId={selectedStoreId}
      />

      <DeliveryModal
        open={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        store={selectedStore}
        rep={currentRep}
      />

      {selectedStoreForNote && user && (
        <AddNoteModal
          open={addNoteModalOpen}
          onClose={() => setAddNoteModalOpen(false)}
          storeId={selectedStoreForNote._id}
          repId={user.id}
        />
      )}
    </div>
  );
};

export default Stores;
