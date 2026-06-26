import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Header from "@/components/Header";
import Leaderboard from "@/components/Leaderboard";

export default async function LeaderboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return (
    <div>
      <Header title="Xếp hạng shiper" userName={user.name} />
      <Leaderboard />
    </div>
  );
}
