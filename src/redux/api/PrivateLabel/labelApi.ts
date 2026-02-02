import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";
import {
  ILabel,
  IGetLabelsResponse,
  IGetLabelsParams,
  IUpdateLabelStageRequest,
  IBulkUpdateStagesRequest,
} from "@/types";

// ─────────────────────────────
// API SLICE
// ─────────────────────────────

export const labelApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ============================================
    // LABELS (7-STAGE PIPELINE)
    // ============================================

    // Get all labels with filters
    getAllLabels: builder.query<IGetLabelsResponse, IGetLabelsParams>({
      query: (params) => ({
        url: "/labels",
        params,
      }),
      providesTags: [tagTypes.labels],
    }),

    // Get single label by ID
    getLabelById: builder.query<ILabel, string>({
      query: (id) => `/labels/${id}`,
      providesTags: [tagTypes.labels],
    }),

    // Get approved labels for a client (for order creation)
    getApprovedLabelsByClient: builder.query<ILabel[], string>({
      query: (clientId) => `/labels/client/${clientId}/approved`,
      providesTags: [tagTypes.labels],
    }),

    // Create label (FormData for image upload)
    createLabel: builder.mutation<{ message: string; label: ILabel }, FormData>({
      query: (formData) => ({
        url: "/labels",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: [tagTypes.labels, tagTypes.privateLabelClients],
    }),

    // Update label (FormData for image upload)
    updateLabel: builder.mutation<
      { message: string; label: ILabel },
      { id: string; formData: FormData }
    >({
      query: ({ id, formData }) => ({
        url: `/labels/${id}`,
        method: "PATCH",
        body: formData,
      }),
      invalidatesTags: [tagTypes.labels],
    }),

    // Update single label stage
    updateLabelStage: builder.mutation<
      { message: string; label: ILabel },
      IUpdateLabelStageRequest
    >({
      query: ({ id, stage, notes, userId, userType }) => ({
        url: `/labels/${id}/stage`,
        method: "PATCH",
        body: { stage, notes, userId, userType },
      }),
      invalidatesTags: [tagTypes.labels, tagTypes.privateLabelClients],
    }),

    // Bulk update all client labels to a stage (labels treated as GROUP)
    bulkUpdateLabelStages: builder.mutation<
      { message: string; updatedCount: number },
      IBulkUpdateStagesRequest
    >({
      query: ({ clientId, stage, notes, userId, userType }) => ({
        url: "/labels/bulk/stage",
        method: "PATCH",
        body: { clientId, stage, notes, userId, userType },
      }),
      invalidatesTags: [tagTypes.labels, tagTypes.privateLabelClients],
    }),

    // Delete label
    deleteLabel: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/labels/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [tagTypes.labels, tagTypes.privateLabelClients],
    }),
  }),
});

// ─────────────────────────────
// EXPORT HOOKS
// ─────────────────────────────

export const {
  useGetAllLabelsQuery,
  useGetLabelByIdQuery,
  useGetApprovedLabelsByClientQuery,
  useCreateLabelMutation,
  useUpdateLabelMutation,
  useUpdateLabelStageMutation,
  useBulkUpdateLabelStagesMutation,
  useDeleteLabelMutation,
} = labelApi;
