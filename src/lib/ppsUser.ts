export function getPPSUser() {
  try {
    const u = JSON.parse(localStorage.getItem("better-user") || "{}");
    return {
      userId: u.id || "unknown",
      userName: u.name || "Unknown",
      repType: u.repType || "unknown",
    };
  } catch {
    return { userId: "unknown", userName: "Unknown", repType: "unknown" };
  }
}

export function isAdminUser(): boolean {
  try {
    const u = JSON.parse(localStorage.getItem("better-user") || "{}");
    return u.repType !== "pps" && u.repType !== "production" && u.repType !== "packaging";
  } catch {
    return false;
  }
}
