import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";
import type { IStoreDraftLabel } from "@/types/privateLabel/gummyBuilder";
import type { LabelStage } from "@/types/privateLabel/label";

export interface IStoreSubmission {
  storeId: string;
  storeName: string;
  clientId: string;
  city: string;
  state: string;
  logo: { url?: string; status?: "uploaded" | "pending_email" | "use_existing" } | null;
  rep: { name: string; email: string } | null;
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

    getClientSubmissions: builder.query<{ submissions: IStoreSubmission[] }, string>({
      query: (clientId) => `/store/submissions?clientId=${clientId}`,
      providesTags: [tagTypes.storeSubmissions],
    }),

    advanceLabelStage: builder.mutation<{ success: boolean; label: IStoreDraftLabel }, { labelId: string; stage: LabelStage }>({
      query: ({ labelId, stage }) => ({
        url: `/store/submissions/${labelId}/stage`,
        method: "PATCH",
        body: { stage },
      }),
      invalidatesTags: [tagTypes.storeSubmissions],
    }),
  }),
});

export const { useGetStoreSubmissionsQuery, useGetClientSubmissionsQuery, useAdvanceLabelStageMutation } = storeSubmissionsApi;
