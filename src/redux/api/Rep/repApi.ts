import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";

export const repApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllReps: builder.query({
      query: () => "/reps",
      providesTags: [tagTypes.reps],
    }),
    getRepById: builder.query({
      query: (id) => `/reps/${id}`,
      providesTags: [tagTypes.reps],
    }),
    updateRep: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/reps/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [tagTypes.reps],
    }),
    deleteRep: builder.mutation({
      query: (id) => ({
        url: `/reps/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [tagTypes.reps],
    }),
    checkInRep: builder.mutation({
      query: (body) => ({
        url: "/reps/checkin",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.reps],
    }),
    checkOutRep: builder.mutation({
      query: (body) => ({
        url: "/reps/checkout",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.reps],
    }),
  }),
});

export const {
  useGetAllRepsQuery,
  useGetRepByIdQuery,
  useUpdateRepMutation,
  useDeleteRepMutation,
  useCheckInRepMutation,
  useCheckOutRepMutation,
} = repApi;
