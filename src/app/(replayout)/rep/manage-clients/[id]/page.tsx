import { SingleClientPage } from "@/components/ClientManagement/SingleClientPage";

export default async function RepManageClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <SingleClientPage clientId={id} isRepView={true} />;
}
