import { prisma } from "@/lib/db";
import { ok, fail, requireUser } from "@/lib/api";
import { maskPhone } from "@/lib/privacy";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const user = auth.user;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      customer: { select: { id: true, name: true, phone: true } },
      shipper: {
        select: {
          id: true,
          name: true,
          phone: true,
          shipperProfile: true,
        },
      },
      rating: true,
    },
  });
  if (!order) return fail("Không tìm thấy đơn hàng", 404);

  // Phân quyền xem
  const allowed =
    user.role === "ADMIN" ||
    order.customerId === user.id ||
    order.shipperId === user.id ||
    (user.role === "SHIPPER" && order.status === "PENDING");
  if (!allowed) return fail("Bạn không có quyền xem đơn này", 403);

  // Che số điện thoại hai bên (admin vẫn xem được)
  if (user.role !== "ADMIN") {
    if (order.customer) order.customer.phone = maskPhone(order.customer.phone) as any;
    if (order.shipper) order.shipper.phone = maskPhone(order.shipper.phone) as any;
  }

  return ok(order);
}
