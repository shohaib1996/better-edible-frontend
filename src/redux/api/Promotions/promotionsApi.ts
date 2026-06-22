import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";
import type {
  IPromotionEnrollment,
  IPromotion,
  IStorePromotion,
  IPromotionCredit,
  IPromotionPaginationMeta,
} from "@/types/promotions/promotions";

type WithPagination<T> = { success: boolean } & T & IPromotionPaginationMeta;

export const promotionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Store: Enrollment ──────────────────────────────────────────────────────

    getPromotionStatus: builder.query<
      { success: boolean; enrollment: IPromotionEnrollment | null; status?: string },
      string
    >({
      query: (storeId) => ({ url: "/promotions/status", params: { storeId } }),
      providesTags: [tagTypes.promotionStatus],
    }),

    enrollInPromotions: builder.mutation<
      { success: boolean; enrollment: IPromotionEnrollment },
      { storeId: string }
    >({
      query: (body) => ({ url: "/promotions/enroll", method: "POST", body }),
      invalidatesTags: [tagTypes.promotionStatus],
    }),

    // ── Store: Available company promotions ────────────────────────────────────

    getAvailablePromotions: builder.query<
      WithPagination<{ promotions: IPromotion[] }>,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 20 }) => ({
        url: "/promotions/available",
        params: { page, limit },
      }),
      providesTags: [tagTypes.promotions],
    }),

    // ── Store: My promotions ───────────────────────────────────────────────────

    getMyPromotions: builder.query<
      WithPagination<{ storePromotions: IStorePromotion[] }>,
      { storeId: string; page?: number; limit?: number }
    >({
      query: ({ storeId, page = 1, limit = 20 }) => ({
        url: "/promotions/my",
        params: { storeId, page, limit },
      }),
      providesTags: [tagTypes.storePromotions],
    }),

    joinPromotion: builder.mutation<
      { success: boolean; storePromotion: IStorePromotion },
      { promotionId: string; storeId: string }
    >({
      query: ({ promotionId, storeId }) => ({
        url: `/promotions/join/${promotionId}`,
        method: "POST",
        body: { storeId },
      }),
      invalidatesTags: [tagTypes.storePromotions],
    }),

    createCustomPromotion: builder.mutation<
      { success: boolean; storePromotion: IStorePromotion },
      {
        storeId: string;
        name: string;
        productId: string;
        productName: string;
        creditRatePerUnit: number;
        startDate: string;
        endDate: string;
      }
    >({
      query: (body) => ({ url: "/promotions/custom", method: "POST", body }),
      invalidatesTags: [tagTypes.storePromotions],
    }),

    // ── Store: Sales log ───────────────────────────────────────────────────────

    logPromotionSales: builder.mutation<
      { success: boolean; storePromotion: IStorePromotion; creditsEarned: number },
      { storePromotionId: string; storeId: string; unitsSold: number; date: string }
    >({
      query: ({ storePromotionId, ...body }) => ({
        url: `/promotions/sales/${storePromotionId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.storePromotions, tagTypes.promotionCredits, tagTypes.promotionStatus],
    }),

    // ── Store: Credits ─────────────────────────────────────────────────────────

    getPromotionCredits: builder.query<
      WithPagination<{ credits: IPromotionCredit[]; creditBalance: number }>,
      { storeId: string; page?: number; limit?: number }
    >({
      query: ({ storeId, page = 1, limit = 20 }) => ({
        url: "/promotions/credits",
        params: { storeId, page, limit },
      }),
      providesTags: [tagTypes.promotionCredits],
    }),

    // ── Admin: Enrollments ─────────────────────────────────────────────────────

    getAllPromotionEnrollments: builder.query<
      WithPagination<{ enrollments: IPromotionEnrollment[] }>,
      { status?: string; page?: number; limit?: number } | void
    >({
      query: (params) => ({ url: "/admin/promotions/enrollments", params: params || {} }),
      providesTags: [tagTypes.promotionEnrollments],
    }),

    approvePromotionEnrollment: builder.mutation<
      { success: boolean; enrollment: IPromotionEnrollment },
      { storeId: string; notes?: string; approvedBy?: string }
    >({
      query: ({ storeId, ...body }) => ({
        url: `/admin/promotions/enrollments/${storeId}/approve`,
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.promotionEnrollments, tagTypes.promotionStatus],
    }),

    rejectPromotionEnrollment: builder.mutation<
      { success: boolean; enrollment: IPromotionEnrollment },
      { storeId: string; notes?: string }
    >({
      query: ({ storeId, ...body }) => ({
        url: `/admin/promotions/enrollments/${storeId}/reject`,
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.promotionEnrollments, tagTypes.promotionStatus],
    }),

    // ── Admin: Company promotions ──────────────────────────────────────────────

    getAdminPromotions: builder.query<
      WithPagination<{ promotions: IPromotion[] }>,
      { status?: string; page?: number; limit?: number } | void
    >({
      query: (params) => ({ url: "/admin/promotions", params: params || {} }),
      providesTags: [tagTypes.promotions],
    }),

    createPromotion: builder.mutation<
      { success: boolean; promotion: IPromotion },
      {
        name: string;
        description: string;
        productId: string;
        productName: string;
        sku: string;
        creditRatePerUnit: number;
        startDate: string;
        endDate: string;
        status?: "draft" | "active" | "expired";
        isPublic?: boolean;
      }
    >({
      query: (body) => ({ url: "/admin/promotions", method: "POST", body }),
      invalidatesTags: [tagTypes.promotions],
    }),

    updatePromotion: builder.mutation<
      { success: boolean; promotion: IPromotion },
      { id: string } & Partial<{
        name: string;
        description: string;
        productId: string;
        productName: string;
        sku: string;
        creditRatePerUnit: number;
        startDate: string;
        endDate: string;
        status: "draft" | "active" | "expired";
        isPublic: boolean;
      }>
    >({
      query: ({ id, ...body }) => ({ url: `/admin/promotions/${id}`, method: "PUT", body }),
      invalidatesTags: [tagTypes.promotions],
    }),

    deletePromotion: builder.mutation<
      { success: boolean; message: string },
      { id: string }
    >({
      query: ({ id }) => ({ url: `/admin/promotions/${id}`, method: "DELETE" }),
      invalidatesTags: [tagTypes.promotions],
    }),

    // ── Admin: Per-store promotions ────────────────────────────────────────────

    getAdminStorePromotions: builder.query<
      WithPagination<{ storePromotions: IStorePromotion[]; enrollment: IPromotionEnrollment | null }>,
      { storeId: string; page?: number; limit?: number }
    >({
      query: ({ storeId, page = 1, limit = 20 }) => ({
        url: `/admin/promotions/stores/${storeId}`,
        params: { page, limit },
      }),
      providesTags: [tagTypes.storePromotions, tagTypes.promotionEnrollments],
    }),

    // ── Admin: Apply credit ────────────────────────────────────────────────────

    applyPromotionCredit: builder.mutation<
      { success: boolean; credit: IPromotionCredit; creditBalance: number },
      {
        storeId: string;
        amount: number;
        orderId?: string;
        partnershipBillId?: string;
        description?: string;
      }
    >({
      query: (body) => ({ url: "/admin/promotions/credits/apply", method: "POST", body }),
      invalidatesTags: [
        tagTypes.promotionCredits,
        tagTypes.promotionEnrollments,
        tagTypes.promotionStatus,
      ],
    }),
  }),
});

export const {
  useGetPromotionStatusQuery,
  useEnrollInPromotionsMutation,
  useGetAvailablePromotionsQuery,
  useGetMyPromotionsQuery,
  useJoinPromotionMutation,
  useCreateCustomPromotionMutation,
  useLogPromotionSalesMutation,
  useGetPromotionCreditsQuery,
  useGetAllPromotionEnrollmentsQuery,
  useApprovePromotionEnrollmentMutation,
  useRejectPromotionEnrollmentMutation,
  useGetAdminPromotionsQuery,
  useCreatePromotionMutation,
  useUpdatePromotionMutation,
  useDeletePromotionMutation,
  useGetAdminStorePromotionsQuery,
  useApplyPromotionCreditMutation,
} = promotionsApi;
