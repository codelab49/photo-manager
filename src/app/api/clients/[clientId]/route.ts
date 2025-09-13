import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ clientId: string }>;
}

// PUT /api/clients/[clientId] - Update a client
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { clientId } = await params;

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

    // Check if client exists and belongs to the photographer
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        photographerId: session.user.id
      }
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Check if another client with same email exists (excluding current)
    const duplicateClient = await prisma.client.findFirst({
      where: {
        photographerId: session.user.id,
        email: email.trim().toLowerCase(),
        id: { not: clientId }
      }
    });

    if (duplicateClient) {
      return NextResponse.json(
        { error: "A client with this email already exists" },
        { status: 409 }
      );
    }

    // Update client with recipients
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone?.trim() || null,
        recipients: {
          // Delete existing recipients
          deleteMany: {},
          // Create new recipients
          create:
            recipients && recipients.length > 0
              ? recipients.map(
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
              : []
        }
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

    return NextResponse.json({ client: updatedClient });
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[clientId] - Delete a client
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    const { clientId } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if client exists and belongs to the photographer
    const existingClient = await prisma.client.findFirst({
      where: {
        id: clientId,
        photographerId: session.user.id
      }
    });

    if (!existingClient) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Delete client (recipients will be deleted due to cascade)
    await prisma.client.delete({
      where: { id: clientId }
    });

    return NextResponse.json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
}
