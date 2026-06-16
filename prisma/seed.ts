import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL env variable is not set");
}

// Thay thế mysql:// bằng mariadb:// nếu cần cho adapter
const connectionString = process.env.DATABASE_URL.replace("mysql://", "mariadb://");
const adapter = new PrismaMariaDb(connectionString);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Bắt đầu seed dữ liệu...");

  const hashedPassword = await bcrypt.hash("123456", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: {},
    create: {
      email: "admin@test.com",
      name: "Admin",
      password: hashedPassword,
      role: "ADMIN"
    }
  });

  const pm = await prisma.user.upsert({
    where: { email: "pm@test.com" },
    update: {},
    create: {
      email: "pm@test.com",
      name: "Project Manager",
      password: hashedPassword,
      role: "PM"
    }
  });

  const member = await prisma.user.upsert({
    where: { email: "member@test.com" },
    update: {},
    create: {
      email: "member@test.com",
      name: "Member User",
      password: hashedPassword,
      role: "MEMBER"
    }
  });

  console.log("✅ Đã tạo 3 users:", admin.email, pm.email, member.email);

  const projectA = await prisma.project.create({
    data: {
      name: "Dự án Website Bán hàng ABC",
      description:
        "Xây dựng website thương mại điện tử cho công ty ABC với đầy đủ tính năng quản lý sản phẩm, giỏ hàng và thanh toán.",
      currentStepOrder: 2,
      percentage: 35,
      createdById: pm.id,
      steps: {
        create: [
          { stepName: "Tiếp cận", stepOrder: 1 },
          { stepName: "Liên hệ", stepOrder: 2 },
          { stepName: "Báo giá", stepOrder: 3 },
          { stepName: "Ký hợp đồng", stepOrder: 4 }
        ]
      }
    }
  });

  await prisma.projectLog.create({
    data: {
      projectId: projectA.id,
      updatedById: pm.id,
      oldStep: 1,
      newStep: 2,
      oldPercentage: 10,
      newPercentage: 35,
      note: "Đã liên hệ khách hàng, chuyển sang giai đoạn trao đổi chi tiết"
    }
  });

  console.log("✅ Đã tạo dự án A:", projectA.name);

  const projectB = await prisma.project.create({
    data: {
      name: "Triển khai CRM cho XYZ Corp",
      description: "Triển khai hệ thống CRM tùy chỉnh cho XYZ Corp, bao gồm quản lý khách hàng và pipeline bán hàng.",
      currentStepOrder: 1,
      percentage: 10,
      createdById: member.id,
      steps: {
        create: [
          { stepName: "Tiếp cận", stepOrder: 1 },
          { stepName: "Triển khai", stepOrder: 2 }
        ]
      }
    }
  });

  console.log("✅ Đã tạo dự án B:", projectB.name);

  const projectC = await prisma.project.create({
    data: {
      name: "App Mobile Quản lý Kho",
      description: "Ứng dụng mobile quản lý kho hàng cho chuỗi cửa hàng tiện lợi.",
      currentStepOrder: 3,
      percentage: 100,
      createdById: pm.id,
      steps: {
        create: [
          { stepName: "Khảo sát", stepOrder: 1 },
          { stepName: "Phát triển", stepOrder: 2 },
          { stepName: "Nghiệm thu", stepOrder: 3 }
        ]
      }
    }
  });

  await prisma.projectLog.createMany({
    data: [
      {
        projectId: projectC.id,
        updatedById: admin.id,
        oldStep: 1,
        newStep: 2,
        oldPercentage: 0,
        newPercentage: 50,
        note: "Bắt đầu phát triển"
      },
      {
        projectId: projectC.id,
        updatedById: pm.id,
        oldStep: 2,
        newStep: 3,
        oldPercentage: 50,
        newPercentage: 100,
        note: "Hoàn thành nghiệm thu, bàn giao khách hàng"
      }
    ]
  });

  console.log("✅ Đã tạo dự án C:", projectC.name);
  console.log("\n🎉 Seed hoàn tất! Mật khẩu chung: 123456");
}

main()
  .catch((e) => {
    console.error("❌ Seed lỗi:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
