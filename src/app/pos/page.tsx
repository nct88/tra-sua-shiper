import { requireRole } from "@/lib/auth";
import Header from "@/components/Header";
import POSTerminal from "@/components/pos/POSTerminal";

export default async function POSPage() {
  const user = await requireRole(["ADMIN", "STAFF"]);
  return (
    <div>
      <Header title="POS cửa hàng" userName={user.name} />
      <POSTerminal />
    </div>
  );
}
