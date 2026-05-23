import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";
import type { IGummyPool } from "@/types/privateLabel/gummyBuilder";

export const poolApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/pools/:cannabinoidKey — store view, open pools only
    getPool: builder.query<{ pool: IGummyPool | null }, string>({
      query: (cannabinoidKey) => `/pools/${cannabinoidKey}`,
      providesTags: [tagTypes.storePools],
    }),
  }),
});

export const {
  useGetPoolQuery,
} = poolApi;
