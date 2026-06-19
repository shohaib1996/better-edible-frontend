import { baseApi } from "../baseApi";
import { tagTypes } from "../../tagTypes/tagTypes";
import type {
  IPartnershipEnrollment,
  IPartnershipInventory,
  IPartnershipSale,
  IPartnershipBill,
} from "@/types/partnership/partnership";

export const partnershipApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ── Store: Enrollment ─────────────────────────────────────────────────────

    getPartnershipStatus: builder.query<
      { success: boolean; enrollment: IPartnershipEnrollment | null; status?: string },
      string
    >({
      query: (storeId) => ({ url: "/partnership/status", params: { storeId } }),
      providesTags: [tagTypes.partnershipStatus],
    }),

    joinPartnership: builder.mutation<
      { success: boolean; enrollment: IPartnershipEnrollment },
      { storeId: string }
    >({
      query: (body) => ({ url: "/partnership/join", method: "POST", body }),
      invalidatesTags: [tagTypes.partnershipStatus],
    }),

    // ── Store: Inventory ──────────────────────────────────────────────────────

    getPartnershipInventory: builder.query<
      { success: boolean; inventory: IPartnershipInventory[] },
      string
    >({
      query: (storeId) => ({ url: "/partnership/inventory", params: { storeId } }),
      providesTags: [tagTypes.partnershipInventory],
    }),

    // ── Store: Sales ──────────────────────────────────────────────────────────

    getPartnershipSales: builder.query<
      { success: boolean; sales: IPartnershipSale[] },
      { storeId: string; startDate?: string; endDate?: string }
    >({
      query: ({ storeId, startDate, endDate }) => ({
        url: "/partnership/sales",
        params: { storeId, startDate, endDate },
      }),
      providesTags: [tagTypes.partnershipSales],
    }),

    // ── Store: Billing ────────────────────────────────────────────────────────

    getPartnershipBilling: builder.query<
      { success: boolean; bills: IPartnershipBill[] },
      string
    >({
      query: (storeId) => ({ url: "/partnership/billing", params: { storeId } }),
      providesTags: [tagTypes.partnershipBilling],
    }),

    // ── Admin: Enrollment ─────────────────────────────────────────────────────

    getAllPartnershipStores: builder.query<
      { success: boolean; stores: IPartnershipEnrollment[] },
      { status?: string } | void
    >({
      query: (params) => ({ url: "/admin/partnership", params: params || {} }),
      providesTags: [tagTypes.partnershipStores],
    }),

    approvePartnership: builder.mutation<
      { success: boolean; enrollment: IPartnershipEnrollment },
      { storeId: string; notes?: string; approvedBy?: string }
    >({
      query: ({ storeId, ...body }) => ({
        url: `/admin/partnership/${storeId}/approve`,
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.partnershipStores, tagTypes.partnershipStatus],
    }),

    rejectPartnership: builder.mutation<
      { success: boolean; enrollment: IPartnershipEnrollment },
      { storeId: string; notes?: string }
    >({
      query: ({ storeId, ...body }) => ({
        url: `/admin/partnership/${storeId}/reject`,
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.partnershipStores, tagTypes.partnershipStatus],
    }),

    // ── Admin: Inventory ──────────────────────────────────────────────────────

    getAdminInventory: builder.query<
      { success: boolean; inventory: IPartnershipInventory[] },
      string
    >({
      query: (storeId) => ({ url: `/admin/partnership/${storeId}/inventory` }),
      providesTags: [tagTypes.partnershipInventory],
    }),

    placeInventory: builder.mutation<
      { success: boolean; inventory: IPartnershipInventory },
      { storeId: string; productId: string; sku: string; wholesalePrice: number; unitsToAdd: number }
    >({
      query: ({ storeId, ...body }) => ({
        url: `/admin/partnership/${storeId}/inventory`,
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.partnershipInventory],
    }),

    // ── Admin: Sales ──────────────────────────────────────────────────────────

    getAdminSales: builder.query<
      { success: boolean; sales: IPartnershipSale[] },
      { storeId: string; startDate?: string; endDate?: string }
    >({
      query: ({ storeId, startDate, endDate }) => ({
        url: `/admin/partnership/${storeId}/sales`,
        params: { startDate, endDate },
      }),
      providesTags: [tagTypes.partnershipSales],
    }),

    // ── Admin: Billing ────────────────────────────────────────────────────────

    getAdminBilling: builder.query<
      { success: boolean; bills: IPartnershipBill[] },
      string
    >({
      query: (storeId) => ({ url: `/admin/partnership/${storeId}/billing` }),
      providesTags: [tagTypes.partnershipBilling],
    }),

    generateBill: builder.mutation<
      { success: boolean; bill: IPartnershipBill },
      { storeId: string; year: number; month: number }
    >({
      query: ({ storeId, ...body }) => ({
        url: `/admin/partnership/${storeId}/billing/generate`,
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.partnershipBilling],
    }),

    applyCredit: builder.mutation<
      { success: boolean; bill: IPartnershipBill },
      { billId: string; amount: number; reason: string }
    >({
      query: ({ billId, ...body }) => ({
        url: `/admin/partnership/billing/${billId}/credit`,
        method: "POST",
        body,
      }),
      invalidatesTags: [tagTypes.partnershipBilling],
    }),

    updateBillStatus: builder.mutation<
      { success: boolean; bill: IPartnershipBill },
      { billId: string; status: "draft" | "sent" | "paid" }
    >({
      query: ({ billId, ...body }) => ({
        url: `/admin/partnership/billing/${billId}/status`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: [tagTypes.partnershipBilling],
    }),
  }),
});

export const {
  useGetPartnershipStatusQuery,
  useJoinPartnershipMutation,
  useGetPartnershipInventoryQuery,
  useGetPartnershipSalesQuery,
  useGetPartnershipBillingQuery,
  useGetAllPartnershipStoresQuery,
  useApprovePartnershipMutation,
  useRejectPartnershipMutation,
  useGetAdminInventoryQuery,
  usePlaceInventoryMutation,
  useGetAdminSalesQuery,
  useGetAdminBillingQuery,
  useGenerateBillMutation,
  useApplyCreditMutation,
  useUpdateBillStatusMutation,
} = partnershipApi;
