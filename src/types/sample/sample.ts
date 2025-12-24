export interface ISample {
  _id: string;
  store: {
    name: string;
  };
  rep: {
    name: string;
  };
  status: "submitted" | "accepted" | "manifested" | "shipped" | "delivered" | "cancelled";
  description?: string;
  notes?: string;
  deliveryDate?: string;
  shippedDate?: string;
  createdAt: string;
  updatedAt: string;
}
