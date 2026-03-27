export interface ILabelOrder {
  _id: string;
  orderNumber: string;
  storeId: string;
  storeName: string;
  labelId: string;
  labelName: string;
  itemId: string;
  quantityOrdered: number;
  quantityReceived: number;
  status: "on_order" | "received";
  notes?: string;
  orderedAt: string;
  createdAt: string;
  updatedAt: string;
  labelImageUrl?: string | null;
}

export interface ILastPrintData {
  lotNumber: string;
  thcPercent: string;
  testDate: string;
}

export interface ILabelInventory {
  _id: string;
  storeId: string;
  storeName: string;
  labelId: string;
  labelName: string;
  itemId: string;
  unprocessed: number;
  labeled: number;
  printed: number;
  reorderThreshold: number;
  lastPrintData?: ILastPrintData;
  totalStock?: number;
  belowThreshold?: boolean;
  labelImageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IInventorySummaryByStore {
  storeId: string;
  storeName: string;
  unprocessed: number;
  labeled: number;
  printed: number;
  belowThresholdCount: number;
}

export interface IInventorySummary {
  totalUnprocessed: number;
  totalLabeled: number;
  totalPrinted: number;
  belowThresholdCount: number;
  byStore: IInventorySummaryByStore[];
}

// ─── Request Types ─────────────────────────────────────────────────────────────

export interface ICreateLabelOrderRequest {
  storeId: string;
  labelId: string;
  quantityOrdered: number;
  notes?: string;
}

export interface IReceiveLabelOrderRequest {
  orderId: string;
  quantityReceived: number;
}

export interface IApplyLabelsRequest {
  storeId: string;
  labelId: string;
  quantity: number;
}

export interface IPrintLabelsRequest {
  storeId: string;
  labelId: string;
  quantity: number;
  lotNumber?: string;
  thcPercent?: string;
  testDate?: string;
}

export interface ISetReorderThresholdRequest {
  inventoryId: string;
  reorderThreshold: number;
}
