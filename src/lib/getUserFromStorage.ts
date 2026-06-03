export function getUserFromStorage(): { userId: string; userType: "admin" | "rep" } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("better-user");
    if (raw) {
      const user = JSON.parse(raw);
      const userType =
        user.role === "superadmin" || user.role === "manager" ? "admin" : "rep";
      return { userId: user.id, userType };
    }
  } catch {
    /* ignore */
  }
  return null;
}
