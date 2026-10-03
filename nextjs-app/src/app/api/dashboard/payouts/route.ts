import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { decimalToNumber } from "@/lib/decimal";

const MIN_PAYOUT = 50;

function isValidLitecoinAddress(address: string) {
  if (!address) return false;
  const bech32 = /^ltc1[0-9a-z]{39,59}$/i;
  const legacy = /^[LM3][1-9A-HJ-NP-Za-km-z]{26,33}$/; // includes some P2SH prefixes
  return bech32.test(address) || legacy.test(address);
}

function isValidTrc20Address(address: string) {
  if (!address) return false;
  return /^T[a-zA-Z0-9]{33}$/.test(address);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const payouts = await prisma.payoutRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    // compute available balance = delivered sum - pending/approved payouts
    const delivered = await prisma.trafficLog.aggregate({ _sum: { payoutAmount: true }, where: { userId, status: "DELIVERED" } });
    const deliveredSum = delivered._sum.payoutAmount ? decimalToNumber(delivered._sum.payoutAmount) : 0;

    const reserved = await prisma.payoutRequest.aggregate({
      _sum: { amount: true },
      where: { userId, status: { in: ["PENDING", "APPROVED"] } },
    });
    const reservedSum = reserved._sum.amount ? decimalToNumber(reserved._sum.amount) : 0;

    const availableBalance = Math.max(0, deliveredSum - reservedSum);

    return NextResponse.json({ data: payouts, availableBalance });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function computeUserDeliveredSum(userId: string) {
  const sum = await prisma.trafficLog.aggregate({ _sum: { payoutAmount: true }, where: { userId, status: "DELIVERED" } });
  return sum._sum.payoutAmount ? decimalToNumber(sum._sum.payoutAmount) : 0;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const body = await request.json();
    const { amount, method, details } = body;
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });

    // compute available balance
    const deliveredSum = await computeUserDeliveredSum(userId);
    const reserved = await prisma.payoutRequest.aggregate({ _sum: { amount: true }, where: { userId, status: { in: ["PENDING", "APPROVED"] } } });
    const reservedSum = reserved._sum.amount ? decimalToNumber(reserved._sum.amount) : 0;
    const available = Math.max(0, deliveredSum - reservedSum);

    if (numAmount > available) return NextResponse.json({ error: "Insufficient available balance" }, { status: 400 });
    if (numAmount < MIN_PAYOUT) return NextResponse.json({ error: `Minimum payout is $${MIN_PAYOUT}` }, { status: 400 });

    // validate method specifics
    if (method === 'LITECOIN') {
      const addr = details?.address || details?.wallet || details;
      if (!addr || !isValidLitecoinAddress(addr)) return NextResponse.json({ error: 'Invalid Litecoin address' }, { status: 400 });
    }

    if (method === 'USDT_TRC20') {
      const addr = details?.address || details?.wallet || details;
      if (!addr) return NextResponse.json({ error: 'USDT TRC20 address is required' }, { status: 400 });
      if (!isValidTrc20Address(addr)) return NextResponse.json({ error: 'Invalid TRC20 address format' }, { status: 400 });
    }

    const payout = await prisma.payoutRequest.create({
      data: {
        userId,
        amount: String(numAmount),
        method,
        details: details ?? null,
        status: "PENDING",
      },
    });

    return NextResponse.json({ data: payout, availableBalance: available - numAmount });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
