export interface IPrivateLabelProduct {
  _id: string;
  name: string;
  unitPrice: number;
  description?: string;
  isActive: boolean;
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
