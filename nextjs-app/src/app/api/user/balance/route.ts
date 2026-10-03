import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

async function getUserFromApiKey(req: Request) {
  const apiKey = req.headers.get('x-api-key') || '';
  if (!apiKey) return null;
  const user = await prisma.user.findUnique({ where: { apiKey } });
  return user;
}

export async function GET(request: Request) {
  const user = await getUserFromApiKey(request);
  if (!user) return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  // first try to sum stored payoutAmount for delivered messages
  const sumResult = await prisma.trafficLog.aggregate({
    _sum: { payoutAmount: true },
    where: { userId: user.id, status: 'DELIVERED' },
  });

  let balance = 0;
  if (sumResult._sum.payoutAmount) {
    balance = Number(sumResult._sum.payoutAmount.toString());
  } else {
    // fallback: compute by grouping delivered messages per range and multiplying by range.rate
    const groups = await prisma.trafficLog.groupBy({
      by: ['rangeId'],
      where: { userId: user.id, status: 'DELIVERED' },
      _count: { id: true },
    });

    for (const g of groups) {
      const range = await prisma.numberRange.findUnique({ where: { id: g.rangeId } });
      if (!range) continue;
      const rate = Number(range.rate.toString());
      balance += rate * g._count.id;
    }
  }

  // also provide counts and active ranges
  const dailyCount = await prisma.trafficLog.count({
    where: {
      userId: user.id,
      createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    },
  });

  const activeRanges = await prisma.numberRange.count({ where: { /* TODO: ranges claimed by user? */ } });

  return NextResponse.json({ data: { balance, dailyCount, activeRanges } });
}
