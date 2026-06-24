import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";
import type { IPromotion, IPromotionUsage, IValidatePromoResult } from "@/types/promotions/promotions";

interface Paginated { totalCount: number; totalPages: number; currentPage: number; }

export const promotionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    // ── Admin: list all promotions ──────────────────────────────────────────
    getAdminPromotions: builder.query<
      { success: boolean; promotions: IPromotion[] } & Paginated,
      { page?: number; limit?: number; status?: string }
    >({
      query: ({ page = 1, limit = 20, status } = {}) => ({
        url: "/admin/promotions",
        params: { page, limit, ...(status ? { status } : {}) },
      }),
      providesTags: [{ type: tagTypes.promotions as never, id: "ADMIN_LIST" }],
    }),

    // ── Admin: single promotion ─────────────────────────────────────────────
    getAdminPromotion: builder.query<{ success: boolean; promotion: IPromotion }, string>({
      query: (id) => `/admin/promotions/${id}`,
      providesTags: (_r, _e, id) => [{ type: tagTypes.promotions as never, id }],
    }),

    // ── Admin: create ───────────────────────────────────────────────────────
    createPromotion: builder.mutation<{ success: boolean; promotion: IPromotion }, Partial<IPromotion>>({
      query: (body) => ({ url: "/admin/promotions", method: "POST", body }),
      invalidatesTags: [
        { type: tagTypes.promotions as never, id: "ADMIN_LIST" },
        { type: tagTypes.promotions as never, id: "PUBLIC" },
      ],
    }),

    // ── Admin: update ───────────────────────────────────────────────────────
    updatePromotion: builder.mutation<
      { success: boolean; promotion: IPromotion },
      { id: string } & Partial<IPromotion>
    >({
      query: ({ id, ...body }) => ({ url: `/admin/promotions/${id}`, method: "PUT", body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: tagTypes.promotions as never, id: "ADMIN_LIST" },
        { type: tagTypes.promotions as never, id },
        { type: tagTypes.promotions as never, id: "PUBLIC" },
      ],
    }),

    // ── Admin: delete ───────────────────────────────────────────────────────
    deletePromotion: builder.mutation<{ success: boolean }, { id: string }>({
      query: ({ id }) => ({ url: `/admin/promotions/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: tagTypes.promotions as never, id: "ADMIN_LIST" }],
    }),

    // ── Admin: usage stats for a promotion ─────────────────────────────────
    getPromotionUsage: builder.query<
      { success: boolean; promotion: Pick<IPromotion, "_id" | "name" | "usedCount">; usages: IPromotionUsage[]; totalCount: number; totalPages: number; currentPage: number; totalDiscount: number },
      { id: string; page?: number; limit?: number }
    >({
      query: ({ id, page = 1, limit = 20 }) => `/admin/promotions/${id}/usage?page=${page}&limit=${limit}`,
      providesTags: (_r, _e, { id }) => [{ type: tagTypes.promotionUsage as never, id }],
    }),

    // ── Admin: apply promo to existing order ────────────────────────────────
    applyPromoToOrder: builder.mutation<
      { success: boolean; discount: number; order: unknown },
      { promotionId?: string; code?: string; storeId: string; orderId: string }
    >({
      query: (body) => ({ url: "/admin/promotions/apply", method: "POST", body }),
      invalidatesTags: [{ type: tagTypes.orders as never, id: "LIST" }],
    }),

    // ── Store / public: available promotions ────────────────────────────────
    getPublicPromotions: builder.query<{ success: boolean; promotions: IPromotion[] }, { storeId?: string }>({
      query: ({ storeId } = {}) => ({
        url: "/promotions/public",
        params: storeId ? { storeId } : {},
      }),
      providesTags: [{ type: tagTypes.promotions as never, id: "PUBLIC" }],
    }),

    // ── Store: all promos visible to a specific store (public + personal) ───
    getStorePromotions: builder.query<{ success: boolean; promotions: IPromotion[] }, { storeId: string }>({
      query: ({ storeId }) => ({ url: "/promotions/for-store", params: { storeId } }),
      providesTags: (_r, _e, { storeId }) => [{ type: tagTypes.promotions as never, id: `STORE_${storeId}` }],
    }),

    // ── Store: validate promo code ──────────────────────────────────────────
    validatePromoCode: builder.mutation<
      { success: boolean } & IValidatePromoResult,
      { code: string; storeId: string; orderTotal: number }
    >({
      query: (body) => ({ url: "/promotions/validate", method: "POST", body }),
    }),

    // ── Store: auto-apply check ─────────────────────────────────────────────
    getAutoApplyPromotion: builder.query<
      { success: boolean; promotion: IPromotion | null; discount: number },
      { storeId: string; orderTotal: number }
    >({
      query: ({ storeId, orderTotal }) => `/promotions/auto-apply?storeId=${storeId}&orderTotal=${orderTotal}`,
    }),

    // ── Store: usage history ────────────────────────────────────────────────
    getStorePromoUsage: builder.query<
      { success: boolean; usages: IPromotionUsage[] } & Paginated,
      { storeId: string; page?: number; limit?: number }
    >({
      query: ({ storeId, page = 1, limit = 20 }) =>
        `/promotions/usage?storeId=${storeId}&page=${page}&limit=${limit}`,
      providesTags: (_r, _e, { storeId }) => [{ type: tagTypes.promotionUsage as never, id: storeId }],
    }),
  }),
});

export const {
  useGetAdminPromotionsQuery,
  useGetAdminPromotionQuery,
  useCreatePromotionMutation,
  useUpdatePromotionMutation,
  useDeletePromotionMutation,
  useGetPromotionUsageQuery,
  useApplyPromoToOrderMutation,
  useGetPublicPromotionsQuery,
  useGetStorePromotionsQuery,
  useValidatePromoCodeMutation,
  useGetAutoApplyPromotionQuery,
  useGetStorePromoUsageQuery,
} = promotionsApi;
