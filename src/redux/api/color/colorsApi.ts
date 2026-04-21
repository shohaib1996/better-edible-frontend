import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";
import type {
  IProductColor,
  ICreateColorRequest,
  IUpdateColorRequest,
} from "@/types/privateLabel/pps";

export const colorsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getColors: builder.query<
      { success: boolean; total: number; colors: IProductColor[] },
      { isActive?: boolean } | void
    >({
      query: (params) => ({
        url: "/colors",
        params: params?.isActive !== undefined ? { isActive: String(params.isActive) } : {},
      }),
      providesTags: [tagTypes.colorLibrary],
    }),

    createColor: builder.mutation<
      { success: boolean; color: IProductColor },
      ICreateColorRequest
    >({
      query: (body) => ({
        url: "/colors",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.colorLibrary],
    }),

    toggleColor: builder.mutation<
      { success: boolean; color: IProductColor },
      string
    >({
      query: (colorId) => ({
        url: `/colors/${colorId}/toggle`,
        method: "PATCH",
      }),
      invalidatesTags: [tagTypes.colorLibrary],
    }),

    updateColor: builder.mutation<
      { success: boolean; color: IProductColor },
      { colorId: string } & IUpdateColorRequest
    >({
      query: ({ colorId, ...body }) => ({
        url: `/colors/${colorId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [tagTypes.colorLibrary],
    }),

    deleteColor: builder.mutation<
      { success: boolean; message: string },
      string
    >({
      query: (colorId) => ({
        url: `/colors/${colorId}`,
        method: "DELETE",
      }),
      invalidatesTags: [tagTypes.colorLibrary],
    }),
  }),
});

export const {
  useGetColorsQuery,
  useCreateColorMutation,
  useToggleColorMutation,
  useUpdateColorMutation,
  useDeleteColorMutation,
} = colorsApi;
