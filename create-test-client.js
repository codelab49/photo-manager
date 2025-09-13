const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function createTestClient() {
  try {
    // Get the photographer user
    const photographer = await prisma.user.findFirst({
      where: { role: "PHOTOGRAPHER" }
    });

    if (!photographer) {
      console.log("No photographer found");
      return;
    }

    // Create a client with recipients
    const client = await prisma.client.create({
      data: {
        name: "Smith Wedding",
        email: "planning@smithwedding.com",
        phone: "(555) 123-4567",
        photographerId: photographer.id,
        recipients: {
          create: [
            {
              name: "Jennifer Smith",
              email: "jennifer@smithwedding.com",
              relation: "Bride"
            },
            {
              name: "Michael Smith",
              email: "michael@smithwedding.com",
              relation: "Groom"
            },
            {
              name: "Mrs. Johnson",
              email: "mom.johnson@email.com",
              relation: "Mother of the Bride"
            },
            {
              name: "Mr. Smith Sr.",
              email: "dad.smith@email.com",
              relation: "Father of the Groom"
            }
          ]
        }
      },
      include: {
        recipients: true
      }
    });

    console.log("✅ Created client with recipients:");
    console.log("Client:", client.name, "(" + client.email + ")");
    console.log("Recipients:");
    client.recipients.forEach((recipient) => {
      console.log(
        "  -",
        recipient.name,
        "(" + recipient.email + ")",
        recipient.relation ? "- " + recipient.relation : ""
      );
    });
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestClient();
