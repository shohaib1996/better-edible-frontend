import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";

export interface IChain {
  id: string;
  name: string;
  logo: string | null;
  notes: string | null;
  buyingMode: "central" | "hybrid" | "independent";
  chainRep: string | null;
  buyerName: string | null;
  buyerEmail: string | null;
  buyerPhone: string | null;
  billingContact: string | null;
  loginEmail: string | null;
  hasLogin: boolean;
  active: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface IChainStoreRow {
  id: string;
  storeId: string | null;
  name: string;
  city: string | null;
  orderCount: number;
  lastOrderAt: string | null;
  totalPurchase: number;
  dueAmount: number;
}

export interface IChainRollup {
  success: boolean;
  chainId: string;
  chainName: string;
  storeCount: number;
  totalOrders: number;
  totalPurchase: number;
  totalDue: number;
  stores: IChainStoreRow[];
}

interface IChainPayload {
  name: string;
  buyingMode: "central" | "hybrid" | "independent";
  notes?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  billingContact?: string;
}

export const chainsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllChains: builder.query<{ success: boolean; chains: IChain[]; total: number }, void>({
      query: () => "/chains",
      providesTags: [tagTypes.chains as never],
    }),

    getChainRollup: builder.query<IChainRollup, string>({
      query: (id) => `/chains/${id}/rollup`,
      providesTags: (_r, _e, id) => [{ type: tagTypes.chains as never, id }],
    }),

    createChain: builder.mutation<{ success: boolean; chain: IChain }, IChainPayload>({
      query: (body) => ({ url: "/chains", method: "POST", body }),
      invalidatesTags: [tagTypes.chains as never],
    }),

    updateChain: builder.mutation<{ success: boolean; chain: IChain }, { id: string } & Partial<IChainPayload>>({
      query: ({ id, ...body }) => ({ url: `/chains/${id}`, method: "PUT", body }),
      invalidatesTags: [tagTypes.chains as never],
    }),

    updateChainStores: builder.mutation<{ success: boolean; chain: IChain }, { id: string; storeIds: string[] }>({
      query: ({ id, storeIds }) => ({ url: `/chains/${id}/stores`, method: "PUT", body: { storeIds } }),
      invalidatesTags: [tagTypes.chains as never],
    }),

    updateChainCredentials: builder.mutation<
      { success: boolean; message: string; loginEmail?: string; hasLogin: boolean },
      { id: string; clear?: true } | { id: string; loginEmail: string; password?: string }
    >({
      query: ({ id, ...body }) => ({ url: `/chains/${id}/credentials`, method: "PUT", body }),
      invalidatesTags: [tagTypes.chains as never],
    }),

    deleteChain: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/chains/${id}`, method: "DELETE" }),
      invalidatesTags: [tagTypes.chains as never],
    }),
  }),
});

export const {
  useGetAllChainsQuery,
  useGetChainRollupQuery,
  useCreateChainMutation,
  useUpdateChainMutation,
  useUpdateChainStoresMutation,
  useUpdateChainCredentialsMutation,
  useDeleteChainMutation,
} = chainsApi;
