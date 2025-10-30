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
        if (args?.repId) params.append("repId", args.repId);
        if (args?.paymentStatus)
          params.append("paymentStatus", args.paymentStatus);
        if (args?.isDue) params.append("isDue", args.isDue.toString());

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

    assignStoreToRep: builder.mutation({
      query: ({ storeIds, repId }) => ({
        url: `/stores/assign-rep`,
        method: "POST",
        body: { storeIds, repId },
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
    toggleBlockStores: builder.mutation({
      query: ({ storeIds, blocked }) => ({
        url: "/stores/toggle-block",
        method: "POST",
        body: { storeIds, blocked },
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
  useAssignStoreToRepMutation,
  useGetStoreByIdQuery,
  useCreateStoreMutation,
  useUpdateStoreMutation,
  useToggleBlockStoreMutation,
  useDeleteStoreMutation,
  useToggleBlockStoresMutation,
} = storesApi;
