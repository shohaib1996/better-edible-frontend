// src/redux/api/Contacts/contactsApi.ts
import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";

export const contactsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // 🟩 Get all contacts (optional storeId filter)
    getAllContacts: builder.query({
      query: (storeId?: string) =>
        storeId ? `/contacts?storeId=${storeId}` : "/contacts",
      providesTags: [tagTypes.contacts],
    }),

    // 🟦 Get contact by ID
    getContactById: builder.query({
      query: (id: string) => `/contacts/${id}`,
      providesTags: [tagTypes.contacts],
    }),

    // 🟨 Create contact (single or bulk)
    createContact: builder.mutation({
      query: (body) => ({
        url: "/contacts",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.contacts],
    }),

    // 🟧 Update contact
    updateContact: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/contacts/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: [tagTypes.contacts],
    }),

    // 🟥 Delete contact
    deleteContact: builder.mutation({
      query: (id: string) => ({
        url: `/contacts/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [tagTypes.contacts],
    }),
  }),
});

export const {
  useGetAllContactsQuery,
  useGetContactByIdQuery,
  useCreateContactMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
} = contactsApi;
