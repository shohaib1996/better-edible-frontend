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
      providesTags: (result, error, id) => [{ type: tagTypes.reps, id }],
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
    resetPassword: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/reps/${id}/reset-password`,
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.reps],
    }),
    resetPin: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/reps/${id}/reset-pin`,
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.reps],
    }),
    // Kiosk clock — single toggle via fob or PIN
    kioskClock: builder.mutation({
      query: (body: { pin?: string; fobId?: string }) => ({
        url: "/reps/kiosk-clock",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.reps],
    }),
    // Assign or remove a fob from a rep
    assignFob: builder.mutation({
      query: ({ id, fobId }: { id: string; fobId: string | null }) => ({
        url: `/reps/${id}/assign-fob`,
        method: "POST",
        body: { fobId },
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
  useResetPasswordMutation,
  useResetPinMutation,
  useKioskClockMutation,
  useAssignFobMutation,
} = repApi;
