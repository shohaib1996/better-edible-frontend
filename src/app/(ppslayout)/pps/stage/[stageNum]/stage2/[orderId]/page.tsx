"use client";

import { use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Stage2OrderDetail from "@/components/PPS/Stage2OrderDetail";

export default function LockedStage2OrderPage({
  params,
}: {
  params: Promise<{ stageNum: string; orderId: string }>;
}) {
  const { stageNum, orderId } = use(params);
  const decodedOrderId = decodeURIComponent(orderId);
  const router = useRouter();

  const handleLogout = useCallback(() => {
    localStorage.removeItem("better-user");
    router.push(`/pps/stage/${stageNum}`);
  }, [router, stageNum]);

  return (
    <Stage2OrderDetail
      orderId={decodedOrderId}
      backRoute={`/pps/stage/${stageNum}`}
      headerExtra={
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="shrink-0 gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-11 px-3"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-lg font-semibold">Logout</span>
        </Button>
      }
    />
  );
}
