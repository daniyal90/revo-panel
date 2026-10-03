import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Generate unique API key for user (in production, this would be stored in database)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate API key based on user ID (in production, use proper crypto)
    const apiKey = `revo_live_${user.id.substring(0, 8)}_${Date.now().toString(36)}`;

    // SMPP credentials (in production, these would be unique per user)
    const smppCredentials = {
      host: "smpp.revo.org",
      port: 2775,
      systemId: `revo_${user.id.substring(0, 6)}`,
      password: "••••••••••••",
    };

    return NextResponse.json({
      httpEndpoint: "https://api.revo.org/v1/sms",
      apiKey,
      smpp: smppCredentials,
    });
  } catch (error) {
    console.error("Error fetching integration credentials:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
