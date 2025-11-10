import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";

export const deliveriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 🟩 Create delivery
    createDelivery: builder.mutation({
      query: (body) => ({
        url: "/deliveries",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.deliveries],
    }),

    // 🟨 Get all deliveries (with filters and pagination)
    getAllDeliveries: builder.query({
      query: ({
        status,
        assignedTo,
        storeName,
        scheduledAt,
        storeId,
        page = 1,
        limit = 20,
      }) => ({
        url: "/deliveries",
        params: {
          status,
          assignedTo,
          storeId,
          scheduledAt,
          storeName,
          page,
          limit,
        },
      }),
      providesTags: [tagTypes.deliveries],
    }),

    // 🟦 Get delivery by ID
    getDeliveryById: builder.query({
      query: (id) => `/deliveries/${id}`,
      providesTags: [tagTypes.deliveries],
    }),

    // 🟧 Update delivery status
    updateDeliveryStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/deliveries/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: [tagTypes.deliveries],
    }),

    // 🟥 Delete delivery
    deleteDelivery: builder.mutation({
      query: (id) => ({
        url: `/deliveries/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [tagTypes.deliveries],
    }),
  }),
});

export const {
  useCreateDeliveryMutation,
  useGetAllDeliveriesQuery,
  useGetDeliveryByIdQuery,
  useUpdateDeliveryStatusMutation,
  useDeleteDeliveryMutation,
} = deliveriesApi;
