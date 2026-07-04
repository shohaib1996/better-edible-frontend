export type {
  IPartnerPromo as Promo,
  IPartnerProposal as Proposal,
  IClaimItem as ClaimItem,
  IProposeFormData as ProposeFormData,
} from "@/types/promotions/partnerPromos";

export function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function isActive(p: { startDate: string; endDate: string }) {
  const now = Date.now();
  return new Date(p.startDate).getTime() <= now && new Date(p.endDate).getTime() >= now;
}

export function isUpcoming(p: { startDate: string }) {
  return new Date(p.startDate).getTime() > Date.now();
}
