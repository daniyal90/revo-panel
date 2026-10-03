import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  // public endpoint: list live ranges
  const ranges = await prisma.numberRange.findMany({
    where: { status: { not: 'DISABLED' } },
    orderBy: { destination: 'asc' },
  });

  const payload = ranges.map(r => ({
    id: r.id,
    destination: r.destination,
    carrierCode: r.carrierCode,
    prefix: r.prefix,
    rate: r.rate.toString(),
    status: r.status,
    smppHost: r.smppHost,
    smppPort: r.smppPort,
    webhookUrl: r.webhookUrl,
    updatedAt: r.updatedAt,
  }));

  return NextResponse.json({ data: payload });
}

async function getAdminUserFromApiKey(req: Request) {
  const apiKey = req.headers.get('x-api-key') || '';
  if (!apiKey) return null;
  const user = await prisma.user.findUnique({ where: { apiKey } });
  if (!user) return null;
  if (user.role !== 'ADMIN') return null;
  return user;
}

export async function POST(request: Request) {
  // admin endpoint: create or update ranges
  const admin = await getAdminUserFromApiKey(request);
  if (!admin) return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const body = await request.json();
  const {
    id,
    destination,
    carrierCode,
    prefix,
    rate,
    status,
    smppHost,
    smppPort,
    smppSystemId,
    smppPassword,
    webhookUrl,
  } = body;

  if (id) {
    const updated = await prisma.numberRange.update({
      where: { id },
    data: {
        destination,
        carrierCode,
        prefix,
        rate: rate ? String(rate) : undefined,
        status,
        smppHost,
        smppPort,
        smppSystemId,
        smppPassword,
        webhookUrl,
      },
    });
    return NextResponse.json({ data: updated });
  }

  const created = await prisma.numberRange.create({
    data: {
      destination,
      carrierCode,
      prefix,
      rate: rate ?? '0',
      status: status ?? 'LIVE',
      smppHost,
      smppPort,
      smppSystemId,
      smppPassword,
      webhookUrl,
    },
  });

  return NextResponse.json({ data: created });
}
