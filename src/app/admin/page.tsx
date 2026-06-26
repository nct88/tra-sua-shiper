import { requireRole } from "@/lib/auth";
import Header from "@/components/Header";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const user = await requireRole(["ADMIN"]);
  return (
    <div>
      <Header title="Quản trị" userName={user.name} />
      <AdminDashboard />
    </div>
  );
}
