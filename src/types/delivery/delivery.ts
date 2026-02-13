// src/types/delivery.ts
export interface Delivery {
  _id: string;
  storeId: {
    _id: string;
    name: string;
    address: string;
    city?: string | null;
    state?: string | null;
  };
  assignedTo: {
    _id: string;
    name: string;
    // make repType optional so it matches all shapes
    repType?: string;
  };
  disposition: "money_pickup" | "delivery" | "sample_drop" | "other";
  paymentAction: "collect_payment" | "no_payment" | "may_not_collect";
  amount: number;
  scheduledAt: string;
  notes?: string;
  status: "pending" | "assigned" | "completed" | "cancelled" | "in_transit";
  createdAt?: string;
  updatedAt?: string;
  orderId?: string;
  sampleId?: string;
  clientOrderId?: string;
}
