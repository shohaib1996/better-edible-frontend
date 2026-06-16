"use client";

import { ClientOrdersPage } from "@/components/ClientOrders/ClientOrdersPage";
import { useUser } from "@/redux/hooks/useAuth";

const RepClientOrders = () => {
  const user = useUser();
  return <ClientOrdersPage isRepView={true} currentRepId={user?.id} />;
};

export default RepClientOrders;
