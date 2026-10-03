import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Email helper may be unavailable in some environments; use dynamic import fallback
async function sendEmail(opts: { to: string; subject: string; text?: string; html?: string }) {
  try {
    const mod = await import('@/lib/email');
    if (mod?.sendEmail) return mod.sendEmail(opts as any);
  } catch (e) {
    console.warn('sendEmail module not available, skipping email:', (e as any)?.message || e);
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, action } = body; // action: APPROVE | REJECT
    if (!userId || !action) {
      return NextResponse.json({ error: 'userId and action required' }, { status: 400 });
    }

    const isActive = action === 'APPROVE';
    const status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

    // Yahan status aur isActive dono ko ek sath update karein
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { 
        status: status,
        isActive: isActive 
      },
      select: { id: true, email: true, name: true, isActive: true, status: true, role: true }
    });

    try {
      if (updated.email) {
        if (action === 'APPROVE') {
          await sendEmail({
            to: updated.email,
            subject: 'Your Revo Panel account has been approved',
            text: `Hello ${updated.name || ''},\n\nYour account has been approved by our admin team. You can now log in.`,
          });
        } else if (action === 'REJECT') {
          await sendEmail({
            to: updated.email,
            subject: 'Your Revo Panel account request was rejected',
            text: `Hello ${updated.name || ''},\n\nWe are sorry to inform you that your account registration was rejected. For details contact support.`,
          });
        }
      }
    } catch (e) {
      console.error('Failed to send approval email', e);
    }

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}