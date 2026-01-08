"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Store } from "lucide-react";
import {
  EntityModal,
  type Field,
} from "@/components/ReUsableComponents/EntityModal";
import {
  useCreateStoreMutation,
  useGetAllStoresQuery,
  useUpdateStoreMutation,
} from "@/redux/api/Stores/stores";
import { useDebounced } from "@/redux/hooks/hooks";
import { IRep, IStore } from "@/types";
import { toast } from "sonner";
import { NotesModal } from "@/components/Notes/NotesModal";
import { OrdersModal } from "@/components/Orders/OrdersModal";
import { DeliveryModal } from "@/components/Delivery/DeliveryModal";
import { useUser } from "@/redux/hooks/useAuth";
import { AddNoteModal } from "@/components/Notes/AddNoteModal";
import { ManageFollowUpModal } from "@/components/Followup/ManageFollowUpModal";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { SampleModal } from "@/components/Sample/SampleModal";
import { RepStoreCard } from "@/components/Stores/RepStoreCard";
import { RepStoreFilters } from "@/components/Stores/RepStoreFilters";

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
  const [selectedStoreForNote, setSelectedStoreForNote] =
    useState<IStore | null>(null);
  const [followupModalOpen, setFollowupModalOpen] = useState(false);
  const [selectedStoreForFollowup, setSelectedStoreForFollowup] =
    useState<IStore | null>(null);
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const [selectedStoreForSample, setSelectedStoreForSample] =
    useState<IStore | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);

  const user = useUser();
  const currentRep: Partial<IRep> | null = {
    _id: user?.id,
    name: user?.name,
  };

  // 📡 API hooks
  const { data, isLoading, refetch } = useGetAllStoresQuery(
    {
      page: currentPage,
      limit: limit,
      search: debouncedSearch || "",
      repId: user?.id || "",
      paymentStatus:
        paymentFilter !== "all" && paymentFilter !== "due" ? paymentFilter : "",
      isDue: paymentFilter === "due" ? "true" : undefined,
    },
    { refetchOnMountOrArgChange: true, skip: !user?.id }
  );

  const totalStores = data?.total || 0;
  const totalPages = Math.ceil(totalStores / limit);

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
      <div className="flex justify-center items-center min-h-screen bg-background">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
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

  return (
    <div className="p-4 sm:p-6 bg-background min-h-screen space-y-6">
      {/* Header */}
      <div className="space-y-4 mb-6">
        {/* Title Section */}
        <div className="flex items-center gap-3">
          <Store className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-foreground">
              Stores
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Total Stores: <span className="font-medium">{totalStores}</span>
            </p>
          </div>
        </div>

        {/* Filters + Add Button */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex-1 w-full">
            <RepStoreFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              paymentFilter={paymentFilter}
              onPaymentFilterChange={setPaymentFilter}
            />
          </div>
          <Button
            onClick={() => {
              setEditingStore(null);
              setModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xs cursor-pointer whitespace-nowrap w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Add Store
          </Button>
        </div>
      </div>

      {/* Store Cards */}
      <div className="grid gap-4">
        {stores.map((store: any) => (
          <RepStoreCard
            key={store._id}
            store={store}
            onEdit={(store) => {
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
            onOpenSample={(store) => {
              setSelectedStoreForSample(store);
              setSampleModalOpen(true);
            }}
            onAddNote={(store) => {
              setSelectedStoreForNote(store);
              setAddNoteModalOpen(true);
            }}
          />
        ))}
      </div>

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

      {selectedStoreForFollowup && user && (
        <ManageFollowUpModal
          open={followupModalOpen}
          onClose={() => setFollowupModalOpen(false)}
          storeId={selectedStoreForFollowup._id}
          repId={user.id}
        />
      )}

      {selectedStoreForSample && user && (
        <SampleModal
          open={sampleModalOpen}
          onClose={() => setSampleModalOpen(false)}
          storeId={selectedStoreForSample._id}
          storeName={selectedStoreForSample.name}
          storeAddress={selectedStoreForSample.address || ""}
          repId={user.id}
          repName={user.name || ""}
        />
      )}
    </div>
  );
};

export default Stores;
