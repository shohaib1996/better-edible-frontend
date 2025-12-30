"use client";
import { PrivateLabelOrdersPage } from "@/components/PrivateLabel/PrivateLabelOrdersPage";
import React from "react";
import { useUser } from "@/redux/hooks/useAuth";

const PrivateLabelOrders = () => {
  const user = useUser();
  return (
    <PrivateLabelOrdersPage isRepView={true} currentRepId={user?.id} />
  );
};

export default PrivateLabelOrders;
