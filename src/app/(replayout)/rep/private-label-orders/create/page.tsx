"use client";
import { CreatePrivateLabelOrderPage } from "@/components/PrivateLabel/PrivateLabelOrdersPage/CreatePrivateLabelOrderPage";
import React from "react";
import { useUser } from "@/redux/hooks/useAuth";

const CreatePrivateLabelOrder = () => {
  const user = useUser();
  return (
    <CreatePrivateLabelOrderPage isRepView={true} currentRepId={user?.id} />
  );
};

export default CreatePrivateLabelOrder;
