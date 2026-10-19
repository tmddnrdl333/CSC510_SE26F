// M1 trust layer: server/middleware/auth.js
// The contract M2/M3 build on: requireAuth sets req.user.id (401 otherwise),
// requireRole 403s the wrong role, identity comes from the token not the body.
// Exercised through a tiny Express app so the real header parsing runs.

const express = require('express');
const request = require('supertest');
// jsonwebtoken is a server dependency (server/node_modules), so resolve it from there.
const jwt = require(require.resolve('jsonwebtoken', { paths: [require('path').join(__dirname, '..', 'server')] }));
const {
  requireAuth,
  requireRole,
  hashPassword,
  verifyPassword,
  isHashed,
  signToken,
  rejectIfBodyIdMismatch,
} = require('../server/middleware/auth');
const { bearer } = require('./helpers/authToken');

function appWith(...middleware) {
  const app = express();
  app.use(express.json());
  app.post('/probe', ...middleware, (req, res) => res.json({ user: req.user }));
  return app;
}

describe('M1: requireAuth', () => {
  const app = appWith(requireAuth);

  test('a valid token sets req.user = { id, role, email }', async () => {
    const res = await request(app).post('/probe').set(bearer('u-1', 'customer', 'u1@example.com'));
    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: 'u-1', role: 'customer', email: 'u1@example.com' });
  });

  test('no Authorization header -> 401', async () => {
    const res = await request(app).post('/probe');
    expect(res.status).toBe(401);
  });

  test('wrong scheme (Basic, or a bare token) -> 401', async () => {
    const token = signToken({ id: 'u-1', role: 'customer' });
    expect((await request(app).post('/probe').set('Authorization', `Basic ${token}`)).status).toBe(401);
    expect((await request(app).post('/probe').set('Authorization', token)).status).toBe(401);
  });

  test('a token signed with a different secret -> 401', async () => {
    const forged = jwt.sign({ role: 'delivery' }, 'attacker-secret', { subject: 'u-1' });
    const res = await request(app).post('/probe').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  test('an expired token -> 401', async () => {
    const real = jwt.decode(signToken({ id: 'u-1', role: 'customer' }));
    expect(real.exp).toBeGreaterThan(real.iat); // signToken sets an expiry
    const expired = jwt.sign(
      { role: 'customer', exp: Math.floor(Date.now() / 1000) - 60 },
      'hungry-wolf-dev-only-secret-do-not-use-in-production',
      { subject: 'u-1' }
    );
    const res = await request(app).post('/probe').set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  test('a token with alg "none" is not accepted -> 401', async () => {
    const unsigned = jwt.sign({ role: 'customer' }, null, { algorithm: 'none', subject: 'u-1' });
    const res = await request(app).post('/probe').set('Authorization', `Bearer ${unsigned}`);
    expect(res.status).toBe(401);
  });
});

describe('M1: requireRole', () => {
  const app = appWith(requireAuth, requireRole(['delivery']));

  test('allowed role passes', async () => {
    expect((await request(app).post('/probe').set(bearer('r-1', 'delivery'))).status).toBe(200);
  });

  test('other role -> 403', async () => {
    expect((await request(app).post('/probe').set(bearer('c-1', 'customer'))).status).toBe(403);
  });

  test('used without requireAuth first -> 401, never a silent pass', async () => {
    const bare = appWith(requireRole(['delivery']));
    expect((await request(bare).post('/probe')).status).toBe(401);
  });
});

describe('M1: rejectIfBodyIdMismatch', () => {
  const app = appWith(requireAuth, (req, res, next) =>
    rejectIfBodyIdMismatch(req, res, 'riderId') ? undefined : next()
  );

  test('matching body id passes', async () => {
    expect((await request(app).post('/probe').set(bearer('r-1', 'delivery')).send({ riderId: 'r-1' })).status).toBe(200);
  });

  test('absent body id passes (token is enough)', async () => {
    expect((await request(app).post('/probe').set(bearer('r-1', 'delivery')).send({})).status).toBe(200);
  });

  test("someone else's id in the body -> 403", async () => {
    expect((await request(app).post('/probe').set(bearer('r-1', 'delivery')).send({ riderId: 'r-2' })).status).toBe(403);
  });
});

describe('M1: password hashing', () => {
  test('hashPassword produces a bcrypt hash that verifyPassword accepts', async () => {
    const hash = await hashPassword('hunter22');
    expect(isHashed(hash)).toBe(true);
    expect(hash).not.toContain('hunter22');
    expect(await verifyPassword({ password: hash }, 'hunter22')).toBe(true);
    expect(await verifyPassword({ password: hash }, 'hunter23')).toBe(false);
  });

  test('two hashes of the same password differ (salted)', async () => {
    expect(await hashPassword('same')).not.toBe(await hashPassword('same'));
  });

  test('a legacy plaintext record is accepted once and upgraded through user.update()', async () => {
    const user = { password: 'legacy', update: jest.fn().mockResolvedValue() };
    expect(await verifyPassword(user, 'legacy')).toBe(true);
    expect(user.update).toHaveBeenCalledWith({ password: expect.stringMatching(/^\$2[aby]\$/) });
  });

  test('a legacy plaintext record with the wrong password is rejected and not upgraded', async () => {
    const user = { password: 'legacy', update: jest.fn() };
    expect(await verifyPassword(user, 'nope')).toBe(false);
    expect(user.update).not.toHaveBeenCalled();
  });

  test('no user, or a non-string password, is rejected', async () => {
    expect(await verifyPassword(null, 'x')).toBe(false);
    expect(await verifyPassword({ password: 'x' }, undefined)).toBe(false);
  });
});

describe('M1: JWT secret handling', () => {
  const saved = { secret: process.env.JWT_SECRET, env: process.env.NODE_ENV };
  afterEach(() => {
    if (saved.secret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = saved.secret;
    process.env.NODE_ENV = saved.env;
  });

  test('in production, signing without JWT_SECRET throws instead of using the dev fallback', () => {
    delete process.env.JWT_SECRET;
    process.env.NODE_ENV = 'production';
    expect(() => signToken({ id: 'u', role: 'customer' })).toThrow(/JWT_SECRET/);
  });

  test('JWT_SECRET, when set, is the key tokens are signed with', () => {
    process.env.JWT_SECRET = 'configured-secret';
    const token = signToken({ id: 'u', role: 'customer' });
    expect(jwt.verify(token, 'configured-secret').sub).toBe('u');
  });
});
