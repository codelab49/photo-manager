const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const prisma = new PrismaClient();

async function createGalleryWithAccess() {
  try {
    console.log("🔄 Creating gallery with access control demo...");

    // Clean up existing test data
    console.log("🧹 Cleaning up existing test data...");
    await prisma.photoComment.deleteMany({});
    await prisma.photoLike.deleteMany({});
    await prisma.galleryPhoto.deleteMany({});
    await prisma.galleryAccess.deleteMany({});
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
        name: "The Johnson Family",
        email: "johnsons@example.com",
        phone: "+1234567890",
        photographerId: photographer.id
      }
    });
    console.log("👥 Created client: The Johnson Family");

    // Create session
    const session = await prisma.photoSession.create({
      data: {
        title: "Family Portrait Session",
        sessionDate: new Date("2024-06-15"),
        location: "Central Park, NYC",
        clientId: client.id,
        photographerId: photographer.id,
        description: "Beautiful family portrait session"
      }
    });
    console.log("📅 Created session: Family Portrait Session");

    // Create gallery
    const gallery = await prisma.gallery.create({
      data: {
        title: "Johnson Family Portrait Gallery",
        description:
          "Beautiful family moments captured during your portrait session. View, like, and comment on your favorite photos!",
        shareToken: "johnson-family-2024",
        sessionId: session.id,
        clientId: client.id,
        isActive: true,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
      }
    });
    console.log("🖼️  Created gallery: johnson-family-2024");

    // Create gallery access for family members
    const accessList = [
      { email: "john@johnsons.com", name: "John Johnson" },
      { email: "mary@johnsons.com", name: "Mary Johnson" },
      { email: "grandma@johnsons.com", name: "Grandma Johnson" },
      { email: "uncle.bob@email.com", name: "Uncle Bob" }
    ];

    const galleryAccesses = [];
    for (const person of accessList) {
      const accessToken = crypto.randomUUID(); // Unique token for this person

      const galleryAccess = await prisma.galleryAccess.create({
        data: {
          email: person.email,
          name: person.name,
          accessToken: accessToken,
          galleryId: gallery.id
        }
      });

      galleryAccesses.push(galleryAccess);
      console.log(`🔑 Created access for: ${person.name} (${person.email})`);
      console.log(
        `   Access URL: http://localhost:3000/gallery/${gallery.shareToken}?access=${accessToken}`
      );
    }

    console.log("\n✅ Gallery with access control created successfully!");
    console.log("\n👤 Photographer login:");
    console.log("   Email: photographer@test.com");
    console.log("   Password: test123");

    console.log("\n🔗 Gallery Access URLs:");
    console.log(
      `   Gallery: http://localhost:3000/gallery/${gallery.shareToken}`
    );
    accessList.forEach((person, index) => {
      console.log(
        `   ${person.name}: http://localhost:3000/gallery/${gallery.shareToken}?access=${galleryAccesses[index].accessToken}`
      );
    });

    console.log("\n📝 How it works:");
    console.log(
      "   • Photographer sends personalized links to each family member"
    );
    console.log(
      "   • Each link automatically identifies who is viewing/commenting"
    );
    console.log("   • No need for clients to enter their information");
    console.log("   • Comments and likes are attributed to the correct person");
  } catch (error) {
    console.error("❌ Error creating gallery access demo:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createGalleryWithAccess();
