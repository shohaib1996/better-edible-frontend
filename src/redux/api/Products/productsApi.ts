import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";

export const productsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 🧾 Get all products (with search, filter, pagination)
    getAllProducts: builder.query({
      query: () => ({
        url: "/products",
      }),
      providesTags: [tagTypes.products],
    }),

    // 🔍 Get single product by ID
    getProductById: builder.query({
      query: (id) => `/products/${id}`,
      providesTags: [tagTypes.products],
    }),

    // ➕ Create new product
    createProduct: builder.mutation({
      query: (body) => ({
        url: "/products",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.products],
    }),

    // ✏️ Update product details
    updateProduct: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/products/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [tagTypes.products],
    }),

    // 🟢 Toggle product active/inactive status
    toggleProductStatus: builder.mutation({
      query: ({ id, active }) => ({
        url: `/products/${id}/status`,
        method: "PUT",
        body: { active },
      }),
      invalidatesTags: [tagTypes.products],
    }),

    // ❌ Delete product
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [tagTypes.products],
    }),
  }),
});

export const {
  useGetAllProductsQuery,
  useGetProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useToggleProductStatusMutation,
  useDeleteProductMutation,
} = productsApi;
