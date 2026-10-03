import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { decimalToNumber } from "@/lib/decimal";
// Email helper may be unavailable in some environments; provide a noop fallback
async function sendEmail(opts: { to: string; subject: string; text?: string; html?: string }) {
  try {
    // attempt dynamic import if available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = await import('@/lib/email');
    if (mod?.sendEmail) return mod.sendEmail(opts as any);
  } catch (e) {
    // fallback: log and continue
      console.warn('sendEmail module not available, skipping email:', (e as any)?.message || e);
  }
  return null;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    const where: any = {};
    if (status) where.status = status;

    const payouts = await prisma.payoutRequest.findMany({ where, orderBy: { createdAt: 'desc' }, include: { user: true } });

    return NextResponse.json({ data: payouts });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { payoutId, action } = body; // action: APPROVE | REJECT
    if (!payoutId || !action) return NextResponse.json({ error: 'payoutId and action required' }, { status: 400 });

    if (action === 'APPROVE') {
      const updated = await prisma.payoutRequest.update({ where: { id: payoutId }, data: { status: 'APPROVED', processedAt: new Date() }, include: { user: true } });
      try {
        if (updated.user?.email) {
          await sendEmail({
            to: updated.user.email,
            subject: 'Your payout has been approved',
            text: `Hello,\n\nYour payout request of $${Number(updated.amount).toFixed(2)} has been approved and is being processed.\n\nMethod: ${updated.method}`,
          });
        }
      } catch (e) {
        console.error('Failed to send payout approval email', e);
      }
      return NextResponse.json({ data: updated });
    } else if (action === 'REJECT') {
      const updated = await prisma.payoutRequest.update({ where: { id: payoutId }, data: { status: 'REJECTED', processedAt: new Date() }, include: { user: true } });
      try {
        if (updated.user?.email) {
          await sendEmail({
            to: updated.user.email,
            subject: 'Your payout request was rejected',
            text: `Hello,\n\nYour payout request of $${Number(updated.amount).toFixed(2)} was rejected. Please contact support for details.`,
          });
        }
      } catch (e) {
        console.error('Failed to send payout rejection email', e);
      }
      return NextResponse.json({ data: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
