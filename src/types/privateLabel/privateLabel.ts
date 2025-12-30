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

export interface IPrivateLabelOrder {
  _id: string;
  store: IStore;
  rep: IRep;
  items: IPrivateLabelOrderItem[];
  subtotal: number;
  discount: number;
  discountType: "flat" | "percentage";
  total: number;
  note?: string;
  deliveryDate?: string;
  status: "submitted" | "accepted" | "manifested" | "shipped" | "cancelled";
  createdAt: string;
  updatedAt: string;
}
