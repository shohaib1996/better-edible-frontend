"use client";
import OrdersPage from "@/components/Orders/OrderPage/OrdersPage";
import React from "react";
import { useUser } from "@/redux/hooks/useAuth";
import { IRep } from "@/types";

const Orders = () => {
  const user = useUser();
  const rep: Partial<IRep> = {
    _id: user?.id,
    name: user?.name,
  };
  return (
    <OrdersPage isRepView={true} currentRepId={user?.id} currentRep={rep} />
  );
};

export default Orders;
