import { IStoreUser } from "@/types/storeAuth/storeAuth";

export function getStoreUser(): IStoreUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("better-store-user");
    return raw ? (JSON.parse(raw) as IStoreUser) : null;
  } catch {
    return null;
  }
}

export function isStoreUser(): boolean {
  const user = getStoreUser();
  return user?.role === "store";
}

export function clearStoreUser(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("better-store-user");
  }
}
