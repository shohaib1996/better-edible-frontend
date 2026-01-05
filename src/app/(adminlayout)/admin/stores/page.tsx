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
import {
  Loader2,
  Edit,
  Plus,
  PauseCircle,
  PlayCircle,
  FileText,
  ShoppingCart,
  Truck,
  Calendar,
} from "lucide-react";
import {
  EntityModal,
  Field,
} from "@/components/ReUsableComponents/EntityModal";
import { ConfirmDialog } from "@/components/ReUsableComponents/ConfirmDialog";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const [sortOrder, setSortOrder] = useState<string>("asc"); // asc or desc

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
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="text"
            placeholder="Search by store name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] border border-accent rounded-xs"
          />
          <Select
            value={paymentFilter}
            onValueChange={(value) => setPaymentFilter(value)}
          >
            <SelectTrigger className="flex-1 min-w-[180px] border border-accent rounded-xs">
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
            <SelectTrigger className="flex-1 min-w-[150px] border border-accent rounded-xs">
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

          <Select
            value={sortOrder}
            onValueChange={(value) => setSortOrder(value)}
          >
            <SelectTrigger className="flex-1 min-w-[150px] border border-accent rounded-xs">
              <SelectValue placeholder="Sort Order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">
                <span className="flex items-center gap-2">
                  ↑ A → Z (0-9 first)
                </span>
              </SelectItem>
              <SelectItem value="desc">
                <span className="flex items-center gap-2">
                  ↓ Z → A (9-0 first)
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-3 justify-end">
          <Button
            disabled={selected.length === 0 || toggling}
            onClick={handleToggleBlock}
            className="flex items-center gap-2 rounded-xs cursor-pointer whitespace-nowrap"
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
            className="flex items-center gap-2 rounded-xs cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Assign Stores
          </Button>

          <Button
            onClick={() => {
              setEditingStore(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xs cursor-pointer whitespace-nowrap"
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
              ? "text-red-500 dark:text-red-400"
              : store.paymentStatus === "yellow"
              ? "text-yellow-600 dark:text-yellow-500"
              : store.paymentStatus === "green"
              ? "text-green-600 dark:text-green-500"
              : "text-muted-foreground";

          return (
            <Card
              key={store._id}
              className={`p-4 shadow-sm hover:shadow-md transition-all rounded-xs gap-0 ${
                store.blocked ? "opacity-70 border-destructive/30" : ""
              }`}
            >
              {/* TOP: Store Info + Buttons */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-2">
                {/* Store Name & Address */}
                <div className="flex items-start gap-4 flex-1">
                  <Checkbox
                    className="border-accent"
                    checked={selected.includes(store._id)}
                    onCheckedChange={() => handleSelect(store._id)}
                  />
                  <div>
                    <h3
                      className="text-lg text-foreground font-bold relative inline-block after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all after:duration-300 hover:after:w-full cursor-pointer"
                      onClick={() => {
                        setSelectedStoreForNote(store);
                        setAddNoteModalOpen(true);
                      }}
                    >
                      {store.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {store.address || "No address"}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <TooltipProvider>
                  <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="rounded-xs cursor-pointer"
                          onClick={() => {
                            setSelectedStoreId(store._id);
                            setNotesModalOpen(true);
                            setSelectedStoreData(store);
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Notes</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="rounded-xs cursor-pointer"
                          onClick={() => {
                            setSelectedStoreId(store._id);
                            setOrdersModalOpen(true);
                          }}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Orders</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="rounded-xs cursor-pointer"
                          onClick={() => {
                            setSelectedStore(store);
                            setDeliveryModalOpen(true);
                          }}
                        >
                          <Truck className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Delivery</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xs cursor-pointer"
                          onClick={() => {
                            setSelectedStoreForFollowup(store);
                            setFollowupModalOpen(true);
                          }}
                        >
                          <Calendar className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Follow Up</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xs bg-card border-2 border-foreground/20 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary dark:border-foreground/30 transition-all cursor-pointer"
                          onClick={() => {
                            setEditingStore({
                              ...store,
                              rep: store.rep?._id || store.rep || "",
                            });
                            setModalOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Edit</p>
                      </TooltipContent>
                    </Tooltip>

                    <ConfirmDialog
                      triggerText="Delete"
                      onConfirm={() => handleDelete(store._id)}
                      title={`Delete ${store.name}?`}
                      description="This action cannot be undone."
                      confirmText="Yes, delete"
                    />
                  </div>
                </TooltipProvider>
              </div>

              {/* BOTTOM: Contacts & Due Info Container */}
              <div className="flex flex-col md:flex-row gap-4">
                {/* Contacts, Rep, Status */}
                <div className="flex-1 text-sm bg-muted/30 dark:bg-muted/50 p-2 rounded-xs">
                  {/* Contact Info */}
                  {Array.isArray(store?.contacts) &&
                  store.contacts.length > 0 ? (
                    <div className="mb-2">
                      <p className="font-semibold text-foreground mb-1">
                        Contacts:
                      </p>
                      {store.contacts.map((c: any, idx: number) => (
                        <div
                          key={idx}
                          className="pl-2 border-l-2 border-primary mb-1"
                        >
                          <div className="flex flex-wrap gap-2 text-foreground">
                            <span>
                              <strong className="text-primary">
                                {c?.name}
                              </strong>{" "}
                              {c?.role && (
                                <span className="text-muted-foreground">
                                  ({c.role})
                                </span>
                              )}
                            </span>
                            {c?.email && (
                              <span className="text-muted-foreground">
                                | {c.email}
                              </span>
                            )}
                            {c?.phone && (
                              <span className="text-muted-foreground">
                                | {c.phone}
                              </span>
                            )}
                          </div>
                          {c?.importantToKnow && (
                            <div className="text-sm text-green-700 dark:text-green-400">
                              <strong>Important:</strong> {c.importantToKnow}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* Rep Info */}
                  {store.rep && (
                    <div className="mb-2">
                      <strong className="text-foreground">Rep:</strong>{" "}
                      <span className="text-primary font-medium">
                        {store.rep.name || store.rep}
                      </span>
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <strong className="text-foreground">Status:</strong>{" "}
                    {store.blocked ? (
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        Paused
                      </span>
                    ) : (
                      <span className="text-green-600 dark:text-green-400 font-medium">
                        Active
                      </span>
                    )}
                  </div>
                </div>

                {/* Due Amount */}
                {hasDue && (
                  <div className="md:w-1/3">
                    <div className="bg-muted/30 dark:bg-muted/20 p-3 rounded-xs">
                      <div
                        className={`text-sm font-medium ${paymentColor} text-right`}
                      >
                        Due: ${store.dueAmount.toLocaleString()}
                        {store.lastPaidAt && (
                          <span className="block text-muted-foreground text-xs">
                            Last paid:{" "}
                            {new Date(store.lastPaidAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
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

      {/* Assign Stores Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-md rounded-xs">
          <DialogHeader>
            <DialogTitle>Select a Rep to Assign Stores</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-hidden mt-4">
            {repsLoading ? (
              <Loader2 className="animate-spin mx-auto h-6 w-6 text-muted-foreground" />
            ) : (
              allReps.map((rep) => (
                <label
                  key={rep._id}
                  className="flex items-center space-x-3 border rounded-xs p-2 hover:bg-muted cursor-pointer"
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
            <Button
              variant="outline"
              onClick={() => setAssignModalOpen(false)}
              className="rounded-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={assigning || !selectedRep}
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xs cursor-pointer"
            >
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
