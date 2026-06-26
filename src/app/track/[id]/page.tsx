import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Header from "@/components/Header";
import TrackView from "@/components/TrackView";

export default async function TrackPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <div>
      <Header title="Theo dõi đơn" userName={user.name} />
      <TrackView orderId={params.id} role={user.role} />
    </div>
  );
}
