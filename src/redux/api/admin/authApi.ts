import { baseApi } from "../baseApi";

export const adminAuthApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    registerAdmin: builder.mutation({
      query: (body) => ({
        url: "/admin/register",
        method: "POST",
        body,
      }),
    }),
    loginAdmin: builder.mutation({
      query: (body) => ({
        url: "/admin/login",
        method: "POST",
        body,
      }),
    }),
    logoutAdmin: builder.mutation({
      query: () => ({
        url: "/admin/logout",
        method: "POST",
      }),
    }),
  }),
});

export const { useRegisterAdminMutation, useLoginAdminMutation, useLogoutAdminMutation } = adminAuthApi;
