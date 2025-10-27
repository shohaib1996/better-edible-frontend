import { baseApi } from "../baseApi";

export const repAuthApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    registerRep: builder.mutation({
      query: (body) => ({
        url: "/auth/register",
        method: "POST",
        body,
      }),
    }),
    loginRep: builder.mutation({
      query: (body) => ({
        url: "/auth/login",
        method: "POST",
        body,
      }),
    }),
    logoutRep: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
    }),
  }),
});

export const { useRegisterRepMutation, useLoginRepMutation, useLogoutRepMutation } = repAuthApi;
