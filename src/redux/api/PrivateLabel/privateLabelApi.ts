import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";

export const privateLabelApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================
    // PRIVATE LABEL PRODUCTS
    // ============================================

    // 🟩 Get all private label products
    getPrivateLabelProducts: builder.query({
      query: ({ activeOnly = false }) => ({
        url: "/private-label-products",
        params: { activeOnly },
      }),
      providesTags: [tagTypes.privateLabelProducts],
    }),

    // 🟦 Get single product by ID
    getPrivateLabelProductById: builder.query({
      query: (id) => `/private-label-products/${id}`,
      providesTags: [tagTypes.privateLabelProducts],
    }),

    // 🟨 Create new product
    createPrivateLabelProduct: builder.mutation({
      query: (body) => ({
        url: "/private-label-products",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.privateLabelProducts],
    }),

    // 🟧 Update product
    updatePrivateLabelProduct: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/private-label-products/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [tagTypes.privateLabelProducts],
    }),

    // 🟥 Delete product
    deletePrivateLabelProduct: builder.mutation({
      query: (id) => ({
        url: `/private-label-products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [tagTypes.privateLabelProducts],
    }),

    // ============================================
    // PRIVATE LABEL ORDERS
    // ============================================

    // 🟩 Get all private label orders (with optional filters)
    getPrivateLabelOrders: builder.query({
      query: ({
        status,
        repId,
        repName,
        storeId,
        startDate,
        endDate,
        search,
        page = 1,
        limit = 20,
      }) => ({
        url: "/private-labels",
        params: {
          status,
          repId,
          repName,
          storeId,
          startDate,
          endDate,
          search,
          page,
          limit,
        },
      }),
      providesTags: [tagTypes.privateLabelOrders],
    }),

    // 🟦 Get single order by ID
    getPrivateLabelOrderById: builder.query({
      query: (id) => `/private-labels/${id}`,
      providesTags: [tagTypes.privateLabelOrders],
    }),

    // 🟨 Create new private label order (with FormData for file upload)
    createPrivateLabelOrder: builder.mutation({
      query: (formData) => ({
        url: "/private-labels",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: [tagTypes.privateLabelOrders],
    }),

    // 🟧 Update private label order (supports both JSON and FormData)
    updatePrivateLabelOrder: builder.mutation({
      query: (arg) => {
        // If arg is an object with id and body (FormData case)
        if (arg.body instanceof FormData) {
          return {
            url: `/private-labels/${arg.id}`,
            method: "PUT",
            body: arg.body,
          };
        }
        // Otherwise, it's a regular JSON update
        const { id, ...body } = arg;
        return {
          url: `/private-labels/${id}`,
          method: "PUT",
          body,
        };
      },
      invalidatesTags: [tagTypes.privateLabelOrders],
    }),

    // 🟫 Change order status
    changePrivateLabelOrderStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/private-labels/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: [tagTypes.privateLabelOrders],
    }),

    // ❌ Delete order
    deletePrivateLabelOrder: builder.mutation({
      query: (id) => ({
        url: `/private-labels/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [tagTypes.privateLabelOrders],
    }),
  }),
});

export const {
  // Products
  useGetPrivateLabelProductsQuery,
  useGetPrivateLabelProductByIdQuery,
  useCreatePrivateLabelProductMutation,
  useUpdatePrivateLabelProductMutation,
  useDeletePrivateLabelProductMutation,
  // Orders
  useGetPrivateLabelOrdersQuery,
  useGetPrivateLabelOrderByIdQuery,
  useCreatePrivateLabelOrderMutation,
  useUpdatePrivateLabelOrderMutation,
  useChangePrivateLabelOrderStatusMutation,
  useDeletePrivateLabelOrderMutation,
} = privateLabelApi;
