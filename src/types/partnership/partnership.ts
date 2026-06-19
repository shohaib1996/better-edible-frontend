export interface IPartnershipEnrollment {
  _id: string;
  storeId: string;
  storeName?: string;
  status: "pending_approval" | "active" | "pending_setup" | "rejected";
  posApiKey?: string;
  posApiConnected: boolean;
  approvedAt?: string;
  approvedBy?: string;
  requestedAt: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPartnershipInventory {
  _id: string;
  storeId: string;
  productId: string;
  sku: string;
  productName: string;
  wholesalePrice: number;
  unitsPlaced: number;
  unitsSold: number;
  unitsRemaining: number;
  lastReconciliationAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPartnershipSale {
  _id: string;
  storeId: string;
  productId: string;
  sku: string;
  date: string;
  unitsSold: number;
  source: "pos_api";
  receivedAt: string;
  createdAt: string;
}

export interface IPartnershipReplenishmentItem {
  productId: string;
  productName: string;
  sku: string;
  unitsRequested: number;
  unitsDelivered?: number;
}

export interface IPartnershipDriverCount {
  productId: string;
  sku: string;
  actualCount: number;
}

export interface IPartnershipReplenishment {
  _id: string;
  storeId: string;
  status: "pending" | "in_transit" | "delivered" | "reconciled";
  items: IPartnershipReplenishmentItem[];
  driverCounts: IPartnershipDriverCount[];
  driverNotes?: string;
  requestedAt: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPartnershipBillLineItem {
  productId: string;
  productName: string;
  sku: string;
  unitsSold: number;
  wholesalePrice: number;
  lineTotal: number;
}

export interface IPartnershipBillCredit {
  amount: number;
  reason: string;
  appliedAt: string;
}

export interface IPartnershipBill {
  _id: string;
  storeId: string;
  billingYear: number;
  billingMonth: number;
  lineItems: IPartnershipBillLineItem[];
  subtotal: number;
  credits: IPartnershipBillCredit[];
  creditsTotal: number;
  total: number;
  status: "draft" | "sent" | "paid";
  generatedAt: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}
