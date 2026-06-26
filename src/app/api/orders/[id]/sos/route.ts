import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { notifyAdmins, createNotification } from "@/lib/notify";
import { counterpartId } from "@/lib/privacy";

// Nút khẩn cấp SOS: khách hoặc shiper báo sự cố an toàn cho tổng đài & bên còn lại
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser(["CUSTOMER", "SHIPPER"]);
  if (auth.error) return auth.error;

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return fail("Không tìm thấy đơn", 404);
  if (order.customerId !== auth.user.id && order.shipperId !== auth.user.id) {
    return fail("Bạn không thuộc đơn này", 403);
  }

  const b = await req.json().catch(() => ({}));
  const lat = Number((b as any)?.lat);
  const lng = Number((b as any)?.lng);
  const message = ((b as any)?.message || "").toString().slice(0, 300);
  const role = auth.user.role === "SHIPPER" ? "Shiper" : "Khách";
  const locStr =
    isFinite(lat) && isFinite(lng)
      ? ` Vị trí: https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`
      : "";

  const detail = `🆘 ${role} ${auth.user.name} báo khẩn cấp ở đơn ${order.code}.${
    message ? " Nội dung: " + message : ""
  }${locStr}`;

  await notifyAdmins({
    type: "WARNING",
    title: "🆘 CẢNH BÁO SOS",
    message: detail,
    link: `/track/${order.id}`,
  });

  const peer = counterpartId(order, auth.user.id);
  if (peer) {
    await createNotification({
      userId: peer,
      type: "WARNING",
      title: "🆘 Cảnh báo an toàn",
      message: `${role} vừa gửi tín hiệu SOS cho đơn ${order.code}. Tổng đài đang xử lý.`,
      link: `/track/${order.id}`,
    });
  }

  return ok({ sent: true });
}
