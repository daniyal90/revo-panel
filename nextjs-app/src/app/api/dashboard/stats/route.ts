import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/decimal";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get total traffic
    const totalTraffic = await prisma.trafficLog.count({
      where: { userId },
    });

    // Get delivered SMS
    const deliveredSms = await prisma.trafficLog.count({
      where: { userId, status: "DELIVERED" },
    });

    // Get total earnings from delivered SMS (use payoutAmount field)
    const trafficLogs = await prisma.trafficLog.findMany({
      where: { userId, status: "DELIVERED" },
      select: { payoutAmount: true },
    });

    const netEarnings = trafficLogs.reduce((sum, log) => sum + (log.payoutAmount ? decimalToNumber(log.payoutAmount) : 0), 0);

    // Get pending payouts (not paid) from payoutRequest
    const pendingPayouts = await prisma.payoutRequest.aggregate({
      where: { userId, status: { in: ["PENDING", "APPROVED"] } },
      _sum: { amount: true },
    });

    const pendingAmount = pendingPayouts._sum.amount ? decimalToNumber(pendingPayouts._sum.amount) : 0;

    return NextResponse.json({
      totalTraffic,
      deliveredSms,
      netEarnings,
      pendingPayouts: pendingAmount,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
