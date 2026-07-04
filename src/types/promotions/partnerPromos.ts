export interface IPartnerPromo {
  _id: string;
  title: string;
  description?: string;
  discountPercent: number;
  startDate: string;
  endDate: string;
  allProducts: boolean;
  isOpen: boolean;
  enrolled?: boolean;
  claim?: { status: string; creditEarned: number } | null;
}

export interface IPartnerProposal {
  _id: string;
  title: string;
  description?: string;
  proposedDiscount: number;
  proposedStartDate: string;
  proposedEndDate: string;
  notes?: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  createdAt: string;
}

export interface IClaimItem {
  productName: string;
  unitsSold: string;
  unitPrice: string;
}

export interface IProposeFormData {
  title: string;
  description: string;
  proposedDiscount: string;
  proposedStartDate: string;
  proposedEndDate: string;
  notes: string;
}
