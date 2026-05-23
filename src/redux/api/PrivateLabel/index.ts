// Re-export all private label related APIs and types

// Private Label Products
export * from "./privateLabelApi";

// Private Label Clients
export * from "./privateLabelClientApi";

// Labels - 7-stage pipeline
export * from "./labelApi";

// Client Orders
export * from "./clientOrderApi";

// PPS
export * from "./ppsApi";

// Store - Private Label
export * from "./storeLabelApi";
export * from "./storeOrderApi";
export * from "./poolApi";
export * from "./storeSubmissionsApi";

// Re-export types from @/types for convenience
export type {
  // Private Label Client types
  IRecurringSchedule,
  RecurringInterval,
  IPrivateLabelClient,
  PrivateLabelClientStatus,
  IGetClientsResponse,
  IGetClientsParams,
  ICreateClientRequest,
  IUpdateClientRequest,
  IUpdateScheduleRequest,
  // Label types
  LabelStage,
  ILabelImage,
  IStageHistoryEntry,
  ILabel,
  IGetLabelsResponse,
  IGetLabelsParams,
  IUpdateLabelStageRequest,
  IBulkUpdateStagesRequest,
  // Client Order types
  ClientOrderStatus,
  IClientOrderItem,
  IClientOrder,
  DiscountType,
  IGetOrdersResponse,
  IGetOrdersParams,
  ICreateOrderRequest,
  IUpdateOrderRequest,
} from "@/types";
