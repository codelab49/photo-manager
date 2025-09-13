const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createSession() {
  try {
    const photographer = await prisma.user.findFirst({
      where: { role: "PHOTOGRAPHER" }
    });
    const client = await prisma.client.findFirst({
      where: { name: "Smith Wedding" }
    });

    if (!photographer || !client) {
      console.log("Missing photographer or client");
      return;
    }

    const session = await prisma.photoSession.create({
      data: {
        title: "Smith Wedding Photography",
        description: "Beautiful wedding ceremony and reception photos",
        sessionDate: new Date("2024-10-15"),
        location: "Grand Ballroom, Downtown Hotel",
        photographerId: photographer.id,
        clientId: client.id
      }
    });

    console.log("✅ Created session:", session.title, "for", client.name);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createSession();
