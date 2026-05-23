import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";
import type { IStoreDraftLabel } from "@/types/privateLabel/gummyBuilder";

export interface IStoreSubmission {
  storeId: string;
  storeName: string;
  clientId: string;
  city: string;
  state: string;
  labels: IStoreDraftLabel[];
  totalValue: number;
  earliestSubmission: string;
}

export const storeSubmissionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getStoreSubmissions: builder.query<{ submissions: IStoreSubmission[] }, void>({
      query: () => "/store/submissions",
      providesTags: [tagTypes.storeSubmissions],
    }),
  }),
});

export const { useGetStoreSubmissionsQuery } = storeSubmissionsApi;
