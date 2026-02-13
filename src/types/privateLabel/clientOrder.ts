import { IStore } from "../store/store";
import { IRep } from "../reps/reps";
import { ILabelImage } from "./label";

// ─────────────────────────────
// CLIENT ORDER STATUS
// ─────────────────────────────

export type ClientOrderStatus =
  | "waiting"
  | "stage_1"
  | "stage_2"
  | "stage_3"
  | "stage_4"
  | "ready_to_ship"
  | "shipped"
  | "cancelled";

// ─────────────────────────────
// ORDER ITEM
// ─────────────────────────────

export interface IClientOrderItem {
  label: {
    _id: string;
    flavorName?: string;
    productType?: string;
    labelImages?: Pick<ILabelImage, "url" | "secureUrl" | "publicId">[];
  };
  flavorName: string;
  productType: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

// ─────────────────────────────
// CLIENT ORDER
// ─────────────────────────────

export type DiscountType = "flat" | "percentage";

export interface IClientOrder {
  _id: string;
  orderNumber: string;
  client: {
    _id: string;
    store?: Pick<IStore, "_id" | "name" | "address" | "city" | "state">;
  };
  assignedRep: Pick<IRep, "_id" | "name" | "email">;
  status: ClientOrderStatus;
  deliveryDate: string;
  productionStartDate: string;
  actualShipDate?: string;
  items: IClientOrderItem[];
  subtotal: number;
  discount: number;
  discountType: DiscountType;
  discountAmount: number;
  total: number;
  note?: string;
  isRecurring: boolean;
  parentOrder?: string;
  shipASAP: boolean;
  trackingNumber?: string;
  emailsSent: {
    sevenDayReminder: boolean;
    readyToShipNotification: boolean;
    shippedNotification: boolean;
  };
  createdBy?: {
    user: { _id: string; name: string };
    userType: "admin" | "rep";
  } | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────
// API REQUEST/RESPONSE TYPES
// ─────────────────────────────

export interface IGetOrdersResponse {
  total: number;
  orders: IClientOrder[];
  page: number;
  limit: number;
}

export interface IGetOrdersParams {
  clientId?: string;
  status?: string;
  repId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ICreateOrderRequest {
  clientId: string;
  deliveryDate: string;
  items: { labelId: string; quantity: number }[];
  discount?: number;
  discountType?: DiscountType;
  note?: string;
  shipASAP?: boolean;
  userId?: string;
  userType?: "admin" | "rep";
}

export interface IUpdateOrderRequest {
  id: string;
  deliveryDate?: string;
  items?: { labelId: string; quantity: number }[];
  discount?: number;
  discountType?: DiscountType;
  note?: string;
  shipASAP?: boolean;
}
