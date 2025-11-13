import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";

export const followupsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 🟩 Create followup
    createFollowup: builder.mutation({
      query: (body) => ({
        url: "/followups",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.followups],
    }),

    // 🟨 Get all followups (supports filters + pagination)
    getAllFollowups: builder.query({
      query: ({
        storeId,
        repId,
        page = 1,
        limit = 20,
      }: {
        storeId?: string;
        repId?: string;
        page?: number;
        limit?: number;
      }) => ({
        url: "/followups",
        params: {
          storeId,
          repId,
          page,
          limit,
        },
      }),
      providesTags: [tagTypes.followups],
    }),

    // 🟦 Get followup by ID
    getFollowupById: builder.query({
      query: (id: string) => `/followups/${id}`,
      providesTags: [tagTypes.followups],
    }),

    // 🟧 Update followup
    updateFollowup: builder.mutation({
      query: ({ id, data }: { id: string; data: any }) => ({
        url: `/followups/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: [tagTypes.followups],
    }),

    // 🟥 Delete followup
    deleteFollowup: builder.mutation({
      query: (id: string) => ({
        url: `/followups/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [tagTypes.followups],
    }),
  }),
});

export const {
  useCreateFollowupMutation,
  useGetAllFollowupsQuery,
  useGetFollowupByIdQuery,
  useUpdateFollowupMutation,
  useDeleteFollowupMutation,
} = followupsApi;
