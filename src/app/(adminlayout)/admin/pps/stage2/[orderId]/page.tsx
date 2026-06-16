"use client";

import { use } from "react";
import Stage2OrderDetail from "@/components/PPS/stage2/Stage2OrderDetail";

export default function Stage2OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const decodedOrderId = decodeURIComponent(orderId);

  return (
    <Stage2OrderDetail
      orderId={decodedOrderId}
      backRoute="/admin/pps"
      compact
    />
  );
}
