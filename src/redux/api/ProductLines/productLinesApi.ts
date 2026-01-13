import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";

export interface IProductLine {
  _id: string;
  name: string;
  displayOrder: number;
  active: boolean;
  description?: string;
  pricingStructure: {
    type: "simple" | "variants" | "multi-type";
    variantLabels?: string[];
    typeLabels?: string[];
  };
  fields: Array<{
    name: string;
    label: string;
    type: string;
    placeholder?: string;
    required: boolean;
    options?: string[];
  }>;
  createdAt: string;
  updatedAt: string;
}

export const productLinesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all product lines
    getAllProductLines: builder.query<{ productLines: IProductLine[] }, void>({
      query: () => ({
        url: "/product-lines",
      }),
      providesTags: [tagTypes.productLines],
    }),

    // Get active product lines only
    getActiveProductLines: builder.query<
      { productLines: IProductLine[] },
      void
    >({
      query: () => ({
        url: "/product-lines/active",
      }),
      providesTags: [tagTypes.productLines],
    }),

    // Get single product line by ID
    getProductLineById: builder.query<{ productLine: IProductLine }, string>({
      query: (id) => `/product-lines/${id}`,
      providesTags: [tagTypes.productLines],
    }),

    // Get product line by name
    getProductLineByName: builder.query<{ productLine: IProductLine }, string>(
      {
        query: (name) => `/product-lines/by-name/${name}`,
        providesTags: [tagTypes.productLines],
      }
    ),

    // Create new product line
    createProductLine: builder.mutation({
      query: (body) => ({
        url: "/product-lines",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.productLines],
    }),

    // Update product line details
    updateProductLine: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/product-lines/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [tagTypes.productLines],
    }),

    // Toggle product line active/inactive status
    toggleProductLineStatus: builder.mutation({
      query: ({ id, active }) => ({
        url: `/product-lines/${id}/status`,
        method: "PUT",
        body: { active },
      }),
      invalidatesTags: [tagTypes.productLines],
    }),

    // Reorder product lines
    reorderProductLines: builder.mutation({
      query: (reorderedIds) => ({
        url: "/product-lines/reorder",
        method: "POST",
        body: { reorderedIds },
      }),
      invalidatesTags: [tagTypes.productLines],
    }),

    // Delete product line
    deleteProductLine: builder.mutation({
      query: (id) => ({
        url: `/product-lines/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [tagTypes.productLines],
    }),
  }),
});

export const {
  useGetAllProductLinesQuery,
  useGetActiveProductLinesQuery,
  useGetProductLineByIdQuery,
  useGetProductLineByNameQuery,
  useCreateProductLineMutation,
  useUpdateProductLineMutation,
  useToggleProductLineStatusMutation,
  useReorderProductLinesMutation,
  useDeleteProductLineMutation,
} = productLinesApi;
