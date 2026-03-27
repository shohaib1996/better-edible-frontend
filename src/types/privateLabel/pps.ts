import type { IFormulationComponent } from "./label";
export type { IFormulationComponent };

// ──────────────────────────────
// History Entry
// ──────────────────────────────
export interface IHistoryEntry {
  action: string;
  performedBy: { userId: string; userName: string; repType: string };
  detail?: string;
  timestamp: string;
}

// ──────────────────────────────
// Cook Item Status
// ──────────────────────────────
export type CookItemStatus =
  | "pending"
  | "in-progress"
  | "cooking_molding_complete"
  | "dehydrating_complete"
  | "demolding_complete"
  | "packaging_casing_complete";

// ──────────────────────────────
// Sub-types
// ──────────────────────────────
export interface IMoldingTimestamp {
  moldId: string;
  unitsPerMold: number;
  startTimestamp: string;
  completionTimestamp?: string;
}

export interface IDehydratorAssignment {
  moldId: string;
  trayId: string;
  dehydratorUnitId: string;
  shelfPosition: number;
  loadTimestamp: string;
  expectedEndTime: string;
}

export interface ITrayRemoval {
  trayId: string;
  removalTimestamp: string;
}

// ──────────────────────────────
// Cook Item
// ──────────────────────────────
export interface ICookItem {
  _id: string;
  cookItemId: string;
  customerId: string;
  orderId: string;
  itemId: string; // label._id (approved label's MongoDB _id)
  labelId: string; // same as itemId, explicit ref to Label
  privateLabOrderId: string;
  storeName: string;
  flavor: string;
  quantity: number;
  flavorComponents: IFormulationComponent[];
  colorComponents: IFormulationComponent[];
  productType: string;
  specialFormulation: boolean;
  status: CookItemStatus;
  assignedMoldIds: string[];
  cookingMoldingStartTimestamp?: string;
  cookingMoldingCompletionTimestamp?: string;
  moldingTimestamps: IMoldingTimestamp[];
  dehydratorTrayIds: string[];
  dehydratorAssignments: IDehydratorAssignment[];
  dehydratingCompletionTimestamp?: string;
  trayRemovalTimestamps: ITrayRemoval[];
  containerPackedTimestamp?: string;
  labelPrintTimestamp?: string;
  demoldingCompletionTimestamp?: string;
  packagingStartTimestamp?: string;
  expectedCount: number;
  actualCount?: number;
  countVariance?: number;
  fullCases?: number;
  partialCaseCount?: number;
  totalCases?: number;
  caseIds: string[];
  packagingCompletionTimestamp?: string;
  history: IHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────
// Stage 3 enriched (with timer)
// ──────────────────────────────
export interface IStage3MoldInfo {
  moldId: string;
  trayId: string;
  dehydratorUnitId: string;
  shelfPosition: number;
  dehydrationEndTime: string;
  isReady: boolean;
  timeRemaining: string;
}

export interface IStage3CookItem extends ICookItem {
  molds: IStage3MoldInfo[];
  allMoldsReady: boolean;
}

// ──────────────────────────────
// Resources
// ──────────────────────────────
export interface IMold {
  _id: string;
  moldId: string;
  barcodeValue: string;
  unitsPerMold: number;
  status: "available" | "in-use";
  currentCookItemId: string | null;
  lastUsedAt?: string;
}

export interface IDehydratorTray {
  _id: string;
  trayId: string;
  qrCodeValue: string;
  status: "available" | "in-use";
  currentCookItemId: string | null;
  currentDehydratorUnitId: string | null;
  currentShelfPosition: number | null;
  lastUsedAt?: string;
}

export interface IShelf {
  occupied: boolean;
  trayId: string | null;
  cookItemId: string | null;
}

export interface IDehydratorUnit {
  _id: string;
  unitId: string;
  totalShelves: number;
  shelves: Record<string, IShelf>;
}

export interface ICase {
  _id: string;
  caseId: string;
  cookItemId: string;
  orderId: string;
  customerId: string;
  storeName: string;
  flavor: string;
  productType: string;
  unitCount: number;
  caseNumber: number;
  totalCasesForItem: number;
  labelPrintTimestamp: string;
  status: "in-inventory" | "shipped";
}

// ──────────────────────────────
// API Request/Response Types
// ──────────────────────────────
export interface IGetCookItemsParams {
  status?: string;
  page?: number;
  limit?: number;
}

export interface IGetCookItemsResponse {
  total?: number;
  cookItems: ICookItem[];
  page?: number;
  limit?: number;
}

export interface IGetStage3CookItemsResponse {
  cookItems: IStage3CookItem[];
}

export interface IAssignMoldRequest {
  cookItemId: string;
  moldId: string;
  unitsPerMold?: number;
}

export interface IUnassignMoldRequest {
  cookItemId: string;
  moldId: string;
}

export interface IProcessMoldRequest {
  cookItemId: string;
  moldId: string;
  trayId: string;
  dehydratorUnitId: string;
  shelfPosition: number;
}

export interface IConfirmCountRequest {
  cookItemId: string;
  actualCount: number;
}

export interface ICase {
  _id: string;
  caseId: string;
  cookItemId: string;
  orderId: string;
  customerId: string;
  storeName: string;
  flavor: string;
  productType: string;
  unitCount: number;
  caseNumber: number;
  totalCasesForItem: number;
  labelPrintTimestamp: string;
  status: "in-inventory" | "shipped";
  createdAt: string;
  updatedAt: string;
}

export interface ICaseLabelData {
  storeName: string;
  flavor: string;
  unitCount: number;
  caseId: string;
  cookItemId: string;
}

export interface IConfirmCountResponse {
  success: boolean;
  cookItem: ICookItem;
  cases: {
    caseId: string;
    unitCount: number;
    caseNumber: number;
    labelData: ICaseLabelData;
  }[];
  orderStatus: {
    orderId: string;
    isComplete: boolean;
    completedItems: number;
    totalItems: number;
  };
}

// ──────────────────────────────
// Bulk Resource Creation
// ──────────────────────────────
export interface IBulkCreateResourceRequest {
  startNumber: number;
  endNumber: number;
  prefix: string;
}

export interface IBulkCreateMoldsRequest extends IBulkCreateResourceRequest {
  unitsPerMold?: number;
}

export interface IBulkCreateResourceResponse {
  success: boolean;
  message: string;
  created: number;
  skipped: number;
}
