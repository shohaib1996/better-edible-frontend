import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";

interface IGetCreditBalanceResponse {
  success: boolean;
  balance: number;
}

interface IApplyCreditPayload {
  storeId: string;
  orderTotal: number;
  orderRef?: string;
}

interface IApplyCreditResponse {
  success: boolean;
  newBalance: number;
  applied: number;
}

export const storeCreditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStoreCreditBalance: builder.query<IGetCreditBalanceResponse, string>({
      query: (storeId) => ({
        url: "/store/promotions/credits",
        params: { storeId },
      }),
      providesTags: (_r, _e, storeId) => [{ type: tagTypes.storeCredit as never, id: storeId }],
    }),

    applyStoreCredit: builder.mutation<IApplyCreditResponse, IApplyCreditPayload>({
      query: ({ storeId, ...body }) => ({
        url: `/store/promotions/credits/${storeId}/apply`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { storeId }) => [
        { type: tagTypes.storeCredit as never, id: storeId },
      ],
    }),
  }),
});

export const { useGetStoreCreditBalanceQuery, useApplyStoreCreditMutation } = storeCreditApi;
