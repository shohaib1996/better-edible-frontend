import { tagTypes } from "../../tagTypes/tagTypes";
import { baseApi } from "../baseApi";


export const storesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllStores: builder.query({
      query: (args) => {
        const params = new URLSearchParams();
        if (args?.page) params.append("page", args.page.toString());
        if (args?.limit) params.append("limit", args.limit.toString());
        if (args?.search) params.append("search", args.search);

        return {
          url: `/stores?${params.toString()}`,
          method: "GET",
        };
      },
      providesTags: [tagTypes.stores],
    }),
    getStoreById: builder.query({
      query: (id) => ({
        url: `/stores/${id}`,
        method: "GET",
      }),
      providesTags: [tagTypes.stores],
    }),
    createStore: builder.mutation({
      query: (body) => ({
        url: "/stores",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.stores],
    }),
    updateStore: builder.mutation({
      query: ({ id, body }) => ({
        url: `/stores/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [tagTypes.stores],
    }),
    toggleBlockStore: builder.mutation({
      query: (id) => ({
        url: `/stores/${id}/block`,
        method: "PUT",
      }),
      invalidatesTags: [tagTypes.stores],
    }),
    deleteStore: builder.mutation({
      query: (id) => ({
        url: `/stores/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [tagTypes.stores],
    }),
  }),
});

export const {
  useGetAllStoresQuery,
  useGetStoreByIdQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
  useToggleBlockStoreMutation,
  useDeleteStoreMutation,
} = storesApi;
