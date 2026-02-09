import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";
import {
  IPrivateLabelProduct,
  IGetProductsParams,
  IGetProductsResponse,
  ICreateProductRequest,
  IUpdateProductRequest,
} from "@/types";

// ─────────────────────────────
// API SLICE
// ─────────────────────────────

export const privateLabelApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================
    // PRIVATE LABEL PRODUCTS
    // ============================================

    // Get all private label products
    getPrivateLabelProducts: builder.query<
      IGetProductsResponse,
      IGetProductsParams
    >({
      query: ({ activeOnly = false }) => ({
        url: "/private-label-products",
        params: { activeOnly },
      }),
      providesTags: [tagTypes.privateLabelProducts],
    }),

    // Get single product by ID
    getPrivateLabelProductById: builder.query<IPrivateLabelProduct, string>({
      query: (id) => `/private-label-products/${id}`,
      providesTags: [tagTypes.privateLabelProducts],
    }),

    // Create new product
    createPrivateLabelProduct: builder.mutation<
      { message: string; product: IPrivateLabelProduct },
      ICreateProductRequest
    >({
      query: (body) => ({
        url: "/private-label-products",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.privateLabelProducts],
    }),

    // Update product
    updatePrivateLabelProduct: builder.mutation<
      { message: string; product: IPrivateLabelProduct },
      IUpdateProductRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/private-label-products/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [tagTypes.privateLabelProducts],
    }),

    // Delete product
    deletePrivateLabelProduct: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/private-label-products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [tagTypes.privateLabelProducts],
    }),
  }),
});

// ─────────────────────────────
// EXPORT HOOKS
// ─────────────────────────────

export const {
  useGetPrivateLabelProductsQuery,
  useGetPrivateLabelProductByIdQuery,
  useCreatePrivateLabelProductMutation,
  useUpdatePrivateLabelProductMutation,
  useDeletePrivateLabelProductMutation,
} = privateLabelApi;
