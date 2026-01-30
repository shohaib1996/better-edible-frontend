import { IStore } from "../store/store";
import { IRep } from "../reps/reps";

export interface IPrivateLabelProduct {
  _id: string;
  name: string;
  unitPrice: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IPrivateLabelOrderItem {
  privateLabelType: string; // Product name
  flavor: string;
  quantity: number;
  unitPrice?: number;
  total?: number;
  lineTotal?: number; // Backend uses this field
  labelImages?: Array<{
    url: string;
    secureUrl: string;
    publicId: string;
    format: string;
    bytes: number;
    originalFilename: string;
  }>; // Label image objects from Cloudinary
}

export type PrivateLabelOrderStatus = "submitted" | "accepted" | "manifested" | "shipped" | "cancelled";

export interface IPrivateLabelOrder {
  _id: string;
  store: IStore;
  rep: IRep;
  items: IPrivateLabelOrderItem[];
  subtotal: number;
  discount: number;
  discountType: "flat" | "percentage";
  discountAmount?: number; // Calculated discount amount in dollars
  total: number;
  note?: string;
  deliveryDate?: string;
  status: PrivateLabelOrderStatus;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────
// API REQUEST/RESPONSE TYPES
// ─────────────────────────────

export interface IGetProductsParams {
  activeOnly?: boolean;
}

export interface IGetProductsResponse {
  total: number;
  products: IPrivateLabelProduct[];
}

export interface ICreateProductRequest {
  name: string;
  unitPrice: number;
  description?: string;
  isActive?: boolean;
}

export interface IUpdateProductRequest {
  id: string;
  name?: string;
  unitPrice?: number;
  description?: string;
  isActive?: boolean;
}

export interface IGetPrivateLabelOrdersParams {
  status?: string;
  repId?: string;
  repName?: string;
  storeId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface IGetPrivateLabelOrdersResponse {
  total: number;
  orders: IPrivateLabelOrder[];
  page: number;
  limit: number;
}

export interface IChangeOrderStatusRequest {
  id: string;
  status: PrivateLabelOrderStatus;
}
