import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";
import type {
  ILabelOrder,
  ILabelInventory,
  IInventorySummary,
  ICreateLabelOrderRequest,
  IReceiveLabelOrderRequest,
  IApplyLabelsRequest,
  IPrintLabelsRequest,
  ISetReorderThresholdRequest,
} from "@/types/privateLabel/packagePrep";
import type {
  ICookItem,
  ICase,
  IHistoryEntry,
  IStage3CookItem,
  IMold,
  IDehydratorTray,
  IDehydratorUnit,
  IGetCookItemsParams,
  IGetCookItemsResponse,
  IGetStage3CookItemsResponse,
  IAssignMoldRequest,
  IProcessMoldRequest,
  IConfirmCountRequest,
  IConfirmCountResponse,
  IBulkCreateMoldsRequest,
  IBulkCreateResourceRequest,
  IBulkCreateResourceResponse,
} from "@/types/privateLabel/pps";

export const ppsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Stage 1 ──────────────────────────
    getStage1CookItems: builder.query<
      IGetCookItemsResponse,
      IGetCookItemsParams | void
    >({
      query: (params) => ({
        url: "/pps/stage-1/cook-items",
        params: params || {},
      }),
      providesTags: [tagTypes.ppsCookItems],
    }),

    assignMold: builder.mutation<
      { success: boolean; cookItem: ICookItem; mold: IMold },
      IAssignMoldRequest
    >({
      query: (body) => ({
        url: "/pps/stage-1/assign-mold",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.ppsCookItems, tagTypes.ppsMolds],
    }),

    completeStage1: builder.mutation<
      { success: boolean; cookItem: ICookItem },
      { cookItemId: string }
    >({
      query: (body) => ({
        url: "/pps/stage-1/complete",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [tagTypes.ppsCookItems],
    }),

    // ─── Stage 2 ──────────────────────────
    getStage2CookItems: builder.query<IGetCookItemsResponse, void>({
      query: () => "/pps/stage-2/cook-items",
      providesTags: [tagTypes.ppsCookItems],
    }),

    processMold: builder.mutation<
      { success: boolean; message: string; cookItem: ICookItem },
      IProcessMoldRequest
    >({
      query: (body) => ({
        url: "/pps/stage-2/process-mold",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        tagTypes.ppsCookItems,
        tagTypes.ppsMolds,
        tagTypes.ppsTrays,
        tagTypes.ppsUnits,
      ],
    }),

    getNextAvailableShelf: builder.query<
      { dehydratorUnitId: string; shelfPosition: number },
      void
    >({
      query: () => "/pps/stage-2/next-available-shelf",
      providesTags: [tagTypes.ppsUnits],
    }),

    // ─── Stage 3 ──────────────────────────
    getStage3CookItems: builder.query<IGetStage3CookItemsResponse, void>({
      query: () => "/pps/stage-3/cook-items",
      providesTags: [tagTypes.ppsCookItems],
    }),

    removeTray: builder.mutation<
      { success: boolean; timestamp: string },
      { cookItemId: string; trayId: string }
    >({
      query: (body) => ({
        url: "/pps/stage-3/remove-tray",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.ppsCookItems],
    }),

    completeStage3: builder.mutation<
      {
        success: boolean;
        cookItem: ICookItem;
        releasedTrays: string[];
        releasedShelves: { dehydratorUnitId: string; shelfPosition: number }[];
      },
      { cookItemId: string }
    >({
      query: (body) => ({
        url: "/pps/stage-3/complete",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        tagTypes.ppsCookItems,
        tagTypes.ppsTrays,
        tagTypes.ppsUnits,
      ],
    }),

    // ─── Stage 4 ──────────────────────────
    getStage4CookItems: builder.query<{ cookItems: ICookItem[] }, void>({
      query: () => "/pps/stage-4/cook-items",
      providesTags: [tagTypes.ppsCookItems],
    }),

    scanContainer: builder.mutation<
      {
        success: boolean;
        cookItem: Partial<ICookItem> & { numberOfMolds: number };
      },
      { qrCodeData: string }
    >({
      query: (body) => ({
        url: "/pps/stage-4/scan-container",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.ppsCookItems],
    }),

    confirmCount: builder.mutation<IConfirmCountResponse, IConfirmCountRequest>(
      {
        query: (body) => ({
          url: "/pps/stage-4/confirm-count",
          method: "POST",
          body,
        }),
        invalidatesTags: [tagTypes.ppsCookItems, tagTypes.clientOrders],
      }
    ),

    getCaseById: builder.query<{ success: boolean; case: ICase }, string>({
      query: (caseId) => `/pps/cases/${encodeURIComponent(caseId)}`,
      providesTags: [tagTypes.ppsCookItems],
    }),

    // ─── History ──────────────────────────
    getCookItemHistory: builder.query<
      { cookItemId: string; history: IHistoryEntry[] },
      string
    >({
      query: (cookItemId) => `/pps/cook-items/${cookItemId}/history`,
      providesTags: [tagTypes.ppsCookItems],
    }),

    // ─── Resources ──────────────────────────
    getMolds: builder.query<{ molds: IMold[] }, void>({
      query: () => "/pps/molds",
      providesTags: [tagTypes.ppsMolds],
    }),

    getDehydratorTrays: builder.query<{ trays: IDehydratorTray[] }, void>({
      query: () => "/pps/dehydrator-trays",
      providesTags: [tagTypes.ppsTrays],
    }),

    getDehydratorUnits: builder.query<{ units: IDehydratorUnit[] }, void>({
      query: () => "/pps/dehydrator-units",
      providesTags: [tagTypes.ppsUnits],
    }),

    // ─── Bulk Resource Creation ──────────────────────────
    bulkCreateMolds: builder.mutation<
      IBulkCreateResourceResponse,
      IBulkCreateMoldsRequest
    >({
      query: (body) => ({
        url: "/pps/molds/bulk",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.ppsMolds],
    }),

    bulkCreateTrays: builder.mutation<
      IBulkCreateResourceResponse,
      IBulkCreateResourceRequest
    >({
      query: (body) => ({
        url: "/pps/dehydrator-trays/bulk",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.ppsTrays],
    }),

    bulkCreateDehydratorUnits: builder.mutation<
      IBulkCreateResourceResponse,
      IBulkCreateResourceRequest
    >({
      query: (body) => ({
        url: "/pps/dehydrator-units/bulk",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.ppsUnits],
    }),

    bulkDeleteMolds: builder.mutation<
      { success: boolean; deleted: number; message: string },
      { moldIds: string[] }
    >({
      query: (body) => ({
        url: "/pps/molds/bulk",
        method: "DELETE",
        body,
      }),
      invalidatesTags: [tagTypes.ppsMolds],
    }),

    updateMoldStatus: builder.mutation<
      { success: boolean; mold: IMold },
      { moldId: string; status: "available" | "in-use" }
    >({
      query: ({ moldId, ...body }) => ({
        url: `/pps/molds/${moldId}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [tagTypes.ppsMolds],
    }),

    bulkDeleteTrays: builder.mutation<
      { success: boolean; deleted: number; message: string },
      { trayIds: string[] }
    >({
      query: (body) => ({
        url: "/pps/dehydrator-trays/bulk",
        method: "DELETE",
        body,
      }),
      invalidatesTags: [tagTypes.ppsTrays],
    }),

    updateTrayStatus: builder.mutation<
      { success: boolean; tray: IDehydratorTray },
      { trayId: string; status: "available" | "in-use" }
    >({
      query: ({ trayId, ...body }) => ({
        url: `/pps/dehydrator-trays/${trayId}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [tagTypes.ppsTrays],
    }),

    // ─── Package Prep ──────────────────────────
    getActiveLabelOrders: builder.query<{ success: boolean; orders: ILabelOrder[] }, void>({
      query: () => "/pps/package-prep/orders",
      providesTags: [tagTypes.ppsLabelOrders],
    }),

    createLabelOrder: builder.mutation<{ success: boolean; order: ILabelOrder }, ICreateLabelOrderRequest>({
      query: (body) => ({
        url: "/pps/package-prep/orders",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.ppsLabelOrders],
    }),

    receiveLabelOrder: builder.mutation<
      { success: boolean; order: ILabelOrder; inventory: ILabelInventory },
      IReceiveLabelOrderRequest
    >({
      query: ({ orderId, ...body }) => ({
        url: `/pps/package-prep/orders/${orderId}/receive`,
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.ppsLabelOrders, tagTypes.ppsLabelInventory],
    }),

    getLabelInventory: builder.query<
      { success: boolean; inventory: ILabelInventory[] },
      { storeId?: string } | void
    >({
      query: (params) => ({
        url: "/pps/package-prep/inventory",
        params: params || {},
      }),
      providesTags: [tagTypes.ppsLabelInventory],
    }),

    applyLabels: builder.mutation<{ success: boolean; inventory: ILabelInventory }, IApplyLabelsRequest>({
      query: (body) => ({
        url: "/pps/package-prep/inventory/apply",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.ppsLabelInventory],
    }),

    printLabels: builder.mutation<{ success: boolean; inventory: ILabelInventory }, IPrintLabelsRequest>({
      query: (body) => ({
        url: "/pps/package-prep/inventory/print",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.ppsLabelInventory],
    }),

    getInventorySummary: builder.query<{ success: boolean } & IInventorySummary, void>({
      query: () => "/pps/package-prep/inventory/summary",
      providesTags: [tagTypes.ppsLabelInventory],
    }),

    setReorderThreshold: builder.mutation<
      { success: boolean; inventory: ILabelInventory },
      ISetReorderThresholdRequest
    >({
      query: ({ inventoryId, ...body }) => ({
        url: `/pps/package-prep/inventory/${inventoryId}/threshold`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [tagTypes.ppsLabelInventory],
    }),
  }),
});

export const {
  useGetCookItemHistoryQuery,
  useGetCaseByIdQuery,
  useGetStage1CookItemsQuery,
  useAssignMoldMutation,
  useCompleteStage1Mutation,
  useGetStage2CookItemsQuery,
  useProcessMoldMutation,
  useGetNextAvailableShelfQuery,
  useGetStage3CookItemsQuery,
  useRemoveTrayMutation,
  useCompleteStage3Mutation,
  useGetStage4CookItemsQuery,
  useScanContainerMutation,
  useConfirmCountMutation,
  useGetMoldsQuery,
  useGetDehydratorTraysQuery,
  useGetDehydratorUnitsQuery,
  useBulkCreateMoldsMutation,
  useBulkCreateTraysMutation,
  useBulkCreateDehydratorUnitsMutation,
  useBulkDeleteMoldsMutation,
  useUpdateMoldStatusMutation,
  useBulkDeleteTraysMutation,
  useUpdateTrayStatusMutation,
  useGetActiveLabelOrdersQuery,
  useCreateLabelOrderMutation,
  useReceiveLabelOrderMutation,
  useGetLabelInventoryQuery,
  useApplyLabelsMutation,
  usePrintLabelsMutation,
  useGetInventorySummaryQuery,
  useSetReorderThresholdMutation,
} = ppsApi;
