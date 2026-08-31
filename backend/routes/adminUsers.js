const express = require("express");
const router = express.Router();
const { users } = require("../data/users");
const { roles } = require("../data/roles");
const requireRole = require("../middleware/requireRole");
const { logRoleChange } = require("../services/auditLogService");
const { successResponse, errorResponse } = require("../utils/response");
const { logAction } = require("../utils/auditLogger");
/**
 * GET /admin/users
 * Lists every user, with their current role.
 * Used by the Admin Users Page to populate the users table.
 */
router.get("/users", requireRole(["Admin"]), (req, res) => {
  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

/**
 * GET /admin/roles
 * Lists every role that exists in the system.
 * Used to populate a dropdown when an admin wants to assign/change someone's role.
 */
router.get("/roles", requireRole(["Admin"]), (req, res) => {
  res.status(200).json({
    success: true,
    data: roles,
  });
});

/**
 * POST /admin/users/:id/assign-role
 * Assigns a role to a user for the first time (e.g. a brand-new signup with no role yet).
 * Body: { "role": "Instructor" }
 */
router.post("/users/:id/assign-role", requireRole(["Admin"]), (req, res) => {
  const userId = parseInt(req.params.id);
  const { role } = req.body;
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  const oldRole = user.role;
  user.role = role;

  logRoleChange({
    actorRole: req.user.role,
    targetUserId: userId,
    targetUserName: user.name,
    oldRole: oldRole,
    newRole: role,
  });

  res.status(200).json({ success: true, message: "Role assigned" });
  
});

/**
 * PUT /admin/users/:id/role
 * Updates/changes an existing user's role (e.g. promoting a Learner to TA).
 * Body: { "role": "TA" }
 */
router.put("/users/:id/role",requireRole(["Admin"]), (req, res) => {
  const userId = parseInt(req.params.id);
  const { role } = req.body;
  const user = users.find((u) => u.id === userId);
  if (!user) return errorResponse(res, 404, "User not found");

  const oldRole = user.role;
  user.role = role;

  logRoleChange({
    actorRole: req.user.role,
    targetUserId: userId,
    targetUserName: user.name,
    oldRole: oldRole,
    newRole: role,
  });

  return successResponse(res, 200, "Role updated", user);
});

// 1. Toggle User Status (Active/Inactive)
router.patch("/users/:id/status", async(req, res) => {
  const userId = parseInt(req.params.id);
  const { status } = req.body; // "active" or "inactive"
  
  const user = users.find((u) => u.id === userId);
  if (!user) return errorResponse(res, 404, "User not found");
  
  user.status = status;
  await logAction({
    userId: userId,
    action:'STATUS_TOGGLE',
    targetType:'user',
    targetId:String(userId),
    metadata:{ newStatus: status},
  });
  return successResponse(res, 200, `User status updated to ${status}`, user);
});

// 2. Trigger Password Reset
router.post("/users/:id/reset-password", requireRole(["Admin"]), async (req, res) => {
  const userId = parseInt(req.params.id);
  
  const user = users.find((u) => u.id === userId);
  if (!user) return errorResponse(res, 404, "User not found");
  await logAction({
    userId: userId,
    action:'PASSWORD_RESET',
    targetType:'user',
    targetId:String(userId),
    metadata:{ },
  });
  return successResponse(res, 200, "Password reset email sent successfully", { userId });
});

// 3. Bulk Role Assignment
router.post("/users/bulk-role", requireRole(["Admin"]), (req, res) => {
  const { userIds, role } = req.body; // Array of IDs and target role
  
  if (!Array.isArray(userIds) || !role) {
    return errorResponse(res, 400, "Invalid payload");
  }
logRoleChange({
    actorRole: req.user.role,
    targetUserId: userId,
    targetUserName: user.name,
    oldRole: user.role,
    newRole: role,
  });

  const updatedUsers = [];
  users.forEach((u) => {
    if (userIds.includes(u.id)) {
      u.role = role;
      updatedUsers.push(u);
    }
  });

  return successResponse(res, 200, `Bulk role assigned to ${updatedUsers.length} users`, updatedUsers);
});

module.exports = router;