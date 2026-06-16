import TimelogById from "@/components/pages/TimelogById/TimelogById";

const RepPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  return (
    <div>
      <TimelogById id={id} />
    </div>
  );
};

export default RepPage;
