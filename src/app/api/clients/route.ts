import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/clients - List all clients for the authenticated photographer
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clients = await prisma.client.findMany({
      where: {
        photographerId: session.user.id
      },
      include: {
        recipients: true,
        _count: {
          select: {
            sessions: true,
            galleries: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, email, phone, recipients } = await request.json();

    // Validate required fields
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate recipients if provided
    if (recipients && Array.isArray(recipients)) {
      for (const recipient of recipients) {
        if (!recipient.name?.trim() || !recipient.email?.trim()) {
          return NextResponse.json(
            { error: "All recipients must have name and email" },
            { status: 400 }
          );
        }
        if (!emailRegex.test(recipient.email)) {
          return NextResponse.json(
            { error: `Invalid email format for recipient: ${recipient.email}` },
            { status: 400 }
          );
        }
      }
    }

    // Check if client with same email already exists for this photographer
    const existingClient = await prisma.client.findFirst({
      where: {
        photographerId: session.user.id,
        email: email.trim().toLowerCase()
      }
    });

    if (existingClient) {
      return NextResponse.json(
        { error: "A client with this email already exists" },
        { status: 409 }
      );
    }

    // Create client with recipients
    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        photographerId: session.user.id,
        recipients:
          recipients && recipients.length > 0
            ? {
                create: recipients.map(
                  (recipient: {
                    name: string;
                    email: string;
                    relation?: string;
                  }) => ({
                    name: recipient.name.trim(),
                    email: recipient.email.trim().toLowerCase(),
                    relation: recipient.relation?.trim() || null
                  })
                )
              }
            : undefined
      },
      include: {
        recipients: true,
        _count: {
          select: {
            sessions: true,
            galleries: true
          }
        }
      }
    });

    return NextResponse.json({ client }, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}
