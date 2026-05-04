import { baseApi } from "../baseApi";
import { tagTypes } from "@/redux/tagTypes/tagTypes";
import type {
  IDesignRequest,
  IDesignRequestResponse,
  IDesignRequestsResponse,
  IGetDesignRequestsParams,
  ISubmitDesignRequestBody,
  IPostCommentBody,
  IRequestRevisionBody,
} from "@/types/designRequests/designRequests";

export const designRequestsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    submitDesignRequest: builder.mutation<IDesignRequestResponse, ISubmitDesignRequestBody>({
      query: (body) => ({ url: "/design-requests", method: "POST", body }),
      invalidatesTags: [tagTypes.designRequests],
    }),

    getDesignRequests: builder.query<IDesignRequestsResponse, IGetDesignRequestsParams | void>({
      query: (params) => ({ url: "/design-requests", params: params ?? {} }),
      providesTags: [tagTypes.designRequests],
    }),

    getMyDesignRequests: builder.query<{ success: boolean; requests: IDesignRequest[] }, { contactId: string }>({
      query: (params) => ({ url: "/design-requests/mine", params }),
      providesTags: [tagTypes.designRequests],
    }),

    getDesignRequestById: builder.query<IDesignRequestResponse, string>({
      query: (id) => ({ url: `/design-requests/${id}` }),
      providesTags: [tagTypes.designRequests],
    }),

    updateRequestStatus: builder.mutation<IDesignRequestResponse, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/design-requests/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: [tagTypes.designRequests],
    }),

    uploadRequestFiles: builder.mutation<{ success: boolean; uploadedFiles: IDesignRequest["uploadedFiles"] }, { id: string; files: FormData }>({
      query: ({ id, files }) => ({
        url: `/design-requests/${id}/upload-files`,
        method: "POST",
        body: files,
      }),
      invalidatesTags: [tagTypes.designRequests],
    }),

    uploadCompletedFiles: builder.mutation<{ success: boolean; completedFiles: IDesignRequest["completedFiles"] }, { id: string; files: FormData }>({
      query: ({ id, files }) => ({
        url: `/design-requests/${id}/completed-files`,
        method: "POST",
        body: files,
      }),
      invalidatesTags: [tagTypes.designRequests],
    }),

    sendFilesToStore: builder.mutation<IDesignRequestResponse, { id: string; fileIds: string[] }>({
      query: ({ id, fileIds }) => ({
        url: `/design-requests/${id}/send-files`,
        method: "POST",
        body: { fileIds },
      }),
      invalidatesTags: [tagTypes.designRequests],
    }),

    postComment: builder.mutation<{ success: boolean; comments: IDesignRequest["comments"] }, { id: string; body: IPostCommentBody }>({
      query: ({ id, body }) => ({
        url: `/design-requests/${id}/comments`,
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.designRequests],
    }),

    requestRevision: builder.mutation<IDesignRequestResponse, { id: string; body: IRequestRevisionBody }>({
      query: ({ id, body }) => ({
        url: `/design-requests/${id}/request-revision`,
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.designRequests],
    }),
  }),
});

export const {
  useSubmitDesignRequestMutation,
  useGetDesignRequestsQuery,
  useGetMyDesignRequestsQuery,
  useGetDesignRequestByIdQuery,
  useUpdateRequestStatusMutation,
  useUploadRequestFilesMutation,
  useUploadCompletedFilesMutation,
  useSendFilesToStoreMutation,
  usePostCommentMutation,
  useRequestRevisionMutation,
} = designRequestsApi;
