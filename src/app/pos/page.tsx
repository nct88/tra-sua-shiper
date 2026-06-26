import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { roleHome } from "@/lib/constants";
import Header from "@/components/Header";
import POSTerminal from "@/components/pos/POSTerminal";

export default async function POSPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "ADMIN" && user.role !== "STAFF") {
    redirect(roleHome(user.role));
  }
  return (
    <div>
      <Header title="POS cửa hàng" userName={user.name} />
      <POSTerminal />
    </div>
  );
}
