const Notification = require("../models/Notification");
const { resolveUserId } = require("../middleware/authMiddleware");

function list(req, res) {
    const userId = req.authenticated ? resolveUserId(req) : (req.query.userId ? String(req.query.userId) : resolveUserId(req));
    const unreadOnly = req.query.unreadOnly === "true";
    res.status(200).json({ success: true, data: Notification.listByUser(userId, { unreadOnly }) });
}

function markRead(req, res) {
    const notification = req.authenticated
        ? Notification.markReadByUser(req.params.id, resolveUserId(req))
        : Notification.markRead(req.params.id);
    if (!notification) {
        return res.status(404).json({ success: false, message: "Notification not found" });
    }
    res.status(200).json({ success: true, data: Notification.serialize(notification) });
}

function markAllRead(req, res) {
    const userId = req.authenticated ? resolveUserId(req) : (req.body.userId ? String(req.body.userId) : resolveUserId(req));
    const marked = Notification.markAllRead(userId);
    res.status(200).json({ success: true, data: { userId, marked: marked.length } });
}

function getPrefs(req, res) {
    const userId = req.authenticated ? resolveUserId(req) : (req.params.userId || resolveUserId(req));
    if (req.authenticated && String(req.params.userId) !== userId && req.user.role !== "Admin") {
        return res.status(403).json({ success: false, message: "You can only view your own preferences" });
    }
    res.status(200).json({ success: true, data: Notification.getPrefs(userId) });
}

function savePrefs(req, res) {
    const userId = req.authenticated ? resolveUserId(req) : (req.params.userId || resolveUserId(req));
    if (req.authenticated && String(req.params.userId) !== userId && req.user.role !== "Admin") {
        return res.status(403).json({ success: false, message: "You can only update your own preferences" });
    }
    const saved = Notification.savePrefs(userId, req.body || {});
    res.status(200).json({ success: true, data: saved });
}

module.exports = { list, markRead, markAllRead, getPrefs, savePrefs };
