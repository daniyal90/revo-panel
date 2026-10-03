import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const status = url.searchParams.get('status'); // PENDING, APPROVED, REJECTED

    const where: any = {};
    if (status) where.status = status;

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true, createdAt: true, status: true, role: true, isActive: true },
    });

    return NextResponse.json({ data: users });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
