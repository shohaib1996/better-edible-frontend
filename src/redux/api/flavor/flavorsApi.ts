import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";
import type {
  IFlavor,
  ICreateFlavorRequest,
  IFindOrCreateBlendRequest,
  IUpdateFlavorRequest,
} from "@/types/privateLabel/pps";

export const flavorsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getFlavors: builder.query<
      { success: boolean; total: number; flavors: IFlavor[] },
      { isActive?: boolean; isBlend?: boolean } | void
    >({
      query: (params) => ({
        url: "/flavors",
        params: params
          ? {
              ...(params.isActive !== undefined && { isActive: String(params.isActive) }),
              ...(params.isBlend !== undefined && { isBlend: String(params.isBlend) }),
            }
          : {},
      }),
      providesTags: [tagTypes.flavorLibrary],
    }),

    createFlavor: builder.mutation<
      { success: boolean; flavor: IFlavor },
      ICreateFlavorRequest
    >({
      query: (body) => ({
        url: "/flavors",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.flavorLibrary],
    }),

    findOrCreateBlend: builder.mutation<
      { success: boolean; created: boolean; flavor: IFlavor },
      IFindOrCreateBlendRequest
    >({
      query: (body) => ({
        url: "/flavors/blend",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.flavorLibrary],
    }),

    toggleFlavor: builder.mutation<
      { success: boolean; flavor: IFlavor },
      string
    >({
      query: (flavorId) => ({
        url: `/flavors/${flavorId}/toggle`,
        method: "PATCH",
      }),
      invalidatesTags: [tagTypes.flavorLibrary],
    }),

    updateFlavor: builder.mutation<
      { success: boolean; flavor: IFlavor },
      { flavorId: string } & IUpdateFlavorRequest
    >({
      query: ({ flavorId, ...body }) => ({
        url: `/flavors/${flavorId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [tagTypes.flavorLibrary],
    }),
  }),
});

export const {
  useGetFlavorsQuery,
  useCreateFlavorMutation,
  useFindOrCreateBlendMutation,
  useToggleFlavorMutation,
  useUpdateFlavorMutation,
} = flavorsApi;
