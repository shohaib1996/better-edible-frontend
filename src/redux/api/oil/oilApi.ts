import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";
import type {
  IOilContainer,
  IWasteLog,
  ICalculatePullResponse,
  ICreateContainerRequest,
  IRefillContainerRequest,
  ICleanContainerRequest,
  ICreateWasteLogRequest,
} from "@/types/privateLabel/pps";

export const oilApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Containers ──────────────────────────
    getOilContainers: builder.query<
      { success: boolean; total: number; containers: IOilContainer[] },
      { status?: string; cannabisType?: string } | void
    >({
      query: (params) => ({
        url: "/oil/containers",
        params: params || {},
      }),
      providesTags: [tagTypes.oilContainers],
    }),

    getOilContainerById: builder.query<
      { success: boolean; container: IOilContainer },
      string
    >({
      query: (containerId) => `/oil/containers/${encodeURIComponent(containerId)}`,
      providesTags: [tagTypes.oilContainers],
    }),

    createOilContainer: builder.mutation<
      { success: boolean; container: IOilContainer },
      ICreateContainerRequest
    >({
      query: (body) => ({
        url: "/oil/containers",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.oilContainers],
    }),

    refillOilContainer: builder.mutation<
      { success: boolean; container: IOilContainer },
      { containerId: string } & IRefillContainerRequest
    >({
      query: ({ containerId, ...body }) => ({
        url: `/oil/containers/${encodeURIComponent(containerId)}/refill`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [tagTypes.oilContainers],
    }),

    cleanOilContainer: builder.mutation<
      { success: boolean; container: IOilContainer; wasteLog: IWasteLog },
      { containerId: string } & ICleanContainerRequest
    >({
      query: ({ containerId, ...body }) => ({
        url: `/oil/containers/${encodeURIComponent(containerId)}/clean`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [tagTypes.oilContainers, tagTypes.oilWasteLogs],
    }),

    calculateOilPull: builder.query<
      ICalculatePullResponse,
      { containerId: string; moldCount: number }
    >({
      query: ({ containerId, moldCount }) => ({
        url: `/oil/containers/${encodeURIComponent(containerId)}/calculate`,
        params: { moldCount },
      }),
    }),

    // ─── Waste Logs ──────────────────────────
    getWasteLogs: builder.query<
      { success: boolean; total: number; wasteLogs: IWasteLog[] },
      { material?: string; reason?: string; sourceContainerId?: string } | void
    >({
      query: (params) => ({
        url: "/oil/waste-logs",
        params: params || {},
      }),
      providesTags: [tagTypes.oilWasteLogs],
    }),

    createWasteLog: builder.mutation<
      { success: boolean; wasteLog: IWasteLog },
      ICreateWasteLogRequest
    >({
      query: (body) => ({
        url: "/oil/waste-logs",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.oilWasteLogs],
    }),
  }),
});

export const {
  useGetOilContainersQuery,
  useGetOilContainerByIdQuery,
  useCreateOilContainerMutation,
  useRefillOilContainerMutation,
  useCleanOilContainerMutation,
  useCalculateOilPullQuery,
  useGetWasteLogsQuery,
  useCreateWasteLogMutation,
} = oilApi;
