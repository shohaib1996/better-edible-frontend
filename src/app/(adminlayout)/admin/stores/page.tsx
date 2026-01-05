"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  EntityModal,
  Field,
} from "@/components/ReUsableComponents/EntityModal";
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
import { toast } from "sonner";
import { NotesModal } from "@/components/Notes/NotesModal";
import { OrdersModal } from "@/components/Orders/OrdersModal";
import { DeliveryModal } from "@/components/Delivery/DeliveryModal";
import { AddNoteModal } from "@/components/Notes/AddNoteModal";
import { useUser } from "@/redux/hooks/useAuth";
import { CreateOrderModal } from "@/components/Orders/CreateOrderModal";
import { ManageFollowUpModal } from "@/components/Followup/ManageFollowUpModal";
import { StoreCard } from "@/components/Stores/StoreCard";
import { StoreListItem } from "@/components/Stores/StoreListItem";
import { StoreFilters } from "@/components/Stores/StoreFilters";
import { StoreActions } from "@/components/Stores/StoreActions";
import { AssignStoresModal } from "@/components/Stores/AssignStoresModal";

const Stores = () => {
  // 🔍 Search + Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounced({ searchQuery, delay: 500 });
  const [selectedRepFilter, setSelectedRepFilter] = useState<string>("");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("asc"); // asc or desc

  // 📄 Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // 📦 Local state
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<any | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [addNoteModalOpen, setAddNoteModalOpen] = useState(false);
  const [selectedStoreForNote, setSelectedStoreForNote] =
    useState<IStore | null>(null);
  const [followupModalOpen, setFollowupModalOpen] = useState(false);
  const [selectedStoreForFollowup, setSelectedStoreForFollowup] =
    useState<IStore | null>(null);
  const [createOrderModalOpen, setCreateOrderModalOpen] = useState(false);
  const [selectedStoreForOrder, setSelectedStoreForOrder] =
    useState<IStore | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

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
      sortOrder: sortOrder,
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
  const handleAssign = async (repId: string) => {
    if (!repId || selected.length === 0)
      return toast.error("Select rep & stores first!");

    try {
      await assignStoreToRep({
        storeIds: selected,
        repId: repId,
      }).unwrap();
      toast.success("Stores successfully assigned!");
      setAssignModalOpen(false);
      setSelected([]);
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
        <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
      </div>
    );

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4 mb-6">
        {/* Title Section */}
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-foreground">
            Stores
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Total Stores: <span className="font-medium">{totalStores}</span>
          </p>
        </div>

        {/* Filters Row */}
        <StoreFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          paymentFilter={paymentFilter}
          onPaymentFilterChange={setPaymentFilter}
          selectedRepFilter={selectedRepFilter}
          onRepFilterChange={setSelectedRepFilter}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          allReps={allReps}
        />

        {/* Action Buttons Row */}
        <StoreActions
          selected={selected}
          stores={stores}
          toggling={toggling}
          onToggleBlock={handleToggleBlock}
          onAssignStores={() => setAssignModalOpen(true)}
          onAddStore={() => {
            setEditingStore(null);
            setModalOpen(true);
          }}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>

      {/* Store Cards/List */}
      {viewMode === "list" ? (
        <div className="grid gap-4">
          {stores.map((store: any) => (
            <StoreCard
              key={store._id}
              store={store}
              selected={selected.includes(store._id)}
              onSelect={handleSelect}
              onEdit={(store) => {
                setEditingStore({
                  ...store,
                  rep: store.rep?._id || store.rep || "",
                });
                setModalOpen(true);
              }}
              onDelete={handleDelete}
              onOpenNotes={(store) => {
                setSelectedStoreId(store._id);
                setNotesModalOpen(true);
                setSelectedStoreData(store);
              }}
              onOpenOrders={(storeId) => {
                setSelectedStoreId(storeId);
                setOrdersModalOpen(true);
              }}
              onOpenDelivery={(store) => {
                setSelectedStore(store);
                setDeliveryModalOpen(true);
              }}
              onOpenFollowup={(store) => {
                setSelectedStoreForFollowup(store);
                setFollowupModalOpen(true);
              }}
              onOpenCreateOrder={(store) => {
                setSelectedStoreForOrder(store);
                setCreateOrderModalOpen(true);
              }}
              onAddNote={(store) => {
                setSelectedStoreForNote(store);
                setAddNoteModalOpen(true);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {stores.map((store: any) => (
            <StoreListItem
              key={store._id}
              store={store}
              selected={selected.includes(store._id)}
              onSelect={handleSelect}
              onEdit={(store) => {
                setEditingStore({
                  ...store,
                  rep: store.rep?._id || store.rep || "",
                });
                setModalOpen(true);
              }}
              onDelete={handleDelete}
              onOpenNotes={(store) => {
                setSelectedStoreId(store._id);
                setNotesModalOpen(true);
                setSelectedStoreData(store);
              }}
              onOpenOrders={(storeId) => {
                setSelectedStoreId(storeId);
                setOrdersModalOpen(true);
              }}
              onOpenDelivery={(store) => {
                setSelectedStore(store);
                setDeliveryModalOpen(true);
              }}
              onOpenFollowup={(store) => {
                setSelectedStoreForFollowup(store);
                setFollowupModalOpen(true);
              }}
              onOpenCreateOrder={(store) => {
                setSelectedStoreForOrder(store);
                setCreateOrderModalOpen(true);
              }}
              onAddNote={(store) => {
                setSelectedStoreForNote(store);
                setAddNoteModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {stores.length === 0 && (
        <p className="text-muted-foreground text-center mt-8">
          No stores found.
        </p>
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
      <AssignStoresModal
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        onAssign={handleAssign}
        allReps={allReps}
        repsLoading={repsLoading}
        assigning={assigning}
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

      <CreateOrderModal
        open={createOrderModalOpen}
        onClose={() => setCreateOrderModalOpen(false)}
        store={selectedStoreForOrder}
      />
    </div>
  );
};

export default Stores;
