"use client";

import { use } from "react";
import Stage1OrderDetail from "@/components/PPS/stage1/Stage1OrderDetail";

export default function WorkerStage1OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const decodedOrderId = decodeURIComponent(orderId);

  return (
    <Stage1OrderDetail
      orderId={decodedOrderId}
      backRoute="/pps"
      nextOrderRoute="/pps/stage1"
      doneRoute="/pps"
    />
  );
}
