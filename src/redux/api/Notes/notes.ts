import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";

export const notesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get all notes for a store with pagination
    getAllNotes: builder.query({
      query: (args) => {
        const params = new URLSearchParams();

        // Handle both string (just entityId) and object (with pagination) inputs
        const isString = typeof args === "string";
        const entityId = isString ? args : args?.entityId;
        const page = !isString && args?.page ? args.page : undefined;
        const limit = !isString && args?.limit ? args.limit : undefined;
        const repId = !isString && args?.repId ? args.repId : undefined;
        const date = !isString && args?.date ? args.date : undefined;

        if (entityId) params.append("entityId", entityId);
        if (page) params.append("page", page.toString());
        if (limit) params.append("limit", limit.toString());
        if (repId) params.append("repId", repId.toString());
        if (date) params.append("date", date.toString());

        return `/notes?${params.toString()}`;
      },
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

    updateNote: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/notes/${id}`,
        method: "PUT",
        body: data,
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
  useUpdateNoteMutation,
  useDeleteNoteMutation,
} = notesApi;
