import { requireRole } from "@/lib/auth";
import Header from "@/components/Header";
import ShipperDashboard from "@/components/shipper/ShipperDashboard";

export default async function ShipperPage() {
  const user = await requireRole(["SHIPPER"]);

  return (
    <div>
      <Header title="Shiper" userName={user.name} />
      <ShipperDashboard />
    </div>
  );
}
