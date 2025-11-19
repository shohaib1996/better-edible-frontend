import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";

export const timelogsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllTimeLogs: builder.query({
      query: () => `/timelogs`,
      providesTags: [tagTypes.timelogs],
    }),
    getTimelogsByRepId: builder.query({
      query: ({ id, startDate, endDate }) => ({
        url: `/timelogs/rep/${id}`,
        params: { startDate, endDate },
      }),
      providesTags: [tagTypes.timelogs],
    }),
  }),
});

export const { useGetAllTimeLogsQuery, useGetTimelogsByRepIdQuery } =
  timelogsApi;
