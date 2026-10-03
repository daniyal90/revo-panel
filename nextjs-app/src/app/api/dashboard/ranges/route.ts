import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all available ranges (not just user's ranges)
    const ranges = await prisma.numberRange.findMany({
      where: {
        OR: [
          { userId: null }, // Available ranges
          { userId }, // User's claimed ranges
        ],
      },
      orderBy: { destination: "asc" },
    });

    // Format ranges for display
    const formattedRanges = ranges.map((range) => ({
      id: range.id,
      country: range.destination,
      prefix: range.prefix,
      range: range.prefix,
      rate: range.rate.toString(),
      status: range.status,
      isClaimed: range.userId === userId,
    }));

    return NextResponse.json(formattedRanges);
  } catch (error) {
    console.error("Error fetching ranges:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
