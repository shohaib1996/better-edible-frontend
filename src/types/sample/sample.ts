export interface ISample {
  _id: string;
  store: {
    name: string;
  };
  rep: {
    name: string;
  };
  status: "in progress" | "delivered";
  samples: {
    cannacrispy?: string;
    "bliss cannabis syrup"?: string;
    "fifty one fifty"?: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
