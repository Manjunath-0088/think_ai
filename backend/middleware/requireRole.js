const jwt = require('jsonwebtoken');
const { roleSatisfies } = require('../config/roleHierarchy');
const { logAccessDenied } = require('../services/auditLogService');
const { getJwtSecret } = require('../config/jwtSecret');

function requireRole(allowedRoles) {
  return (req, res, next) => {
    const requiredRoles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    const authHeader = req.headers.authorization;
    const demoRole = req.headers['x-demo-role'];
    const demoUserId = req.headers['x-demo-user-id'];
    let userRole = null;

    if (req.thinkzAuthenticatedUser) {
      req.user = req.thinkzAuthenticatedUser;
      userRole = req.user.role;
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.slice(7), getJwtSecret());
        req.user = decoded;
        req.thinkzAuthenticatedUser = decoded;
        userRole = decoded.role;
      } catch {
        return res.status(401).json({ success: false, message: 'Invalid or expired token' });
      }
    } else if (demoRole && process.env.NODE_ENV !== 'production') {
      req.user = { id: demoUserId || 'demo-user-1', role: demoRole };
      req.thinkzAuthenticatedUser = req.user;
      userRole = demoRole;
    } else {
      return res.status(401).json({
        success: false,
        message: 'Authentication required: No token or demo role provided',
      });
    }

    const hasPermission = typeof roleSatisfies === 'function'
      ? roleSatisfies(userRole, requiredRoles)
      : requiredRoles.includes(userRole);

    if (!hasPermission) {
      logAccessDenied({
        actorRole: userRole,
        targetUserId: req.user?.id,
        route: req.originalUrl,
        requiredRoles,
      });
      return res.status(403).json({
        success: false,
        code: 'INSUFFICIENT_ROLE',
        message: 'You do not have permission to access this resource.',
        requiredRoles,
      });
    }

    return next();
  };
}

module.exports = requireRole;
