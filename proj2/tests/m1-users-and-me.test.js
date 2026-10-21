// M1 trust layer: GET /api/auth/me and PUT /api/users/:id
// Before M1, PUT /api/users/:id passed req.body straight to user.update() with no
// auth, so anyone could set any user's role, password or totalEarnings.

jest.mock('../server/config/firebase', () =>
  require('./helpers/fakeFirestore').createFirestoreMock()
);

const request = require('supertest');
const { db } = require('../server/config/firebase');
const authRoutes = require('../server/routes/auth');
const userRoutes = require('../server/routes/users');
const { buildApp } = require('./helpers/buildApp');
const { bearer } = require('./helpers/authToken');

const app = buildApp({ '/api/auth': authRoutes, '/api/users': userRoutes });

function seedRider(extra = {}) {
  db.__seed('users', 'rider-A', {
    id: 'rider-A',
    email: 'rider-a@example.com',
    password: 'pw',
    role: 'delivery',
    profile: { name: 'Rider A' },
    totalEarnings: 12,
    ...extra,
  });
}

beforeEach(() => db.__reset());

describe('M1: GET /api/auth/me', () => {
  test('returns the logged-in user (without the password)', async () => {
    seedRider();
    const res = await request(app).get('/api/auth/me').set(bearer('rider-A', 'delivery'));
    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: 'rider-A', role: 'delivery', totalEarnings: 12 });
    expect(res.body.user.password).toBeUndefined();
  });

  test('no token -> 401', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
  });

  test('valid token for a deleted user -> 404', async () => {
    expect((await request(app).get('/api/auth/me').set(bearer('ghost', 'customer'))).status).toBe(
      404
    );
  });

  test('login -> token -> /me round trip', async () => {
    seedRider();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rider-a@example.com', password: 'pw' });
    expect(login.status).toBe(200);
    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(me.body.user.id).toBe('rider-A');
  });
});

describe('M1: PUT /api/users/:id', () => {
  test('no token -> 401, nothing changes', async () => {
    seedRider();
    const res = await request(app)
      .put('/api/users/rider-A')
      .send({ profile: { name: 'Hacked' } });
    expect(res.status).toBe(401);
    expect((await db.collection('users').doc('rider-A').get()).data().profile.name).toBe('Rider A');
  });

  test("editing someone else's account -> 403", async () => {
    seedRider();
    const res = await request(app)
      .put('/api/users/rider-A')
      .set(bearer('rider-B', 'delivery'))
      .send({ profile: { name: 'Hacked' } });
    expect(res.status).toBe(403);
    expect((await db.collection('users').doc('rider-A').get()).data().profile.name).toBe('Rider A');
  });

  test('a user can update their own profile', async () => {
    seedRider();
    const res = await request(app)
      .put('/api/users/rider-A')
      .set(bearer('rider-A', 'delivery'))
      .send({ profile: { name: 'Rider A2' } });
    expect(res.status).toBe(200);
    expect((await db.collection('users').doc('rider-A').get()).data().profile.name).toBe(
      'Rider A2'
    );
  });

  test('role, password and totalEarnings in the body are ignored', async () => {
    seedRider();
    const res = await request(app)
      .put('/api/users/rider-A')
      .set(bearer('rider-A', 'delivery'))
      .send({
        profile: { name: 'Rider A' },
        role: 'restaurant',
        password: 'x',
        totalEarnings: 1e9,
      });
    expect(res.status).toBe(200);
    const stored = (await db.collection('users').doc('rider-A').get()).data();
    expect(stored.role).toBe('delivery');
    expect(stored.password).toBe('pw');
    expect(stored.totalEarnings).toBe(12);
  });
});
