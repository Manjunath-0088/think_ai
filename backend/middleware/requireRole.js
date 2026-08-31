const { roleSatisfies } = require("../config/roleHierarchy");
// TEMPORARY: role passed via header or bearer token until real login/auth system exists
function requireRole(allowedRoles) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required: No token provided"
      });
    }

    if (!userRole || !roleSatisfies(userRole,allowedRoles)) {
      return res.status(403).json({ success: false, message: "Forbidden: insufficient role" });
    }
  };
};