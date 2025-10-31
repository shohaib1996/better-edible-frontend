"use client";

import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Card } from "@/src/components/ui/card";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Loader2, Edit, Plus, PauseCircle, PlayCircle } from "lucide-react";
import {
  EntityModal,
  Field,
} from "@/src/components/ReUsableComponents/EntityModal";
import { ConfirmDialog } from "@/src/components/ReUsableComponents/ConfirmDialog";
import {
  useAssignStoreToRepMutation,
  useCreateStoreMutation,
  useDeleteStoreMutation,
  useGetAllStoresQuery,
  useToggleBlockStoresMutation,
  useUpdateStoreMutation,
} from "@/src/redux/api/Stores/stores";
import { useGetAllRepsQuery } from "@/src/redux/api/Rep/repApi";
import { useDebounced } from "@/src/redux/hooks/hooks";
import { IRep } from "@/src/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { toast } from "sonner";
import { NotesModal } from "@/src/components/Notes/NotesModal";
import { OrdersModal } from "@/src/components/Orders/OrdersModal";
import { DeliveryModal } from "@/src/components/Delivery/DeliveryModal";

const Stores = () => {
  // 🔍 Search + Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounced({ searchQuery, delay: 500 });
  const [selectedRepFilter, setSelectedRepFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // 📦 Local state
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<any | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedRep, setSelectedRep] = useState<string>("");
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);

  // 📡 API hooks
  const { data, isLoading, refetch } = useGetAllStoresQuery(
    {
      page: 1,
      limit: 25,
      search: debouncedSearch || "",
      repId: selectedRepFilter || "",
      paymentStatus:
        paymentFilter !== "all" && paymentFilter !== "due" ? paymentFilter : "",
      isDue: paymentFilter === "due" ? "true" : undefined,
    },
    { refetchOnMountOrArgChange: true }
  );

  const { data: reps, isLoading: repsLoading } = useGetAllRepsQuery(
    {},
    { refetchOnMountOrArgChange: true }
  );

  const allReps: IRep[] = reps?.data || [];
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);

  const [createStore, { isLoading: creating }] = useCreateStoreMutation();
  const [updateStore, { isLoading: updating }] = useUpdateStoreMutation();
  const [deleteStore] = useDeleteStoreMutation();
  const [assignStoreToRep, { isLoading: assigning }] =
    useAssignStoreToRepMutation();
  const [toggleBlockStores, { isLoading: toggling }] =
    useToggleBlockStoresMutation();

  const stores = data?.stores || [];

  // ✅ Select store
  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

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

  // ✅ Delete store
  const handleDelete = async (id: string) => {
    await deleteStore(id);
    toast.success("Store deleted successfully!");
    refetch();
  };

  // ✅ Assign stores to rep
  const handleAssign = async () => {
    if (!selectedRep || selected.length === 0)
      return toast.error("Select rep & stores first!");

    try {
      await assignStoreToRep({
        storeIds: selected,
        repId: selectedRep,
      }).unwrap();
      toast.success("Stores successfully assigned!");
      setAssignModalOpen(false);
      setSelected([]);
      setSelectedRep("");
      refetch();
    } catch (err) {
      console.error("Error assigning stores:", err);
      toast.error("Failed to assign stores.");
    }
  };

  // ✅ Pause/Unpause
  const handleToggleBlock = async () => {
    if (selected.length === 0)
      return toast.error("Select at least one store first.");

    const selectedStores = stores.filter((store: any) =>
      selected.includes(store._id)
    );

    const isCurrentlyBlocked = selectedStores.every((s: any) => s.blocked);
    const newBlockState = !isCurrentlyBlocked;

    try {
      await toggleBlockStores({
        storeIds: selected,
        blocked: newBlockState,
      }).unwrap();

      toast.success(
        newBlockState
          ? "Selected stores paused successfully."
          : "Selected stores unpaused successfully."
      );
      setSelected([]);
      refetch();
    } catch (err) {
      console.error("Error toggling block:", err);
      toast.error("Failed to update store status.");
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
      name: "rep",
      label: "Assigned Rep",
      type: "select",
      options: allReps.map((rep) => ({
        label: rep.name,
        value: rep._id,
      })),
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

          <Select
            value={selectedRepFilter || "all"}
            onValueChange={(value) =>
              setSelectedRepFilter(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-[180px] border border-accent">
              <SelectValue placeholder="Filter by Rep" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Reps</SelectItem>
              {allReps.map((rep) => (
                <SelectItem key={rep._id} value={rep._id}>
                  {rep.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            disabled={selected.length === 0 || toggling}
            onClick={handleToggleBlock}
            className="flex items-center gap-2"
          >
            {toggling ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              (() => {
                const selectedStores = stores.filter((s: any) =>
                  selected.includes(s._id)
                );
                const allBlocked = selectedStores.every((s: any) => s.blocked);
                return allBlocked ? (
                  <>
                    <PlayCircle className="h-4 w-4" /> Unpause
                  </>
                ) : (
                  <>
                    <PauseCircle className="h-4 w-4" /> Pause
                  </>
                );
              })()
            )}
          </Button>

          <Button
            disabled={selected.length === 0}
            onClick={() => setAssignModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Assign Stores
          </Button>

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

                  {store.rep && (
                    <div className="text-sm mt-1">
                      <strong>Rep:</strong> {store.rep.name || store.rep}
                    </div>
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

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedStoreId(store._id);
                      setNotesModalOpen(true);
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

                  <ConfirmDialog
                    triggerText="Delete"
                    onConfirm={() => handleDelete(store._id)}
                    title={`Delete ${store.name}?`}
                    description="This action cannot be undone."
                    confirmText="Yes, delete"
                  />
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

      {/* Assign Stores Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select a Rep to Assign Stores</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-80 overflow-y-auto mt-4">
            {repsLoading ? (
              <Loader2 className="animate-spin mx-auto h-6 w-6 text-gray-500" />
            ) : (
              allReps.map((rep) => (
                <label
                  key={rep._id}
                  className="flex items-center space-x-3 border rounded-lg p-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="repSelect"
                    checked={selectedRep === rep._id}
                    onChange={() => setSelectedRep(rep._id)}
                  />
                  <span className="text-sm font-medium">{rep.name}</span>
                </label>
              ))
            )}
          </div>

          <div className="mt-6 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={assigning || !selectedRep}>
              {assigning ? (
                <Loader2 className="animate-spin h-4 w-4 mr-1" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <NotesModal
        open={notesModalOpen}
        onClose={() => setNotesModalOpen(false)}
        entityId={selectedStoreId}
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
      />
    </div>
  );
};

export default Stores;
