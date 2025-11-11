"use client";

import {
  EntityModal,
  Field,
} from "@/src/components/ReUsableComponents/EntityModal";
import { OrderForm } from "@/src/components/Orders/OrderForm";

interface OrderModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  title: string;
  fields: Field[];
  initialData: any;
  isSubmitting: boolean;
  initialItems: any[];
  initialDiscountType: "flat" | "percent";
  initialDiscountValue: number;
  initialNote: string;
  onOrderFormChange: (items: any[], totals: any) => void;
}

export const OrderModal = ({
  open,
  onClose,
  onSubmit,
  title,
  fields,
  initialData,
  isSubmitting,
  initialItems,
  initialDiscountType,
  initialDiscountValue,
  initialNote,
  onOrderFormChange,
}: OrderModalProps) => {
  return (
    <EntityModal
      key={initialData?._id || "new"}
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      title={title}
      fields={fields}
      initialData={initialData}
      isSubmitting={isSubmitting}
    >
      <OrderForm
        initialItems={initialItems}
        initialDiscountType={initialDiscountType}
        initialDiscountValue={initialDiscountValue}
        initialNote={initialNote}
        onChange={onOrderFormChange}
      />
    </EntityModal>
  );
};
