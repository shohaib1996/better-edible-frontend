import { IStore } from "../store/store";

// ─────────────────────────────
// LABEL STAGES (7-stage pipeline)
// ─────────────────────────────

export type LabelStage =
  | "design_in_progress"
  | "awaiting_store_approval"
  | "store_approved"
  | "submitted_to_olcc"
  | "olcc_approved"
  | "print_order_submitted"
  | "ready_for_production";

// ─────────────────────────────
// LABEL IMAGE (Cloudinary)
// ─────────────────────────────

export interface ILabelImage {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  bytes: number;
  originalFilename: string;
  uploadedAt: string;
}

// ─────────────────────────────
// STAGE HISTORY
// ─────────────────────────────

export interface IStageHistoryEntry {
  stage: LabelStage;
  changedBy: {
    _id: string;
    name: string;
    email?: string;
  };
  changedAt: string;
  notes?: string;
}

// ─────────────────────────────
// LABEL
// ─────────────────────────────

export interface ILabel {
  _id: string;
  client: {
    _id: string;
    store?: Pick<IStore, "_id" | "name" | "city" | "state">;
    status?: string;
  };
  flavorName: string;
  productType: string;
  currentStage: LabelStage;
  stageHistory: IStageHistoryEntry[];
  labelImages: ILabelImage[];
  unitPrice?: number; // Added when fetching approved labels
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────
// API REQUEST/RESPONSE TYPES
// ─────────────────────────────

export interface IGetLabelsResponse {
  total: number;
  labels: ILabel[];
  page: number;
  limit: number;
}

export interface IGetLabelsParams {
  clientId?: string;
  stage?: string;
  productType?: string;
  page?: number;
  limit?: number;
}

export interface IUpdateLabelStageRequest {
  id: string;
  stage: LabelStage;
  notes?: string;
}

export interface IBulkUpdateStagesRequest {
  clientId: string;
  stage: LabelStage;
  notes?: string;
}
