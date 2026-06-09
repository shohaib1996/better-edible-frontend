import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";
import type { IStoreOrder } from "@/types/privateLabel/gummyBuilder";
import type { IPagination } from "./storeLabelApi";

interface IPlaceOrderPayload {
  storeId: string;
  items: { labelId: string; quantity: number }[];
  deliveryDate?: string;
}

interface IGetMyOrdersParams {
  storeId: string;
  statusGroup?: "ongoing" | "completed";
  page?: number;
  limit?: number;
}

interface IGetMyOrdersResponse {
  orders: IStoreOrder[];
  pagination?: IPagination;
}

export const storeOrderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/store/orders?storeId=&page=&limit=
    getMyOrders: builder.query<IGetMyOrdersResponse, IGetMyOrdersParams>({
      query: ({ storeId, statusGroup, page, limit }) => ({
        url: "/store/orders",
        params: {
          storeId,
          ...(statusGroup !== undefined && { statusGroup }),
          ...(page !== undefined && { page }),
          ...(limit !== undefined && { limit }),
        },
      }),
      providesTags: [tagTypes.storeOrders],
    }),

    // POST /api/store/orders
    placeOrder: builder.mutation<{ message: string; order: IStoreOrder }, IPlaceOrderPayload>({
      query: (body) => ({
        url: "/store/orders",
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.storeOrders],
    }),
  }),
});

export const {
  useGetMyOrdersQuery,
  usePlaceOrderMutation,
} = storeOrderApi;
