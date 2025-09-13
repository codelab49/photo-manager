import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seedTestData() {
  try {
    console.log("Creating test data...");

    // Get the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: "admin@photomanager.com" }
    });

    if (!adminUser) {
      console.log("❌ Admin user not found. Run create-admin.js first!");
      return;
    }

    // Create a test client
    const client = await prisma.client.create({
      data: {
        name: "John Smith",
        email: "john.smith@example.com",
        phone: "+1-555-0123",
        photographerId: adminUser.id
      }
    });

    // Create a test photo session
    const session = await prisma.photoSession.create({
      data: {
        title: "Wedding Photoshoot",
        description: "Beautiful outdoor wedding ceremony and reception",
        sessionDate: new Date("2024-06-15"),
        location: "Central Park, New York",
        photographerId: adminUser.id,
        clientId: client.id
      }
    });

    console.log("✅ Test data created successfully!");
    console.log("👤 Client:", client.name, "(" + client.email + ")");
    console.log("📸 Session:", session.title);
    console.log("📅 Date:", session.sessionDate.toDateString());
    console.log("📍 Location:", session.location);
    console.log("");
    console.log("🎯 You can now test photo uploads to this session!");
  } catch (error) {
    console.error("❌ Error creating test data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData();
