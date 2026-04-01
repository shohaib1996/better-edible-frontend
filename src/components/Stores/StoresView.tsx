"use client";

import { Loader2, Plus, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlobalPagination } from "@/components/ReUsableComponents/GlobalPagination";
import { StoreCard } from "@/components/Stores/StoreCard";
import { StoreListItem } from "@/components/Stores/StoreListItem";
import { StoreFilters } from "@/components/Stores/StoreFilters";
import { StoreActions } from "@/components/Stores/StoreActions";
import { RepStoreCard } from "@/components/Stores/RepStoreCard";
import { RepStoreFilters } from "@/components/Stores/RepStoreFilters";
import { StoresModals } from "@/components/Stores/StoresModals";
import { useStoresData } from "@/components/Stores/useStoresData";

interface StoresViewProps {
  isAdmin: boolean;
}

export const StoresView = ({ isAdmin }: StoresViewProps) => {
  const s = useStoresData(isAdmin);

  if (s.isLoading)
    return (
      <div
        className={`flex justify-center items-center ${
          isAdmin ? "h-64" : "min-h-screen bg-background"
        }`}
      >
        <Loader2
          className={`animate-spin ${
            isAdmin ? "h-8 w-8 text-muted-foreground" : "w-8 h-8 text-primary"
          }`}
        />
      </div>
    );

  // ── Shared card event handlers ─────────────────────────────────────────────

  const openNotes = (store: any) => {
    s.setSelectedStoreId(store._id);
    s.setNotesModalOpen(true);
    s.setSelectedStoreData(store);
  };

  const openOrders = (storeId: string) => {
    s.setSelectedStoreId(storeId);
    s.setOrdersModalOpen(true);
  };

  const openDelivery = (store: any) => {
    s.setSelectedStore(store);
    s.setDeliveryModalOpen(true);
  };

  const openFollowup = (store: any) => {
    s.setSelectedStoreForFollowup(store);
    s.setFollowupModalOpen(true);
  };

  const openAddNote = (store: any) => {
    s.setSelectedStoreForNote(store);
    s.setAddNoteModalOpen(true);
  };

  const openEditAdmin = (store: any) => {
    s.setEditingStore({ ...store, rep: store.rep?._id || store.rep || "" });
    s.setModalOpen(true);
  };

  const openEditRep = (store: any) => {
    const contact = store.contacts?.[0] || {};
    s.setEditingStore({
      ...store,
      contactName: contact.name || "",
      contactRole: contact.role || "",
      contactEmail: contact.email || "",
      contactPhone: contact.phone || "",
      rep: store.rep?._id || store.rep || "",
    });
    s.setModalOpen(true);
  };

  return (
    <div
      className={`p-4 sm:p-6 space-y-6 ${
        isAdmin ? "" : "bg-background min-h-screen"
      }`}
    >
      {/* Header */}
      <div className="space-y-4 mb-6">
        <div className={isAdmin ? undefined : "flex items-center gap-3"}>
          {!isAdmin && <Store className="w-8 h-8 text-primary" />}
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-foreground">Stores</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Total Stores: <span className="font-medium">{s.totalStores}</span>
            </p>
          </div>
        </div>

        {/* Filters */}
        {isAdmin ? (
          <>
            <StoreFilters
              searchQuery={s.searchQuery}
              onSearchChange={s.setSearchQuery}
              paymentFilter={s.paymentFilter}
              onPaymentFilterChange={s.setPaymentFilter}
              selectedRepFilter={s.selectedRepFilter}
              onRepFilterChange={s.setSelectedRepFilter}
              sortOrder={s.sortOrder}
              onSortOrderChange={s.setSortOrder}
              allReps={s.allReps}
            />
            <StoreActions
              selected={s.selected}
              stores={s.stores}
              toggling={s.toggling}
              onToggleBlock={s.handleToggleBlock}
              onAssignStores={() => s.setAssignModalOpen(true)}
              onAddStore={() => {
                s.setEditingStore(null);
                s.setModalOpen(true);
              }}
              viewMode={s.viewMode}
              onViewModeChange={s.setViewMode}
            />
          </>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex-1 w-full">
              <RepStoreFilters
                searchQuery={s.searchQuery}
                onSearchChange={s.setSearchQuery}
                paymentFilter={s.paymentFilter}
                onPaymentFilterChange={s.setPaymentFilter}
              />
            </div>
            <Button
              onClick={() => {
                s.setEditingStore(null);
                s.setModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xs cursor-pointer whitespace-nowrap w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Add Store
            </Button>
          </div>
        )}
      </div>

      {/* Store Cards */}
      {isAdmin ? (
        s.viewMode === "list" ? (
          <div className="grid gap-4">
            {s.stores.map((store: any) => (
              <StoreCard
                key={store._id}
                store={store}
                selected={s.selected.includes(store._id)}
                onSelect={s.handleSelect}
                onEdit={openEditAdmin}
                onDelete={s.handleDelete}
                onOpenNotes={openNotes}
                onOpenOrders={openOrders}
                onOpenDelivery={openDelivery}
                onOpenFollowup={openFollowup}
                onOpenCreateOrder={(store) => {
                  s.setSelectedStoreForOrder(store);
                  s.setCreateOrderModalOpen(true);
                }}
                onAddNote={openAddNote}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {s.stores.map((store: any) => (
              <StoreListItem
                key={store._id}
                store={store}
                selected={s.selected.includes(store._id)}
                onSelect={s.handleSelect}
                onEdit={openEditAdmin}
                onDelete={s.handleDelete}
                onOpenNotes={openNotes}
                onOpenOrders={openOrders}
                onOpenDelivery={openDelivery}
                onOpenFollowup={openFollowup}
                onOpenCreateOrder={(store) => {
                  s.setSelectedStoreForOrder(store);
                  s.setCreateOrderModalOpen(true);
                }}
                onAddNote={openAddNote}
              />
            ))}
          </div>
        )
      ) : (
        <div className="grid gap-4">
          {s.stores.map((store: any) => (
            <RepStoreCard
              key={store._id}
              store={store}
              onEdit={openEditRep}
              onOpenNotes={openNotes}
              onOpenOrders={openOrders}
              onOpenDelivery={openDelivery}
              onOpenFollowup={openFollowup}
              onOpenSample={(store) => {
                s.setSelectedStoreForSample(store);
                s.setSampleModalOpen(true);
              }}
              onAddNote={openAddNote}
            />
          ))}
        </div>
      )}

      {s.stores.length === 0 && (
        <p className="text-muted-foreground text-center mt-8">No stores found.</p>
      )}

      {/* Pagination */}
      {s.totalStores > 0 && (
        <GlobalPagination
          currentPage={s.currentPage}
          totalPages={s.totalPages}
          totalItems={s.totalStores}
          itemsPerPage={s.limit}
          onPageChange={s.handlePageChange}
          onLimitChange={s.handleLimitChange}
        />
      )}

      {/* Modals */}
      <StoresModals
        isAdmin={isAdmin}
        fields={s.fields}
        user={s.user}
        currentRep={s.currentRep}
        allReps={s.allReps}
        repsLoading={s.repsLoading}
        modalOpen={s.modalOpen}
        onCloseModal={() => s.setModalOpen(false)}
        editingStore={s.editingStore}
        onSubmit={s.handleSubmit}
        creating={s.creating}
        updating={s.updating}
        assignModalOpen={s.assignModalOpen}
        onCloseAssignModal={() => s.setAssignModalOpen(false)}
        assigning={s.assigning}
        selected={s.selected}
        onAssign={s.handleAssign}
        notesModalOpen={s.notesModalOpen}
        onCloseNotesModal={() => s.setNotesModalOpen(false)}
        selectedStoreData={s.selectedStoreData}
        ordersModalOpen={s.ordersModalOpen}
        onCloseOrdersModal={() => s.setOrdersModalOpen(false)}
        selectedStoreId={s.selectedStoreId}
        deliveryModalOpen={s.deliveryModalOpen}
        onCloseDeliveryModal={() => s.setDeliveryModalOpen(false)}
        selectedStore={s.selectedStore}
        addNoteModalOpen={s.addNoteModalOpen}
        onCloseAddNoteModal={() => s.setAddNoteModalOpen(false)}
        selectedStoreForNote={s.selectedStoreForNote}
        followupModalOpen={s.followupModalOpen}
        onCloseFollowupModal={() => s.setFollowupModalOpen(false)}
        selectedStoreForFollowup={s.selectedStoreForFollowup}
        createOrderModalOpen={s.createOrderModalOpen}
        onCloseCreateOrderModal={() => s.setCreateOrderModalOpen(false)}
        selectedStoreForOrder={s.selectedStoreForOrder}
        sampleModalOpen={s.sampleModalOpen}
        onCloseSampleModal={() => s.setSampleModalOpen(false)}
        selectedStoreForSample={s.selectedStoreForSample}
      />
    </div>
  );
};
