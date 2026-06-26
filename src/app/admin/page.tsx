import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Header from "@/components/Header";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "ADMIN") {
    redirect(user.role === "SHIPPER" ? "/shipper" : "/customer");
  }
  return (
    <div>
      <Header title="Quản trị" userName={user.name} />
      <AdminDashboard />
    </div>
  );
}
