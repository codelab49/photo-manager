const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createBasicTestData() {
  try {
    console.log("🔄 Creating basic test data (no photos)...");

    // Clean up existing test data
    console.log("🧹 Cleaning up existing test data...");
    await prisma.photoComment.deleteMany({});
    await prisma.photoLike.deleteMany({});
    await prisma.galleryPhoto.deleteMany({});
    await prisma.gallery.deleteMany({});
    await prisma.photo.deleteMany({});
    await prisma.photoSession.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.user.deleteMany({});
    console.log("✅ Cleanup complete");

    // Create photographer
    const hashedPassword = await bcrypt.hash("test123", 12);
    const photographer = await prisma.user.create({
      data: {
        email: "photographer@test.com",
        name: "Test Photographer",
        password: hashedPassword
      }
    });
    console.log("👤 Created photographer: photographer@test.com");

    // Create client
    const client = await prisma.client.create({
      data: {
        name: "John & Jane Doe",
        email: "client@test.com",
        phone: "+1234567890",
        photographerId: photographer.id
      }
    });
    console.log("👥 Created client: John & Jane Doe");

    // Create session
    const session = await prisma.photoSession.create({
      data: {
        title: "Wedding Photography Session",
        sessionDate: new Date("2024-06-15"),
        location: "Central Park, NYC",
        clientId: client.id,
        photographerId: photographer.id,
        description: "Beautiful outdoor wedding session"
      }
    });
    console.log("📅 Created session: Wedding Photography Session");

    console.log("\n✅ Basic test data created successfully!");
    console.log("👤 Login credentials:");
    console.log("   Email: photographer@test.com");
    console.log("   Password: test123");
    console.log("\n📸 Next steps:");
    console.log("   1. Login at: http://localhost:3000/auth/signin");
    console.log("   2. Upload photos through the dashboard");
    console.log("   3. Create galleries to share with clients");
  } catch (error) {
    console.error("❌ Error creating test data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createBasicTestData();
