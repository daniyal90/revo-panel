import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { authenticate } from './middleware/auth';

test('authenticate allows demo user in demo mode', async () => {
  process.env.DEMO_MODE = 'true';
  process.env.LAMIX_MODE = 'development';
  process.env.JWT_SECRET = 'test-secret';

  const token = jwt.sign({ userId: 'demo-user-id', email: 'a@b.com', role: 'ADMIN' }, process.env.JWT_SECRET!);

  const req: any = { headers: { authorization: `Bearer ${token}` } };
  let called = false;
  const next = (err?: any) => {
    if (err) throw err;
    called = true;
  };

  await authenticate(req, {} as any, next);
  assert.ok(called, 'next was not called');
  assert.equal(req.user?.id, 'demo-user-id');
});
