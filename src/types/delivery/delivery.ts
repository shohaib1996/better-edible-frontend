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
  disposition: string;
  paymentAction: string;
  amount: number;
  scheduledAt: string;
  notes?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}
