import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";
import type { IStoreOrder } from "@/types/privateLabel/gummyBuilder";

interface IPlaceOrderPayload {
  storeId: string;
  items: { labelId: string; quantity: number }[];
  expectedDeliveryDate?: string;
}

export const storeOrderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/store/orders?storeId=
    getMyOrders: builder.query<{ orders: IStoreOrder[] }, string>({
      query: (storeId) => ({
        url: "/store/orders",
        params: { storeId },
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
