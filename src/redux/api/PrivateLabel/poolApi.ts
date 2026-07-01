import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";
import type { IGummyPool } from "@/types/privateLabel/gummyBuilder";

export interface IOpenPool {
  cannabinoidKey: string;
  ratioLabel: string;
  totalUnits: number;
  requiredUnits: number;
  unitsRemaining: number;
  percent: number;
  storeCount: number;
  status: string;
}

export const poolApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/pools/:cannabinoidKey — store view, open pools only
    getPool: builder.query<{ pool: IGummyPool | null }, string>({
      query: (cannabinoidKey) => `/pools/${cannabinoidKey}`,
      providesTags: [tagTypes.storePools],
    }),

    // GET /api/pools/public/open — dashboard widget
    getOpenPools: builder.query<{ pools: IOpenPool[] }, void>({
      query: () => "/pools/public/open",
      providesTags: [tagTypes.storePools],
    }),
  }),
});

export const {
  useGetPoolQuery,
  useGetOpenPoolsQuery,
} = poolApi;
