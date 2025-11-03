export interface IOrder {
  _id: string;
  store: {
    _id: string;
    name: string;
    address: string;
    city: string | null;
    blocked: boolean;
  } | null;
  rep: {
    _id: string;
    name: string;
    repType: "rep" | "admin" | "manager" | string; // extend if needed
  } | null;
  items: {
    product: string;
    name: string;
    unitPrice: number;
    discountPrice?: number;
    qty: number;
    lineTotal: number;
  }[];
  subtotal: number;
  discount?: number;
  total: number;
  status:
    | "draft"
    | "submitted"
    | "accepted"
    | "manifested"
    | "shipped"
    | "cancelled"
    | string;
  note?: string;
  deliveryDate?: string; // ISO date string
  createdAt: string; // ISO date string
  orderNumber: number;
}
