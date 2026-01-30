import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";
import {
  IClientOrder,
  ClientOrderStatus,
  IGetOrdersResponse,
  IGetOrdersParams,
  ICreateOrderRequest,
  IUpdateOrderRequest,
} from "@/types";

// ─────────────────────────────
// API SLICE
// ─────────────────────────────

export const clientOrderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================
    // CLIENT ORDERS
    // ============================================

    // Get all orders with filters
    getAllClientOrders: builder.query<IGetOrdersResponse, IGetOrdersParams>({
      query: (params) => ({
        url: "/client-orders",
        params,
      }),
      providesTags: [tagTypes.clientOrders],
    }),

    // Get single order by ID
    getClientOrderById: builder.query<IClientOrder, string>({
      query: (id) => `/client-orders/${id}`,
      providesTags: [tagTypes.clientOrders],
    }),

    // Create new order
    createClientOrder: builder.mutation<
      { message: string; order: IClientOrder },
      ICreateOrderRequest
    >({
      query: (body) => ({
        url: "/client-orders",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.clientOrders],
    }),

    // Update order (only while in "waiting" status)
    updateClientOrder: builder.mutation<
      { message: string; order: IClientOrder },
      IUpdateOrderRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/client-orders/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [tagTypes.clientOrders],
    }),

    // Update order status
    updateClientOrderStatus: builder.mutation<
      { message: string; order: IClientOrder },
      { id: string; status: ClientOrderStatus }
    >({
      query: ({ id, status }) => ({
        url: `/client-orders/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: [tagTypes.clientOrders],
    }),

    // Push order to PPS (moves from "waiting" to "stage_1")
    pushOrderToPPS: builder.mutation<
      { message: string; order: IClientOrder },
      string
    >({
      query: (id) => ({
        url: `/client-orders/${id}/push-to-pps`,
        method: "PATCH",
      }),
      invalidatesTags: [tagTypes.clientOrders],
    }),

    // Update delivery date
    updateDeliveryDate: builder.mutation<
      { message: string; order: IClientOrder },
      { id: string; deliveryDate: string }
    >({
      query: ({ id, deliveryDate }) => ({
        url: `/client-orders/${id}/delivery-date`,
        method: "PATCH",
        body: { deliveryDate },
      }),
      invalidatesTags: [tagTypes.clientOrders],
    }),

    // Toggle ship ASAP
    toggleShipASAP: builder.mutation<
      { message: string; order: IClientOrder },
      { id: string; shipASAP?: boolean }
    >({
      query: ({ id, shipASAP }) => ({
        url: `/client-orders/${id}/ship-asap`,
        method: "PATCH",
        body: { shipASAP },
      }),
      invalidatesTags: [tagTypes.clientOrders],
    }),

    // Delete order (only if not in production)
    deleteClientOrder: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/client-orders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [tagTypes.clientOrders],
    }),
  }),
});

// ─────────────────────────────
// EXPORT HOOKS
// ─────────────────────────────

export const {
  useGetAllClientOrdersQuery,
  useGetClientOrderByIdQuery,
  useCreateClientOrderMutation,
  useUpdateClientOrderMutation,
  useUpdateClientOrderStatusMutation,
  usePushOrderToPPSMutation,
  useUpdateDeliveryDateMutation,
  useToggleShipASAPMutation,
  useDeleteClientOrderMutation,
} = clientOrderApi;
