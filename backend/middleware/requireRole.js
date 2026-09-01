const jwt = require('jsonwebtoken');
const { roleSatisfies } = require("../config/roleHierarchy"); // Ensure this file exists, or handle role matching directly

function requireRole(allowedRoles) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required: No token provided"
      });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Attach user info (id, email, role) to request

      // Check role permissions
      const userRole = req.user.role;
      
      // If roleSatisfies exists use it, otherwise simple array check: allowedRoles.includes(userRole)
      const hasPermission = typeof roleSatisfies === 'function' 
        ? roleSatisfies(userRole, allowedRoles) 
        : allowedRoles.includes(userRole);

      if (!hasPermission) {
        return res.status(403).json({ success: false, message: "Forbidden: insufficient role" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: "Invalid or expired token" });
    }
  };
}

module.exports = requireRole;