export interface ISample {
  _id: string;
  store: {
    name: string;
  };
  rep: {
    name: string;
  };
  status: "submitted" | "accepted" | "manifested" | "shipped" | "delivered" | "cancelled";
  samples: {
    cannacrispy?: string;
    "bliss cannabis syrup"?: string;
    "fifty one fifty"?: string;
  };
  notes?: string;
  deliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}
