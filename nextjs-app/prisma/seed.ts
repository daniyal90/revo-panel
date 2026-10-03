import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@revo.local';
  const userEmail = 'user@revo.local';

  const adminApiKey = `revo_admin_${randomBytes(8).toString('hex')}`;
  const userApiKey = `revo_user_${randomBytes(8).toString('hex')}`;

  const adminPassword = await bcrypt.hash('ChangeMe123!', 10);
  const userPassword = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { apiKey: adminApiKey, passwordHash: adminPassword, role: 'ADMIN', isActive: true, status: 'APPROVED' },
    create: { email: adminEmail, name: 'Admin', apiKey: adminApiKey, passwordHash: adminPassword, role: 'ADMIN', isActive: true, status: 'APPROVED' },
  });

  await prisma.user.upsert({
    where: { email: userEmail },
    update: { apiKey: userApiKey, passwordHash: userPassword, role: 'USER', isActive: true, status: 'PENDING' },
    create: { email: userEmail, name: 'Demo User', apiKey: userApiKey, passwordHash: userPassword, role: 'USER', isActive: true, status: 'PENDING' },
  });

  const ranges = [
    { destination: 'Tanzania', carrierCode: 'LX', prefix: '+255', rate: '0.020' },
    { destination: 'Malaysia', carrierCode: 'XOX', prefix: '+60', rate: '0.015' },
    { destination: 'Kenya', carrierCode: 'KE', prefix: '+254', rate: '0.022' },
    { destination: 'Philippines', carrierCode: 'PH', prefix: '+63', rate: '0.018' },
    { destination: 'Nigeria', carrierCode: 'NG', prefix: '+234', rate: '0.025' },
    { destination: 'Ghana', carrierCode: 'GH', prefix: '+233', rate: '0.019' },
    { destination: 'Uganda', carrierCode: 'UG', prefix: '+256', rate: '0.017' },
  ];

  for (const r of ranges) {
    const existing = await prisma.numberRange.findFirst({ where: { destination: r.destination, prefix: r.prefix } });
    if (existing) {
      await prisma.numberRange.update({ where: { id: existing.id }, data: { rate: r.rate, status: 'LIVE' } });
    } else {
      await prisma.numberRange.create({ data: { destination: r.destination, carrierCode: r.carrierCode, prefix: r.prefix, rate: r.rate, status: 'LIVE' } });
    }
  }

  console.log('Seed completed. Admin:', adminEmail, 'user:', userEmail);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
