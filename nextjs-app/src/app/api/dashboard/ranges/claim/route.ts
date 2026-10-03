import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;
    const body = await request.json();
    const { rangeId } = body;
    if (!rangeId) return NextResponse.json({ error: "rangeId required" }, { status: 400 });

    const range = await prisma.numberRange.findUnique({ where: { id: rangeId } });
    if (!range) return NextResponse.json({ error: "Range not found" }, { status: 404 });
    if (range.userId) return NextResponse.json({ error: "Range already claimed" }, { status: 409 });

    const updated = await prisma.numberRange.update({ where: { id: rangeId }, data: { userId } });

    return NextResponse.json({ data: { id: updated.id, userId: updated.userId } });
  } catch (error) {
    console.error("Claim range error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
