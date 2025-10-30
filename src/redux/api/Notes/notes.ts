import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";

export const notesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all notes for a store
    getAllNotes: builder.query({
      query: (entityId: string) => `/notes?entityId=${entityId}`,
      providesTags: [tagTypes.notes],
    }),

    getNoteById: builder.query({
      query: (id) => `/notes/${id}`,
      providesTags: [tagTypes.notes],
    }),

    createNote: builder.mutation({
      query: (body) => ({
        url: "/notes",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.notes],
    }),

    deleteNote: builder.mutation({
      query: (id) => ({
        url: `/notes/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [tagTypes.notes],
    }),
  }),
});

export const {
  useGetAllNotesQuery,
  useGetNoteByIdQuery,
  useCreateNoteMutation,
  useDeleteNoteMutation,
} = notesApi;
