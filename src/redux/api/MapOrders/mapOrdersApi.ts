import { baseApi } from "../baseApi";

export interface IMapOrderItem {
  type: "order" | "sample";
  _id: string;
  orderNumber?: string;
  deliveryDate?: string;
  total?: number;
  description?: string;
  store: {
    _id: string;
    name: string;
    address?: string;
    city?: string;
    state?: string;
    lat: string;
    lng: string;
  };
  rep?: { _id: string; name: string };
}

export interface ICreateRouteItem {
  type: string;
  _id: number;
  storeId: string;
}

export const mapOrdersApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMapOrders: builder.query<
      { results: IMapOrderItem[]; total: number },
      { date: string; type?: "orders" | "samples" | "both" }
    >({
      query: ({ date, type = "both" }) => ({
        url: "/map-order",
        params: { date, type },
      }),
    }),

    createRouteFromMap: builder.mutation<
      { message: string; deliveries: any[]; routeDate: string },
      { repId: string; scheduledAt: string; items: ICreateRouteItem[] }
    >({
      query: (body) => ({
        url: "/map-orders/createRoute",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useGetMapOrdersQuery, useCreateRouteFromMapMutation } = mapOrdersApi;
