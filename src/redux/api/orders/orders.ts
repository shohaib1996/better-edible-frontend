import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";

export const ordersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 🟩 Get all orders (with optional filters & pagination)
    getAllOrders: builder.query({
      query: ({ status, storeId, repName, search, repId, page = 1, limit = 20 }) => ({
        url: "/orders",
        params: { status, storeId, repName, search, repId, page, limit },
      }),
      providesTags: [tagTypes.orders],
    }),

    // 🟦 Get single order by ID
    getOrderById: builder.query({
      query: (id) => `/orders/${id}`,
      providesTags: [tagTypes.orders],
    }),

    // 🟨 Create new order
    createOrder: builder.mutation({
      query: (body) => ({
        url: "/orders",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.orders],
    }),

    // 🟧 Update order (only allowed for draft)
    updateOrder: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/orders/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [tagTypes.orders],
    }),

    // 🟫 Change order status
    changeOrderStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/orders/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: [tagTypes.orders],
    }),

    // 🟥 Collect payment
    collectPayment: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/orders/${id}/payment`,
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.orders],
    }),

    // ❌ Delete order (optional)
    deleteOrder: builder.mutation({
      query: (id) => ({
        url: `/orders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [tagTypes.orders],
    }),
  }),
});

export const {
  useGetAllOrdersQuery,
  useGetOrderByIdQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useChangeOrderStatusMutation,
  useCollectPaymentMutation,
  useDeleteOrderMutation,
} = ordersApi;
