// M1 trust layer: password hashing + JWT sessions.
//
// Contract other milestones depend on (see docs/plans/m1-trust-layer.md §2):
//   requireAuth      -> verifies `Authorization: Bearer <jwt>`, sets
//                       req.user = { id, role, email }, or responds 401.
//   requireRole([r]) -> responds 403 unless req.user.role is one of r.
// Identity always comes from the token, never from the request body.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const BCRYPT_ROUNDS = 10;
const TOKEN_TTL = '7d';
// Only used outside production so tests and local dev need no setup.
const DEV_FALLBACK_SECRET = 'hungry-wolf-dev-only-secret-do-not-use-in-production';

function getJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return DEV_FALLBACK_SECRET;
}

/** Hash a plaintext password for storage. */
async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/** bcrypt hashes start with $2a$/$2b$/$2y$; anything else is a pre-M1 plaintext record. */
function isHashed(stored) {
  return typeof stored === 'string' && /^\$2[aby]\$\d{2}\$/.test(stored);
}

/**
 * Check a submitted password against a user's stored one.
 * Accounts created before M1 still hold plaintext; they are accepted once and
 * re-hashed in place, so existing seed data keeps working.
 */
async function verifyPassword(user, plain) {
  if (!user || typeof plain !== 'string') return false;

  if (isHashed(user.password)) {
    return bcrypt.compare(plain, user.password);
  }

  if (user.password !== plain) return false;
  if (typeof user.update === 'function') {
    try {
      await user.update({ password: await hashPassword(plain) });
    } catch (error) {
      console.error('Failed to upgrade legacy plaintext password:', error.message);
    }
  }
  return true;
}

/** Issue a signed session token for a user. */
function signToken(user) {
  return jwt.sign({ role: user.role, email: user.email }, getJwtSecret(), {
    subject: String(user.id),
    expiresIn: TOKEN_TTL,
  });
}

const requireAuth = (req, res, next) => {
  const header = (req.headers && req.headers.authorization) || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, getJwtSecret());
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const requireRole = (allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
  }
  return next();
};

/**
 * Older clients still send their own id in the body (riderId, customerId).
 * It is no longer trusted; if present it must match the token or we 403.
 * Returns true when the request was rejected.
 */
function rejectIfBodyIdMismatch(req, res, field) {
  const claimed = req.body && req.body[field];
  if (claimed !== undefined && claimed !== null && String(claimed) !== req.user.id) {
    res.status(403).json({ error: `${field} does not match the logged-in user.` });
    return true;
  }
  return false;
}

module.exports = {
  requireAuth,
  requireRole,
  hashPassword,
  verifyPassword,
  isHashed,
  signToken,
  rejectIfBodyIdMismatch,
  // Kept for any caller of the old name; same behaviour as requireRole.
  roleMiddleware: requireRole,
};
