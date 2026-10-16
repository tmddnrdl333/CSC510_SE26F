// UC1: Sign up with a role (New user)
// Source under test: server/routes/auth.js (POST /register), server/models/User.js
// See proj1a-report/usecases.md for the authoritative main scenario + extensions.
//
// Environment note: Firestore is mocked (see tests/helpers/fakeFirestore.js) because neither
// Docker nor the Firestore emulator toolchain is available in this environment.

jest.mock('../server/config/firebase', () => require('./helpers/fakeFirestore').createFirestoreMock());

// axios lives only in server/node_modules (models/User.js is its sole consumer), so a bare
// jest.mock('axios', ...) cannot be resolved from tests/. Resolve it against the server dir and
// mock that exact module id. jest hoists this above the require()s below, so User.geocodeAddress()
// never makes a real network call.
jest.mock(
  require.resolve('axios', { paths: [require('path').join(__dirname, '..', 'server')] }),
  () => ({
    // No GOOGLE_MAPS_API_KEY in this env; a non-OK geocode response makes
    // User.geocodeAddress() resolve to null -- the same path a missing key hits.
    get: jest.fn().mockResolvedValue({ data: { status: 'REQUEST_DENIED', results: [] } }),
  })
);

const request = require('supertest');
const { db } = require('../server/config/firebase');
const authRoutes = require('../server/routes/auth');
const { buildApp } = require('./helpers/buildApp');

