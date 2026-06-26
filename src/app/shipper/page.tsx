import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Header from "@/components/Header";
import ShipperDashboard from "@/components/shipper/ShipperDashboard";

export default async function ShipperPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "SHIPPER") {
    redirect(user.role === "ADMIN" ? "/admin" : "/customer");
  }

  return (
    <div>
      <Header title="Shiper" userName={user.name} />
      <ShipperDashboard />
    </div>
  );
}
