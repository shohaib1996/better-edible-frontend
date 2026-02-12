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
  createdBy?: {
    user: { _id: string; name: string };
    userType: "admin" | "rep";
  } | null;
  createdAt: string;
  updatedAt: string;
}
