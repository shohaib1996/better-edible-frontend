"use client";

import { ManageClientsPage } from "@/components/ClientManagement/ManageClientsPage";
import { useUser } from "@/redux/hooks/useAuth";

const RepManageClients = () => {
  const user = useUser();
  return <ManageClientsPage isRepView={true} currentRepId={user?.id} />;
};

export default RepManageClients;
