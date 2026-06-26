import { requireRole } from "@/lib/auth";
import Header from "@/components/Header";
import CustomerDashboard from "@/components/customer/CustomerDashboard";

export default async function CustomerPage() {
  const user = await requireRole(["CUSTOMER"]);

  return (
    <div>
      <Header title="Khách hàng" userName={user.name} />
      <CustomerDashboard />
    </div>
  );
}
