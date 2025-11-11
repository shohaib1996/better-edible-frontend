import { useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  loginName: string;
  repType: string;
  territory: string;
  role?: "superadmin" | "rep";
}

// ✅ Now returns undefined while still checking
export const useUser = (): User | null | undefined => {
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedUser = localStorage.getItem("better-user");
    if (storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  return user;
};
