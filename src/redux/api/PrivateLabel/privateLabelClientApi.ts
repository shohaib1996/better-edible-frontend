import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";
import {
  IPrivateLabelClient,
  IGetClientsResponse,
  IGetClientsParams,
  ICreateClientRequest,
  IUpdateClientRequest,
  IUpdateScheduleRequest,
} from "@/types";

// ─────────────────────────────
// API SLICE
// ─────────────────────────────

export const privateLabelClientApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================
    // PRIVATE LABEL CLIENTS
    // ============================================

    // Get all clients with filters
    getAllPrivateLabelClients: builder.query<IGetClientsResponse, IGetClientsParams>({
      query: (params) => ({
        url: "/private-label-clients",
        params,
      }),
      providesTags: [tagTypes.privateLabelClients],
    }),

    // Get single client by ID
    getPrivateLabelClientById: builder.query<IPrivateLabelClient, string>({
      query: (id) => `/private-label-clients/${id}`,
      providesTags: [tagTypes.privateLabelClients],
    }),

    // Get clients with approved labels (for order creation dropdown)
    getClientsWithApprovedLabels: builder.query<
      IPrivateLabelClient[],
      { search?: string; limit?: number } | void
    >({
      query: (params) => ({
        url: "/private-label-clients/with-approved-labels",
        params: params || {},
      }),
      providesTags: [tagTypes.privateLabelClients, tagTypes.labels],
    }),

    // Create new client
    createPrivateLabelClient: builder.mutation<
      { message: string; client: IPrivateLabelClient },
      ICreateClientRequest
    >({
      query: (body) => ({
        url: "/private-label-clients",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.privateLabelClients],
    }),

    // Update client
    updatePrivateLabelClient: builder.mutation<
      { message: string; client: IPrivateLabelClient },
      IUpdateClientRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/private-label-clients/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [tagTypes.privateLabelClients],
    }),

    // Delete client
    deletePrivateLabelClient: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/private-label-clients/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [tagTypes.privateLabelClients, tagTypes.labels],
    }),

    // Update recurring schedule
    updateClientSchedule: builder.mutation<
      { message: string; client: IPrivateLabelClient },
      IUpdateScheduleRequest
    >({
      query: ({ id, enabled, interval }) => ({
        url: `/private-label-clients/${id}/schedule`,
        method: "PATCH",
        body: { enabled, interval },
      }),
      invalidatesTags: [tagTypes.privateLabelClients],
    }),
  }),
});

// ─────────────────────────────
// EXPORT HOOKS
// ─────────────────────────────

export const {
  useGetAllPrivateLabelClientsQuery,
  useGetPrivateLabelClientByIdQuery,
  useGetClientsWithApprovedLabelsQuery,
  useCreatePrivateLabelClientMutation,
  useUpdatePrivateLabelClientMutation,
  useDeletePrivateLabelClientMutation,
  useUpdateClientScheduleMutation,
} = privateLabelClientApi;