describe('UC1: Sign up with a role (New user)', () => {
  let server;

  beforeAll(() => {
    const app = buildApp({ '/api/auth': authRoutes });
    server = app.listen(0);
  });

  afterAll((done) => { server.close(done); });

  beforeEach(() => db.__reset());

  const validCustomer = () => ({
    email: 'newcustomer@example.com',
    password: 'supersecret',
    role: 'customer',
    profile: {
      name: 'New Customer',
      phone: '5551234567',
      address: { street: '1 Main St', city: 'Raleigh', state: 'NC', zipCode: '27601' },
    },
  });

  test('main success scenario: a valid role + profile creates the account and returns a safe payload (auth.js:8-39)', async () => {
    const res = await request(server).post('/api/auth/register').send(validCustomer());

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/registered successfully/i);
    expect(res.body.user).toMatchObject({ email: 'newcustomer@example.com', role: 'customer' });
    expect(res.body.user.id).toBeDefined();
    // toJSON() must not echo the credential back to the client.
    expect(res.body.user.password).toBeUndefined();
  });

  test('postcondition "user can log in": the just-registered credentials authenticate via POST /login (auth.js:47-74)', async () => {
    const created = await request(server).post('/api/auth/register').send(validCustomer());

    const login = await request(server)
      .post('/api/auth/login')
      .send({ email: 'newcustomer@example.com', password: 'supersecret' });

    expect(login.status).toBe(200);
    expect(login.body.user.id).toBe(created.body.user.id);
  });

  test('extension 3a: invalid email, password < 6 chars, and an unknown role are each rejected -> 400 (auth.js:9-11)', async () => {
    const badEmail = await request(server)
      .post('/api/auth/register')
      .send({ ...validCustomer(), email: 'not-an-email' });
    expect(badEmail.status).toBe(400);
    expect(badEmail.body.errors).toBeDefined();

    const shortPw = await request(server)
      .post('/api/auth/register')
      .send({ ...validCustomer(), password: '12345' });
    expect(shortPw.status).toBe(400);

    const badRole = await request(server)
      .post('/api/auth/register')
      .send({ ...validCustomer(), role: 'admin' });
    expect(badRole.status).toBe(400);
  });

  test('extension 3b: an email that is already registered is refused -> 400 (auth.js:23-26)', async () => {
    const first = await request(server).post('/api/auth/register').send(validCustomer());
    expect(first.status).toBe(201);

    const second = await request(server).post('/api/auth/register').send(validCustomer());
    expect(second.status).toBe(400);
    expect(second.body.error).toMatch(/already exists/i);
  });

  test('BONUS FINDING: a geocoding failure is swallowed -- registration still succeeds with location: null (models/User.js:41-45, 67-69)', async () => {
    // profile.address is present but there is no GOOGLE_MAPS_API_KEY, so geocodeAddress() returns
    // null and the account is created with no coordinates. UC4's distance sort then has nothing
    // to work from, but nothing here signals that to the user.
    const res = await request(server).post('/api/auth/register').send(validCustomer());
    expect(res.status).toBe(201);
    expect(res.body.user.location).toBeNull();
  });

  test('BONUS FINDING: the "role-specific profile" from step 1 is never validated -- an empty profile object is accepted (auth.js:12)', async () => {
    // usecases.md step 1: "User picks a role and fills the role-specific profile." The only
    // server-side check is body('profile').isObject(), so {} passes and a customer with no name,
    // phone, or address is created just fine.
    const res = await request(server)
      .post('/api/auth/register')
      .send({ email: 'empty@example.com', password: 'supersecret', role: 'customer', profile: {} });
    expect(res.status).toBe(201);
    expect(res.body.user.profile).toEqual({});
  });

  // --- HEADLINE FINDING (usecases.md UC1 extension 4a, fixed in M1) ---
  // 1a: auth.js stored req.body.password verbatim ("In production, hash this password"). M1
  // hashes with bcrypt before User.create(). We read the raw persisted document because
  // toJSON() hides the field from API responses.
  test('FIXED (M1): the password is persisted as a bcrypt hash, never in plaintext (auth.js /register)', async () => {
    await request(server).post('/api/auth/register').send(validCustomer());

    const snap = await db.collection('users').where('email', '==', 'newcustomer@example.com').get();
    expect(snap.empty).toBe(false);
    const stored = snap.docs[0].data().password;
    expect(stored).not.toContain('supersecret');
    expect(stored).toMatch(/^\$2[aby]\$10\$/);
  });

  test('M1: register and login both return a JWT for the new account', async () => {
    const created = await request(server).post('/api/auth/register').send(validCustomer());
    expect(typeof created.body.token).toBe('string');

    const login = await request(server)
      .post('/api/auth/login')
      .send({ email: 'newcustomer@example.com', password: 'supersecret' });
    expect(login.status).toBe(200);
    const [, payload] = login.body.token.split('.');
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    expect(claims).toMatchObject({ sub: created.body.user.id, role: 'customer' });
  });

  test('M1: a wrong password is rejected -> 401 and no token is issued', async () => {
    await request(server).post('/api/auth/register').send(validCustomer());

    const login = await request(server)
      .post('/api/auth/login')
      .send({ email: 'newcustomer@example.com', password: 'wrong-password' });
    expect(login.status).toBe(401);
    expect(login.body.token).toBeUndefined();
  });

  test('M1: an account created before M1 (plaintext password) still logs in, and is re-hashed on that login', async () => {
    db.__seed('users', 'legacy-1', { id: 'legacy-1', email: 'old@example.com', password: 'oldpass', role: 'customer', profile: {} });

    const login = await request(server).post('/api/auth/login').send({ email: 'old@example.com', password: 'oldpass' });
    expect(login.status).toBe(200);
    expect(login.body.token).toBeDefined();

    const stored = (await db.collection('users').doc('legacy-1').get()).data().password;
    expect(stored).toMatch(/^\$2[aby]\$/);

    // and the upgraded hash keeps working
    const again = await request(server).post('/api/auth/login').send({ email: 'old@example.com', password: 'oldpass' });
    expect(again.status).toBe(200);
  });

  // --- "Doc expectation" test from 1a ---
  // Was intentionally red until M1 hashed the password before User.create().
  test('[DOC EXPECTATION] the stored password must be hashed, not equal to the submitted value (fixed in M1)', async () => {
    await request(server).post('/api/auth/register').send(validCustomer());

    const snap = await db.collection('users').where('email', '==', 'newcustomer@example.com').get();
    expect(snap.docs[0].data().password).not.toBe('supersecret');
  });
});
