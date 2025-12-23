"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Edit, Plus, PauseCircle, PlayCircle } from "lucide-react";
import {
  EntityModal,
  Field,
} from "@/components/ReUsableComponents/EntityModal";
import { ConfirmDialog } from "@/components/ReUsableComponents/ConfirmDialog";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import {
  useAssignStoreToRepMutation,
  useCreateStoreMutation,
  useDeleteStoreMutation,
  useGetAllStoresQuery,
  useToggleBlockStoresMutation,
  useUpdateStoreMutation,
} from "@/redux/api/Stores/stores";
import { useGetAllRepsQuery } from "@/redux/api/Rep/repApi";
import { useDebounced } from "@/redux/hooks/hooks";
import { IRep, IStore } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { NotesModal } from "@/components/Notes/NotesModal";
import { OrdersModal } from "@/components/Orders/OrdersModal";
import { DeliveryModal } from "@/components/Delivery/DeliveryModal";
import { AddNoteModal } from "@/components/Notes/AddNoteModal";
import { useUser } from "@/redux/hooks/useAuth";
import { ManageFollowUpModal } from "@/components/Followup/ManageFollowUpModal";

const Stores = () => {
  // 🔍 Search + Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounced({ searchQuery, delay: 500 });
  const [selectedRepFilter, setSelectedRepFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // 📄 Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // 📦 Local state
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<any | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedRep, setSelectedRep] = useState<string>("");
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [addNoteModalOpen, setAddNoteModalOpen] = useState(false);
  const [selectedStoreForNote, setSelectedStoreForNote] =
    useState<IStore | null>(null);
  const [followupModalOpen, setFollowupModalOpen] = useState(false);
  const [selectedStoreForFollowup, setSelectedStoreForFollowup] =
    useState<IStore | null>(null);

  const user = useUser();

  // 📡 API hooks
  const { data, isLoading, refetch } = useGetAllStoresQuery(
    {
      page: currentPage,
      limit: limit,
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
  const [selectedStoreData, setSelectedStoreData] = useState<{
    _id: string;
    name: string;
    address: string;
  } | null>(null);

  const [createStore, { isLoading: creating }] = useCreateStoreMutation();
  const [updateStore, { isLoading: updating }] = useUpdateStoreMutation();
  const [deleteStore] = useDeleteStoreMutation();
  const [assignStoreToRep, { isLoading: assigning }] =
    useAssignStoreToRepMutation();
  const [toggleBlockStores, { isLoading: toggling }] =
    useToggleBlockStoresMutation();

  const stores = data?.stores || [];
  const totalStores = data?.total || 0;
  const totalPages = Math.ceil(totalStores / limit);

  // Handle pagination changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelected([]); // Clear selections when changing pages
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1); // Reset to first page when changing limit
    setSelected([]); // Clear selections
  };

  // ✅ Select store
  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // ✅ Add/Edit submit
  const handleSubmit = async (values: any) => {
    try {
      const payload = { ...values };

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
        <div>
          <h2 className="text-2xl font-semibold">Stores</h2>
          <p className="text-sm text-gray-600 mt-1">
            Total Stores: <span className="font-medium">{totalStores}</span>
          </p>
        </div>

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

                  {/* Contact Info */}
                  {Array.isArray(store?.contacts) &&
                  store.contacts.length > 0 ? (
                    <div className="mt-2 space-y-1 text-sm flex">
                      <p className="font-medium text-gray-700">Contacts:</p>
                      {store.contacts.map((c: any, idx: number) => (
                        <div
                          key={idx}
                          className="pl-2 flex flex-col gap-1 mb-2"
                        >
                          <div className="flex flex-wrap gap-2">
                            <span>
                              <strong>{c?.name}</strong>{" "}
                              {c?.role && <span>({c.role})</span>}
                            </span>
                            {c?.email && <span>| {c.email}</span>}
                            {c?.phone && <span>| {c.phone}</span>}
                          </div>
                          {c?.importantToKnow && (
                            <div className="text-sm text-green-600">
                              <strong>Important:</strong> {c.importantToKnow}
                            </div>
                          )}
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
                    variant="secondary"
                    size="sm"
                    className="bg-blue-700 hover:bg-blue-800 text-white"
                    onClick={() => {
                      setSelectedStoreForFollowup(store);
                      setFollowupModalOpen(true);
                    }}
                  >
                    Follow Up
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingStore({
                        ...store,
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

      {/* Pagination */}
      {totalStores > 0 && (
        <GlobalPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalStores}
          itemsPerPage={limit}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
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
      />

      {selectedStoreForNote && user && (
        <AddNoteModal
          open={addNoteModalOpen}
          onClose={() => setAddNoteModalOpen(false)}
          storeId={selectedStoreForNote._id}
          repId={user.id}
        />
      )}

      {selectedStoreForFollowup && (
        <ManageFollowUpModal
          open={followupModalOpen}
          onClose={() => setFollowupModalOpen(false)}
          storeId={selectedStoreForFollowup._id}
          showRepSelect={true}
        />
      )}
    </div>
  );
};

export default Stores;
