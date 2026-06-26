import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Header from "@/components/Header";
import CustomerDashboard from "@/components/customer/CustomerDashboard";

export default async function CustomerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "CUSTOMER") {
    redirect(user.role === "ADMIN" ? "/admin" : "/shipper");
  }

  return (
    <div>
      <Header title="Khách hàng" userName={user.name} />
      <CustomerDashboard />
    </div>
  );
}
