/**
 * Bridge LMS bearer authentication into the community routes. Demo identity
 * headers are available only outside production.
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret } = require('../../config/jwtSecret');

const DEFAULT_USER_ID = 'u1';

function resolveUserId(req) {
  if (req.authenticated && req.user && req.user.id != null) {
    return String(req.user.id);
  }
  const headerId = req.headers['x-user-id'];
  const queryId = req.query && req.query.userId;
  const bodyId = req.body && req.body.userId;
  return String(headerId || bodyId || queryId || DEFAULT_USER_ID);
}

function attachUser(req, res, next) {
  const authorization = String(req.headers.authorization || '');
  if (authorization.startsWith('Bearer ')) {
    try {
      const claims = jwt.verify(authorization.slice(7), getJwtSecret());
      if (claims.id == null || !claims.role) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
      }
      const id = String(claims.id);
      const directoryUser = process.env.NODE_ENV === 'production' ? null : User.findById(id);
      req.user = {
        ...(directoryUser || {}),
        id,
        email: claims.email || directoryUser?.email || '',
        name: claims.name || directoryUser?.name || String(claims.email || 'Learner').split('@')[0],
        username: directoryUser?.username || String(claims.email || id).split('@')[0],
        role: claims.role,
      };
      req.thinkzAuthenticatedUser = req.user;
      req.authenticated = true;
      if (req.user.banned) {
        return res.status(403).json({ success: false, message: 'This account cannot access the community.' });
      }
      return next();
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
  }

  if (process.env.NODE_ENV === 'production') {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  req.user = User.findById(resolveUserId(req)) || User.findById(DEFAULT_USER_ID);
  req.authenticated = false;
  return next();
}

module.exports = { attachUser, resolveUserId, DEFAULT_USER_ID };
