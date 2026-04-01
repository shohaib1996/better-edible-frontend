"use client";

import { useState } from "react";
import { type Field } from "@/components/ReUsableComponents/EntityModal";
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
import { useUser } from "@/redux/hooks/useAuth";

export const useStoresData = (isAdmin: boolean) => {
  // 🔍 Search + Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounced({ searchQuery, delay: 500 });
  const [paymentFilter, setPaymentFilter] = useState<string>("all");

  // Admin-only filter state
  const [selectedRepFilter, setSelectedRepFilter] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  // 📄 Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(isAdmin ? 9 : 10);

  // 📦 Modal / selection state
  const [modalOpen, setModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<any | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [addNoteModalOpen, setAddNoteModalOpen] = useState(false);
  const [selectedStoreForNote, setSelectedStoreForNote] = useState<IStore | null>(null);
  const [followupModalOpen, setFollowupModalOpen] = useState(false);
  const [selectedStoreForFollowup, setSelectedStoreForFollowup] = useState<IStore | null>(null);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedStoreData, setSelectedStoreData] = useState<{
    _id: string;
    name: string;
    address: string;
  } | null>(null);

  // Admin-only modal state
  const [createOrderModalOpen, setCreateOrderModalOpen] = useState(false);
  const [selectedStoreForOrder, setSelectedStoreForOrder] = useState<IStore | null>(null);

  // Rep-only modal state
  const [sampleModalOpen, setSampleModalOpen] = useState(false);
  const [selectedStoreForSample, setSelectedStoreForSample] = useState<IStore | null>(null);

  const user = useUser();
  const currentRep: Partial<IRep> | null = { _id: user?.id, name: user?.name };

  // 📡 API hooks
  const { data, isLoading, refetch } = useGetAllStoresQuery(
    {
      page: currentPage,
      limit,
      search: debouncedSearch || "",
      repId: isAdmin ? selectedRepFilter || "" : user?.id || "",
      paymentStatus:
        paymentFilter !== "all" && paymentFilter !== "due" ? paymentFilter : "",
      isDue: paymentFilter === "due" ? "true" : undefined,
      ...(isAdmin ? { sortOrder } : {}),
    },
    {
      refetchOnMountOrArgChange: true,
      skip: !isAdmin && !user?.id,
    }
  );

  const { data: reps, isLoading: repsLoading } = useGetAllRepsQuery(
    {},
    { refetchOnMountOrArgChange: true, skip: !isAdmin }
  );

  const allReps: IRep[] = reps?.data || [];
  const stores: IStore[] = data?.stores || [];
  const totalStores = data?.total || 0;
  const totalPages = Math.ceil(totalStores / limit);

  const [createStore, { isLoading: creating }] = useCreateStoreMutation();
  const [updateStore, { isLoading: updating }] = useUpdateStoreMutation();
  const [deleteStore] = useDeleteStoreMutation();
  const [assignStoreToRep, { isLoading: assigning }] = useAssignStoreToRepMutation();
  const [toggleBlockStores, { isLoading: toggling }] = useToggleBlockStoresMutation();

  // ── Pagination ──────────────────────────────────────────────────────────────

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelected([]);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setCurrentPage(1);
    setSelected([]);
  };

  // ── Selection ───────────────────────────────────────────────────────────────

  const handleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // ── CRUD ────────────────────────────────────────────────────────────────────

  const handleSubmit = async (values: any) => {
    try {
      const payload = isAdmin
        ? { ...values }
        : {
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

      if (!isAdmin) {
        delete payload.contactName;
        delete payload.contactRole;
        delete payload.contactEmail;
        delete payload.contactPhone;
      }

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

  const handleDelete = async (id: string) => {
    await deleteStore(id);
    toast.success("Store deleted successfully!");
    refetch();
  };

  const handleAssign = async (repId: string) => {
    if (!repId || selected.length === 0)
      return toast.error("Select rep & stores first!");

    try {
      await assignStoreToRep({ storeIds: selected, repId }).unwrap();
      toast.success("Stores successfully assigned!");
      setAssignModalOpen(false);
      setSelected([]);
      refetch();
    } catch (err) {
      console.error("Error assigning stores:", err);
      toast.error("Failed to assign stores.");
    }
  };

  const handleToggleBlock = async () => {
    if (selected.length === 0)
      return toast.error("Select at least one store first.");

    const selectedStores = stores.filter((store: any) => selected.includes(store._id));
    const isCurrentlyBlocked = selectedStores.every((s: any) => s.blocked);
    const newBlockState = !isCurrentlyBlocked;

    try {
      await toggleBlockStores({ storeIds: selected, blocked: newBlockState }).unwrap();
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

  // ── Form fields ─────────────────────────────────────────────────────────────

  const termsOptions = [
    { label: "COD", value: "COD" },
    { label: "15 Days", value: "15 days" },
    { label: "30 Days", value: "30 days" },
  ];

  const groupOptions = Array.from({ length: 10 }, (_, i) => ({
    label: `${i + 1}`,
    value: `${i + 1}`,
  }));

  const baseFields: Field[] = [
    { name: "name", label: "Store Name", type: "text", placeholder: "Enter store name" },
    { name: "address", label: "Address", type: "text", placeholder: "123 Main St" },
    { name: "city", label: "City", type: "text", placeholder: "Enter city" },
    { name: "state", label: "State", type: "text", placeholder: "Enter state" },
    { name: "zip", label: "Zip Code", type: "text", placeholder: "Enter zip code" },
  ];

  const adminFields: Field[] = [
    ...baseFields,
    {
      name: "rep",
      label: "Assigned Rep",
      type: "select",
      options: allReps.map((rep) => ({ label: rep.name, value: rep._id })),
    },
    { name: "terms", label: "Terms", type: "select", options: termsOptions },
    { name: "group", label: "Group", type: "select", options: groupOptions },
  ];

  const repFields: Field[] = [
    ...baseFields,
    { name: "contactName", label: "Contact Name", type: "text", placeholder: "Enter contact name" },
    { name: "contactRole", label: "Contact Role", type: "text", placeholder: "Enter contact role" },
    { name: "contactEmail", label: "Contact Email", type: "text", placeholder: "Enter contact email" },
    { name: "contactPhone", label: "Contact Phone", type: "text", placeholder: "Enter contact phone" },
    { name: "terms", label: "Terms", type: "select", options: termsOptions },
    { name: "group", label: "Group", type: "select", options: groupOptions },
  ];

  const fields = isAdmin ? adminFields : repFields;

  return {
    // data
    user,
    currentRep,
    stores,
    allReps,
    totalStores,
    totalPages,
    isLoading,
    fields,
    // filter state
    searchQuery, setSearchQuery,
    paymentFilter, setPaymentFilter,
    selectedRepFilter, setSelectedRepFilter,
    sortOrder, setSortOrder,
    viewMode, setViewMode,
    // pagination
    currentPage,
    limit,
    handlePageChange,
    handleLimitChange,
    // selection
    selected,
    handleSelect,
    // mutation loading
    creating, updating, assigning, toggling, repsLoading,
    // handlers
    handleSubmit,
    handleDelete,
    handleAssign,
    handleToggleBlock,
    // modal state — add/edit
    modalOpen, setModalOpen,
    editingStore, setEditingStore,
    // modal state — assign
    assignModalOpen, setAssignModalOpen,
    // modal state — notes
    notesModalOpen, setNotesModalOpen,
    selectedStoreId, setSelectedStoreId,
    selectedStoreData, setSelectedStoreData,
    // modal state — orders
    ordersModalOpen, setOrdersModalOpen,
    // modal state — delivery
    deliveryModalOpen, setDeliveryModalOpen,
    selectedStore, setSelectedStore,
    // modal state — add note
    addNoteModalOpen, setAddNoteModalOpen,
    selectedStoreForNote, setSelectedStoreForNote,
    // modal state — followup
    followupModalOpen, setFollowupModalOpen,
    selectedStoreForFollowup, setSelectedStoreForFollowup,
    // modal state — create order (admin)
    createOrderModalOpen, setCreateOrderModalOpen,
    selectedStoreForOrder, setSelectedStoreForOrder,
    // modal state — sample (rep)
    sampleModalOpen, setSampleModalOpen,
    selectedStoreForSample, setSelectedStoreForSample,
  };
};
