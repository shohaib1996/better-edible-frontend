import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";

export const timelogsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllTimeLogs: builder.query({
      query: () => `/timelogs`,
      providesTags: [tagTypes.timelogs],
    }),
    getTimelogsByRepId: builder.query({
      query: (args) => {
        const { id, startDate, endDate } = args;
        const params: any = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return {
          url: `/timelogs/rep/${id}`,
          params,
        };
      },
      providesTags: [tagTypes.timelogs],
    }),
    getTimelogsSummary: builder.query({
      query: (args = {}) => {
        const { startDate, endDate } = args;
        const params: any = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return {
          url: `/timelogs/summary`,
          params,
        };
      },
      providesTags: [tagTypes.timelogs],
    }),
  }),
});

export const {
  useGetAllTimeLogsQuery,
  useGetTimelogsByRepIdQuery,
  useGetTimelogsSummaryQuery
} = timelogsApi;
