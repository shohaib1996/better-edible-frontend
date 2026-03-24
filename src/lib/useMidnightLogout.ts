import { useEffect } from "react";

export function useMidnightLogout(onLogout: () => void) {
  useEffect(() => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0); // next midnight
    const msUntilMidnight = midnight.getTime() - now.getTime();

    const timer = setTimeout(onLogout, msUntilMidnight);
    return () => clearTimeout(timer);
  }, [onLogout]);
}
