export type BuyingMode = "central" | "hybrid" | "independent";

export const MODE_LABEL: Record<BuyingMode, string> = {
  central: "Central — one buyer for all stores",
  hybrid: "Hybrid — mix of central + self-buying",
  independent: "Independent — each store buys itself",
};

export const MODE_SHORT: Record<BuyingMode, string> = {
  central: "central",
  hybrid: "hybrid",
  independent: "independent",
};

export const MODE_COLOR: Record<BuyingMode, string> = {
  central: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  hybrid: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  independent: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
};

export const blankForm = {
  name: "",
  buyingMode: "independent" as BuyingMode,
  notes: "",
  buyerName: "",
  buyerEmail: "",
  buyerPhone: "",
  billingContact: "",
};

export const INPUT_CLS = "w-full border border-border rounded-xs px-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-primary";
export const LABEL_CLS = "block text-sm font-medium text-foreground mb-1";
