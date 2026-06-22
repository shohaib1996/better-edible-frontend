export interface IPromotionEnrollment {
  _id: string;
  storeId: string | { _id: string; name?: string; city?: string; state?: string };
  status: "pending_approval" | "active" | "rejected";
  creditBalance: number;
  requestedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  notes?: string;
  posKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPromotion {
  _id: string;
  name: string;
  description: string;
  productId: string;
  productName: string;
  sku: string;
  creditRatePerUnit: number;
  startDate: string;
  endDate: string;
  status: "draft" | "active" | "expired";
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface IStorePromotion {
  _id: string;
  storeId: string;
  promotionId?: string;
  type: "company" | "custom";
  // Custom-only fields
  name?: string;
  productId?: string;
  productName?: string;
  creditRatePerUnit?: number;
  startDate?: string;
  endDate?: string;
  // Shared fields
  status: "active" | "pending_sales_log" | "sales_logged" | "completed" | "cancelled";
  unitsSold: number;
  creditsEarned: number;
  salesLogEmailSentAt?: string;
  salesLoggedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPromotionSale {
  _id: string;
  storeId: string;
  storePromotionId: string;
  promotionId?: string;
  productId: string;
  date: string;
  unitsSold: number;
  source: "manual" | "pos_api";
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPromotionCredit {
  _id: string;
  storeId: string;
  storePromotionId: string;
  amount: number;
  description: string;
  type: "earned" | "applied";
  appliedToOrderId?: string;
  appliedToPartnershipBillId?: string;
  status: "available" | "applied";
  appliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPromotionPaginationMeta {
  totalCount: number;
  totalPages: number;
  currentPage: number;
}
