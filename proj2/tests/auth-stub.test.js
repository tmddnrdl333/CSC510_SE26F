// Temporary auth stub middleware (issue #27).
// Source under test: server/middleware/authStub.js
// To be deleted once M1's real JWT-verified auth middleware replaces it.

const request = require('supertest');
const express = require('express');
const { authStub } = require('../server/middleware/authStub');
const { buildApp } = require('./helpers/buildApp');

// authStub doesn't touch Firestore, so a tiny throwaway route is enough to
// observe what it sets on req.user — no fakeFirestore mock needed here.
const testRouter = express.Router();
testRouter.get('/whoami', authStub, (req, res) => {
  res.status(200).json({ user: req.user });
});

describe('authStub middleware (temporary, #27)', () => {
  let server;

  beforeAll(() => {
    const app = buildApp({ '/api/test': testRouter });
    server = app.listen(0);
  });

  afterAll((done) => { server.close(done); });

  test('x-test-user-id header present sets req.user.id', async () => {
    const res = await request(server)
      .get('/api/test/whoami')
      .set('x-test-user-id', 'user-123');

    expect(res.status).toBe(200);
    expect(res.body.user).toEqual({ id: 'user-123' });
  });

  test('x-test-user-id header missing returns 401', async () => {
    const res = await request(server).get('/api/test/whoami');

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/x-test-user-id/);
  });
});
