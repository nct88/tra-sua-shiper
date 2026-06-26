import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import Header from "@/components/Header";
import POSTerminal from "@/components/pos/POSTerminal";

export default async function POSPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "ADMIN") {
    redirect(user.role === "SHIPPER" ? "/shipper" : "/customer");
  }
  return (
    <div>
      <Header title="POS cửa hàng" userName={user.name} />
      <POSTerminal />
    </div>
  );
}
