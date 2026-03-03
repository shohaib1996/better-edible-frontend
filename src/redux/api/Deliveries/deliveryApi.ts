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
        startDate,
        endDate,
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
          startDate,
          endDate,
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
      query: ({ id, status, today }) => ({
        url: `/deliveries/${id}/status`,
        method: "PUT",
        body: { status, today },
      }),
      invalidatesTags: [tagTypes.deliveries],
    }),
    updateDelivery: builder.mutation({
      query: ({ id, data }) => ({
        url: `/deliveries/${id}`,
        method: "PUT",
        body: data,
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

    // 🔹 Delivery order sequence
    getDeliveryOrder: builder.query({
      query: ({ repId, date }: { repId: string; date: string }) => ({
        url: "/delivery-order",
        params: { repId, date },
      }),
      providesTags: [tagTypes.deliveryOrder],
    }),
    saveDeliveryOrder: builder.mutation({
      query: (body: { repId: string; date: string; order: string[] }) => ({
        url: "/delivery-order",
        method: "PUT",
        body,
      }),
      invalidatesTags: [tagTypes.deliveryOrder],
    }),
  }),
});

export const {
  useCreateDeliveryMutation,
  useGetAllDeliveriesQuery,
  useGetDeliveryByIdQuery,
  useUpdateDeliveryStatusMutation,
  useDeleteDeliveryMutation,
  useUpdateDeliveryMutation,
  useGetDeliveryOrderQuery,
  useSaveDeliveryOrderMutation,
} = deliveriesApi;
