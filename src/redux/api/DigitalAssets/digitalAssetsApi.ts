import { baseApi } from "../baseApi";
import {
  IDigitalAsset,
  IDigitalAssetResponse,
  IDigitalAssetsResponse,
  IGetDigitalAssetsParams,
} from "@/types/digitalAssets/digitalAssets";
import { tagTypes } from "@/redux/tagTypes/tagTypes";

export const digitalAssetsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDigitalAssets: builder.query<IDigitalAssetsResponse, IGetDigitalAssetsParams | void>({
      query: (params) => ({
        url: "/digital-assets",
        params: params ?? {},
      }),
      providesTags: [tagTypes.digitalAssets],
    }),

    getDigitalAssetById: builder.query<IDigitalAssetResponse, string>({
      query: (id) => ({ url: `/digital-assets/${id}` }),
      providesTags: [tagTypes.digitalAssets],
    }),

    createDigitalAsset: builder.mutation<IDigitalAssetResponse, FormData>({
      query: (body) => ({
        url: "/digital-assets",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.digitalAssets],
    }),

    updateDigitalAsset: builder.mutation<IDigitalAssetResponse, { id: string; body: FormData | Partial<IDigitalAsset> }>({
      query: ({ id, body }) => ({
        url: `/digital-assets/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [tagTypes.digitalAssets],
    }),

    deleteDigitalAsset: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/digital-assets/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [tagTypes.digitalAssets],
    }),
  }),
});

export const {
  useGetDigitalAssetsQuery,
  useGetDigitalAssetByIdQuery,
  useCreateDigitalAssetMutation,
  useUpdateDigitalAssetMutation,
  useDeleteDigitalAssetMutation,
} = digitalAssetsApi;
