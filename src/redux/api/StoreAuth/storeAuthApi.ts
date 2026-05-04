import { baseApi } from "../baseApi";
import { ILoginResponse, IStoreUser } from "@/types/storeAuth/storeAuth";

export const storeAuthApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    loginStore: builder.mutation<ILoginResponse, { email: string; password: string }>({
      query: (body) => ({
        url: "/store-auth/login",
        method: "POST",
        body,
      }),
    }),
    sendMagicLink: builder.mutation<{ success: boolean; message: string }, { email: string }>({
      query: (body) => ({
        url: "/store-auth/magic-link",
        method: "POST",
        body,
      }),
    }),
    verifyMagicLink: builder.mutation<ILoginResponse, { token: string }>({
      query: ({ token }) => ({
        url: `/store-auth/magic-link/${token}`,
        method: "GET",
      }),
    }),
    changePassword: builder.mutation<
      { success: boolean; message: string },
      { contactId: string; currentPassword: string; newPassword: string }
    >({
      query: (body) => ({
        url: "/store-auth/change-password",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useLoginStoreMutation,
  useSendMagicLinkMutation,
  useVerifyMagicLinkMutation,
  useChangePasswordMutation,
} = storeAuthApi;
