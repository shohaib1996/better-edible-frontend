import { IStore } from "../store/store";
import { IRep } from "../reps/reps";

// ─────────────────────────────
// RECURRING SCHEDULE
// ─────────────────────────────

export type RecurringInterval = "monthly" | "bimonthly" | "quarterly";

export interface IRecurringSchedule {
  enabled: boolean;
  interval?: RecurringInterval;
}

// ─────────────────────────────
// PRIVATE LABEL CLIENT
// ─────────────────────────────

export type PrivateLabelClientStatus = "onboarding" | "active";

export interface IPrivateLabelClient {
  _id: string;
  store: Pick<IStore, "_id" | "name" | "address" | "city" | "state" | "zip">;
  status: PrivateLabelClientStatus;
  contactEmail: string;
  assignedRep: Pick<IRep, "_id" | "name" | "email">;
  recurringSchedule: IRecurringSchedule;
  labelCounts?: {
    approved: number;
    inProgress: number;
  };
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────
// API REQUEST/RESPONSE TYPES
// ─────────────────────────────

export interface IGetClientsResponse {
  total: number;
  clients: IPrivateLabelClient[];
  page: number;
  limit: number;
}

export interface IGetClientsParams {
  status?: string;
  repId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ICreateClientRequest {
  storeId: string;
  contactEmail: string;
  assignedRepId: string;
  recurringSchedule?: IRecurringSchedule;
}

export interface IUpdateClientRequest {
  id: string;
  contactEmail?: string;
  assignedRepId?: string;
  recurringSchedule?: IRecurringSchedule;
  status?: PrivateLabelClientStatus;
}

export interface IUpdateScheduleRequest {
  id: string;
  enabled: boolean;
  interval?: RecurringInterval;
}
