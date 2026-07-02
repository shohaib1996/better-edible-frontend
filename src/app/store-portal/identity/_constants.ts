export const INQUIRY_URL = `${process.env.NEXT_PUBLIC_API_URL}/store/identity-inquiry`;

export const C = {
  ink: "#2a2518",
  cream: "#f5f2e8",
  creamCard: "#fffdf7",
  muted: "#6b6045",
  faint: "#9a8f6e",
  line: "#e5e0c8",
  lineStrong: "#d6d0b4",
  orange: "#c45a1a",
  orangeSoft: "#e8a87c",
  green: "#2d7a3a",
  red: "#b91c1c",
  serif: "Georgia, 'Times New Roman', serif",
  sans: "system-ui, -apple-system, sans-serif",
};

export function fmt(n: number, decimals = 0) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
