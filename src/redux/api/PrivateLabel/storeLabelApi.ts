import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";
import type {
  IStoreDraftLabel,
  ICreateDraftLabelPayload,
  IUpdateDraftLabelPayload,
  ISubmitLinePayload,
} from "@/types/privateLabel/gummyBuilder";

export interface IPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

interface IGetMyLabelsParams {
  storeId: string;
  status?: "draft" | "submitted";
  page?: number;
  limit?: number;
}

interface IGetMyLabelsResponse {
  labels: IStoreDraftLabel[];
  clientStatus: string | null;
  clientId?: string;
  pagination?: IPagination;
}

export const storeLabelApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/store/labels?storeId=&status=&page=&limit=
    getMyLabels: builder.query<IGetMyLabelsResponse, IGetMyLabelsParams>({
      query: ({ storeId, status, page, limit }) => ({
        url: "/store/labels",
        params: {
          storeId,
          ...(status !== undefined && { status }),
          ...(page !== undefined && { page }),
          ...(limit !== undefined && { limit }),
        },
      }),
      providesTags: [tagTypes.storeLabels],
    }),

    // POST /api/store/labels
    createDraftLabel: builder.mutation<{ message: string; label: IStoreDraftLabel }, ICreateDraftLabelPayload>({
      query: (body) => ({
        url: "/store/labels",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.storeLabels],
    }),

    // PUT /api/store/labels/:id
    updateDraftLabel: builder.mutation<{ message: string; label: IStoreDraftLabel }, IUpdateDraftLabelPayload>({
      query: ({ id, ...body }) => ({
        url: `/store/labels/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [tagTypes.storeLabels],
    }),

    // DELETE /api/store/labels/:id
    deleteDraftLabel: builder.mutation<{ message: string }, { id: string; storeId: string }>({
      query: ({ id, storeId }) => ({
        url: `/store/labels/${id}`,
        method: "DELETE",
        params: { storeId },
      }),
      invalidatesTags: [tagTypes.storeLabels],
    }),

    // POST /api/store/labels/submit
    submitLine: builder.mutation<{ message: string; count: number }, ISubmitLinePayload>({
      query: (body) => ({
        url: "/store/labels/submit",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.storeLabels, tagTypes.storePools],
    }),
  }),
});

export const {
  useGetMyLabelsQuery,
  useCreateDraftLabelMutation,
  useUpdateDraftLabelMutation,
  useDeleteDraftLabelMutation,
  useSubmitLineMutation,
} = storeLabelApi;
