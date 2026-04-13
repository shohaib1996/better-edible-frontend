"use client";

import { use } from "react";
import Stage1OrderDetail from "@/components/PPS/Stage1OrderDetail";

export default function Stage1OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = use(params);
  const decodedOrderId = decodeURIComponent(orderId);

  return (
    <Stage1OrderDetail
      orderId={decodedOrderId}
      backRoute="/admin/pps"
      nextOrderRoute="/admin/pps/stage1"
      doneRoute="/admin/pps"
      compact
    />
  );
}
