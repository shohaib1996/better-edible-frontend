import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";

export const guestLogApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    signInGuest: builder.mutation({
      query: (body: { name: string }) => ({
        url: "/guest-logs",
        method: "GET",
        body,
      }),
      invalidatesTags: [tagTypes.guestLog],
    }),
    getGuestLogs: builder.query({
      query: (args: { startDate?: string; endDate?: string } = {}) => {
        const params: Record<string, string> = {};
        if (args.startDate) params.startDate = args.startDate;
        if (args.endDate) params.endDate = args.endDate;
        return { url: "/guest-log", params };
      },
      providesTags: [tagTypes.guestLog],
    }),
  }),
});

export const { useSignInGuestMutation, useGetGuestLogsQuery } = guestLogApi;
