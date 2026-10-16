// Mint real JWTs for route tests, signed by the same code path the server uses
// (server/middleware/auth.js signToken), so tests exercise real verification.
//
//   request(server).post('/api/delivery/deliver/order-1').set(bearer('rider-A', 'delivery'))
const { signToken } = require('../../server/middleware/auth');

function tokenFor(id, role = 'customer', email = `${id}@example.com`) {
  return signToken({ id, role, email });
}

function bearer(id, role, email) {
  return { Authorization: `Bearer ${tokenFor(id, role, email)}` };
}

module.exports = { tokenFor, bearer };
