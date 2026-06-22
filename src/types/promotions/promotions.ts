export type PromotionType = "flat" | "percentage";
export type PromotionStatus = "active" | "inactive";

export interface IPromotion {
  _id: string;
  name: string;
  code?: string;
  description?: string;
  type: PromotionType;
  value: number;
  minOrderAmount?: number;
  maxUses?: number;
  usedCount: number;
  maxUsesPerStore?: number;
  storeIds: string[];
  startDate?: string;
  endDate?: string;
  status: PromotionStatus;
  isPublic: boolean;
  autoApply: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IPromotionUsage {
  _id: string;
  promotionId: string | IPromotion;
  storeId: string;
  orderId?: string;
  discountAmount: number;
  appliedAt: string;
  appliedBy: "store" | "admin";
}

export interface IValidatePromoResult {
  promotionId: string;
  code?: string;
  name: string;
  type: PromotionType;
  value: number;
  discount: number;
}
