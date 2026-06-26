import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const pass = await bcrypt.hash("123456", 10);

  // Admin
  await prisma.user.upsert({
    where: { phone: "0900000000" },
    update: {},
    create: {
      name: "Quản trị viên",
      phone: "0900000000",
      email: "admin@bobaship.vn",
      passwordHash: pass,
      role: "ADMIN",
    },
  });

  // Khách hàng
  await prisma.user.upsert({
    where: { phone: "0911111111" },
    update: {},
    create: {
      name: "Nguyễn Văn Khách",
      phone: "0911111111",
      passwordHash: pass,
      role: "CUSTOMER",
      customerProfile: {
        create: {
          loyaltyPoints: 650,
          totalOrders: 8,
          totalSpent: 650000,
          tier: "BAC",
        },
      },
    },
  });

  // Shiper chính
  await prisma.user.upsert({
    where: { phone: "0922222222" },
    update: {},
    create: {
      name: "Trần Văn Shiper",
      phone: "0922222222",
      passwordHash: pass,
      role: "SHIPPER",
      shipperProfile: {
        create: {
          vehicle: "Honda Wave",
          plateNumber: "29-A1 234.56",
          ratingAvg: 4.8,
          ratingCount: 124,
          completedOrders: 130,
          cancelledOrders: 3,
          totalTips: 420000,
          reputationScore: 92,
        },
      },
    },
  });

  // Thêm vài shiper cho bảng xếp hạng
  const extras = [
    { name: "Lê Thị Giao", phone: "0933333333", avg: 4.6, count: 80, done: 85, cancel: 5, tips: 250000, rep: 84 },
    { name: "Phạm Văn Nhanh", phone: "0944444444", avg: 4.9, count: 60, done: 62, cancel: 1, tips: 310000, rep: 88 },
    { name: "Hoàng Minh Tốc", phone: "0955555555", avg: 4.2, count: 40, done: 45, cancel: 8, tips: 90000, rep: 70 },
  ];
  for (const e of extras) {
    await prisma.user.upsert({
      where: { phone: e.phone },
      update: {},
      create: {
        name: e.name,
        phone: e.phone,
        passwordHash: pass,
        role: "SHIPPER",
        shipperProfile: {
          create: {
            ratingAvg: e.avg,
            ratingCount: e.count,
            completedOrders: e.done,
            cancelledOrders: e.cancel,
            totalTips: e.tips,
            reputationScore: e.rep,
          },
        },
      },
    });
  }

  // Mã giảm giá demo
  const vouchers = [
    { code: "CHAOMUNG", description: "Chào mừng khách mới - giảm 20% tối đa 20k", discountType: "PERCENT", discountValue: 20, minOrder: 0, maxDiscount: 20000, minTier: "MOI", perUserLimit: 1 },
    { code: "FREESHIP", description: "Giảm 15k cho đơn từ 50k", discountType: "AMOUNT", discountValue: 15000, minOrder: 50000, minTier: "MOI", perUserLimit: 5 },
    { code: "VIP30", description: "Ưu đãi hạng Bạc trở lên - giảm 30k đơn từ 100k", discountType: "AMOUNT", discountValue: 30000, minOrder: 100000, minTier: "BAC", perUserLimit: 3 },
  ];
  for (const v of vouchers) {
    await prisma.voucher.upsert({
      where: { code: v.code },
      update: {},
      create: v as any,
    });
  }

  console.log("✅ Seed xong! Tài khoản demo (mật khẩu 123456):");
  console.log("   Admin:  0900000000");
  console.log("   Khách:  0911111111");
  console.log("   Shiper: 0922222222");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
