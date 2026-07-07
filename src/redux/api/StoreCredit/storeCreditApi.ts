import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";

export interface ICreditTransaction {
  type: "earned" | "applied" | "manual";
  amount: number;
  ref?: string;
  note?: string;
  addedBy?: string;
  createdAt: string;
}

interface IGetCreditBalanceResponse {
  success: boolean;
  balance: number;
}

interface IGetCreditLedgerResponse {
  success: boolean;
  balance: number;
  transactions: ICreditTransaction[];
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

interface IAddCreditPayload {
  storeId: string;
  amount: number;
  note?: string;
  addedBy?: string;
}

interface IAddCreditResponse {
  success: boolean;
  newBalance: number;
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

    getStoreCreditLedger: builder.query<IGetCreditLedgerResponse, string>({
      query: (storeId) => `/store/promotions/credits/${storeId}/ledger`,
      providesTags: (_r, _e, storeId) => [{ type: tagTypes.storeCredit as never, id: storeId }],
    }),

    addStoreCredit: builder.mutation<IAddCreditResponse, IAddCreditPayload>({
      query: ({ storeId, ...body }) => ({
        url: `/store/promotions/credits/${storeId}/add`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_r, _e, { storeId }) => [
        { type: tagTypes.storeCredit as never, id: storeId },
      ],
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

export const {
  useGetStoreCreditBalanceQuery,
  useGetStoreCreditLedgerQuery,
  useAddStoreCreditMutation,
  useApplyStoreCreditMutation,
} = storeCreditApi;
