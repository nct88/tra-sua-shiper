import type { Metadata } from "next";
import PublicTrackView from "@/components/PublicTrackView";

export const metadata: Metadata = {
  title: "Theo dõi đơn hàng - Boba Ship",
};

export default function PublicTrackPage({
  params,
}: {
  params: { token: string };
}) {
  return <PublicTrackView token={params.token} />;
}
