// Order.ts

export type ObjectIdString = string;

export type OrderStatus =
  | "submitted"
  | "accepted"
  | "shipped"
  | "manifested"
  | "cancelled"

export interface Store {
  _id: ObjectIdString;
  name: string;
  address: string;
  city: string | null;
  blocked: boolean;
}

export interface Rep {
  // Keep optional so an empty object {} is valid
  _id?: ObjectIdString;
  name?: string;
  email?: string;
  phone?: string;
}

export interface OrderItem {
  product: ObjectIdString;   // product id
  name: string;              // product display name
  unitLabel: string;         // e.g. "300Mg"
  unitPrice: number;         // price per unit before discount
  discountPrice: number;     // per-unit discount (0 if none)
  qty: number;
  lineTotal: number;         // computed (unitPrice - discountPrice) * qty
}

export interface IOrder {
  _id: ObjectIdString;
  store: Store;
  rep?: Rep | null;          // can be {} or null if not assigned
  items: OrderItem[];

  subtotal: number;          // sum of lineTotal
  discount?: number;         // order-level discount (optional if not used)
  total: number;             // subtotal - discount (if any)

  status: OrderStatus;

  deliveryDate?: string | Date; // ISO string or Date
  shippedDate?: string | Date; // ISO string or Date when marked as shipped
  createdAt: string | Date;

  orderNumber: number;
  note: string;     // human-readable sequence
  createdBy?: {
    user: { _id: string; name: string };
    userType: "admin" | "rep";
  } | null;
}
