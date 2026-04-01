"use client";

import { type Field, EntityModal } from "@/components/ReUsableComponents/EntityModal";
import { NotesModal } from "@/components/Notes/NotesModal";
import { OrdersModal } from "@/components/Orders/OrdersModal";
import { DeliveryModal } from "@/components/Delivery/DeliveryModal";
import { AddNoteModal } from "@/components/Notes/AddNoteModal";
import { ManageFollowUpModal } from "@/components/Followup/ManageFollowUpModal";
import { AssignStoresModal } from "@/components/Stores/AssignStoresModal";
import { CreateOrderModal } from "@/components/Orders/CreateOrderModal";
import { SampleModal } from "@/components/Sample/SampleModal";
import { IRep, IStore } from "@/types";

interface StoresModalsProps {
  isAdmin: boolean;
  fields: Field[];
  // user
  user: { id: string; name?: string } | null | undefined;
  currentRep: Partial<IRep> | null;
  allReps: IRep[];
  repsLoading: boolean;
  // add/edit modal
  modalOpen: boolean;
  onCloseModal: () => void;
  editingStore: any | null;
  onSubmit: (values: any) => Promise<void>;
  creating: boolean;
  updating: boolean;
  // assign modal (admin)
  assignModalOpen: boolean;
  onCloseAssignModal: () => void;
  assigning: boolean;
  selected: string[];
  onAssign: (repId: string) => Promise<void | string | number>;
  // notes modal
  notesModalOpen: boolean;
  onCloseNotesModal: () => void;
  selectedStoreData: { _id: string; name: string; address: string } | null;
  // orders modal
  ordersModalOpen: boolean;
  onCloseOrdersModal: () => void;
  selectedStoreId: string | null;
  // delivery modal
  deliveryModalOpen: boolean;
  onCloseDeliveryModal: () => void;
  selectedStore: any | null;
  // add note modal
  addNoteModalOpen: boolean;
  onCloseAddNoteModal: () => void;
  selectedStoreForNote: IStore | null;
  // followup modal
  followupModalOpen: boolean;
  onCloseFollowupModal: () => void;
  selectedStoreForFollowup: IStore | null;
  // create order modal (admin)
  createOrderModalOpen: boolean;
  onCloseCreateOrderModal: () => void;
  selectedStoreForOrder: IStore | null;
  // sample modal (rep)
  sampleModalOpen: boolean;
  onCloseSampleModal: () => void;
  selectedStoreForSample: IStore | null;
}

export const StoresModals = ({
  isAdmin,
  fields,
  user,
  currentRep,
  allReps,
  repsLoading,
  modalOpen,
  onCloseModal,
  editingStore,
  onSubmit,
  creating,
  updating,
  assignModalOpen,
  onCloseAssignModal,
  assigning,
  selected,
  onAssign,
  notesModalOpen,
  onCloseNotesModal,
  selectedStoreData,
  ordersModalOpen,
  onCloseOrdersModal,
  selectedStoreId,
  deliveryModalOpen,
  onCloseDeliveryModal,
  selectedStore,
  addNoteModalOpen,
  onCloseAddNoteModal,
  selectedStoreForNote,
  followupModalOpen,
  onCloseFollowupModal,
  selectedStoreForFollowup,
  createOrderModalOpen,
  onCloseCreateOrderModal,
  selectedStoreForOrder,
  sampleModalOpen,
  onCloseSampleModal,
  selectedStoreForSample,
}: StoresModalsProps) => {
  return (
    <>
      {/* Add/Edit Store */}
      <EntityModal
        open={modalOpen}
        onClose={onCloseModal}
        onSubmit={onSubmit}
        title={editingStore ? "Edit Store" : "Add Store"}
        fields={fields}
        initialData={editingStore || {}}
        isSubmitting={creating || updating}
      />

      {/* Admin-only modals */}
      {isAdmin && (
        <>
          <AssignStoresModal
            open={assignModalOpen}
            onClose={onCloseAssignModal}
            onAssign={onAssign}
            allReps={allReps}
            repsLoading={repsLoading}
            assigning={assigning}
          />
          <CreateOrderModal
            open={createOrderModalOpen}
            onClose={onCloseCreateOrderModal}
            store={selectedStoreForOrder}
          />
          {selectedStoreForFollowup && (
            <ManageFollowUpModal
              open={followupModalOpen}
              onClose={onCloseFollowupModal}
              storeId={selectedStoreForFollowup._id}
              showRepSelect={true}
            />
          )}
        </>
      )}

      {/* Rep-only modals */}
      {!isAdmin && (
        <>
          {selectedStoreForSample && user && (
            <SampleModal
              open={sampleModalOpen}
              onClose={onCloseSampleModal}
              storeId={selectedStoreForSample._id}
              storeName={selectedStoreForSample.name}
              storeAddress={selectedStoreForSample.address || ""}
              repId={user.id}
              repName={user.name || ""}
            />
          )}
          {selectedStoreForFollowup && user && (
            <ManageFollowUpModal
              open={followupModalOpen}
              onClose={onCloseFollowupModal}
              storeId={selectedStoreForFollowup._id}
              repId={user.id}
            />
          )}
        </>
      )}

      {/* Shared modals */}
      <NotesModal
        open={notesModalOpen}
        onClose={onCloseNotesModal}
        entityId={selectedStoreData ?? undefined}
      />

      <OrdersModal
        open={ordersModalOpen}
        onClose={onCloseOrdersModal}
        storeId={selectedStoreId}
      />

      <DeliveryModal
        open={deliveryModalOpen}
        onClose={onCloseDeliveryModal}
        store={selectedStore}
        {...(!isAdmin ? { rep: currentRep } : {})}
      />

      {selectedStoreForNote && user && (
        <AddNoteModal
          open={addNoteModalOpen}
          onClose={onCloseAddNoteModal}
          storeId={selectedStoreForNote._id}
          repId={user.id}
        />
      )}
    </>
  );
};
