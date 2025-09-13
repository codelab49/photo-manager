import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log("Creating admin user...");

    // Hash the password
    const hashedPassword = await hash("admin123", 12); // Change this password!

    // Create the admin user
    const user = await prisma.user.create({
      data: {
        email: "admin@photomanager.com", // Change this email!
        name: "Admin Photographer",
        password: hashedPassword,
        role: "PHOTOGRAPHER"
      }
    });

    console.log("✅ Admin user created successfully!");
    console.log("📧 Email:", user.email);
    console.log("🔑 Password: admin123");
    console.log("👤 Name:", user.name);
    console.log("🆔 ID:", user.id);
    console.log("");
    console.log("⚠️  Important: Change the password after first login!");
    console.log("🌐 You can now sign in at: http://localhost:3000/auth/signin");
  } catch (error) {
    if (error.code === "P2002") {
      console.log("❌ User with this email already exists!");
    } else {
      console.error("❌ Error creating user:", error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
