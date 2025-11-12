import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";

export const samplesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createSample: builder.mutation({
      query: (body) => ({
        url: "/samples",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.samples],
    }),
    getAllSamples: builder.query({
      query: (arg) => ({
        url: "/samples",
        params: arg,
      }),
      providesTags: [tagTypes.samples],
    }),
    getSampleById: builder.query({
      query: (id) => `/samples/${id}`,
      providesTags: [tagTypes.samples],
    }),
    updateSampleStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/samples/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: [tagTypes.samples],
    }),
    deleteSample: builder.mutation({
      query: (id) => ({
        url: `/samples/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [tagTypes.samples],
    }),
  }),
});

export const {
  useCreateSampleMutation,
  useGetAllSamplesQuery,
  useGetSampleByIdQuery,
  useUpdateSampleStatusMutation,
  useDeleteSampleMutation,
} = samplesApi;
