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

    // 🟨 Get all followups (admin — supports filters + pagination)
    getAllFollowups: builder.query({
      query: ({
        storeId,
        repId,
        date,
        storeName,
        status,
        page = 1,
        limit = 20,
      }: {
        storeId?: string;
        repId?: string;
        date?: string;
        storeName?: string;
        status?: string;
        page?: number;
        limit?: number;
      }) => ({
        url: "/followups",
        params: { storeId, repId, page, date, storeName, status, limit },
      }),
      providesTags: [tagTypes.followups],
    }),

    // 🟦 Get follow-ups for a specific rep, bucketed (overdue/today/upcoming)
    getRepFollowups: builder.query({
      query: ({ repId, status }: { repId: string; status?: string }) => ({
        url: `/followups/rep/${repId}`,
        params: status ? { status } : {},
      }),
      providesTags: [tagTypes.followups],
    }),

    // 🟦 Get followup by ID
    getFollowupById: builder.query({
      query: (id: string) => `/followups/${id}`,
      providesTags: [tagTypes.followups],
    }),

    // 🔁 Reschedule followup (extend thread to new date)
    rescheduleFollowup: builder.mutation({
      query: ({ id, data }: { id: string; data: { followupDate: string; comments?: string; interestLevel?: string } }) => ({
        url: `/followups/${id}/reschedule`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: [tagTypes.followups],
    }),

    // ✅ Resolve followup (close it)
    resolveFollowup: builder.mutation({
      query: ({ id, data }: { id: string; data?: { comments?: string; interestLevel?: string } }) => ({
        url: `/followups/${id}/resolve`,
        method: "PATCH",
        body: data || {},
      }),
      invalidatesTags: [tagTypes.followups],
    }),

    // 🟧 Update followup (general edit — backwards compat)
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
  useGetRepFollowupsQuery,
  useGetFollowupByIdQuery,
  useRescheduleFollowupMutation,
  useResolveFollowupMutation,
  useUpdateFollowupMutation,
  useDeleteFollowupMutation,
} = followupsApi;
