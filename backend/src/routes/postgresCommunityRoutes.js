/**
 * PostgreSQL-backed community REST contract used by the Android client.
 * Mounted only when COMMUNITY_STORAGE=postgres or in production. The demo
 * in-memory router remains available for isolated local fixtures.
 */
const express = require('express');
const { attachUser, resolveUserId } = require('../middleware/authMiddleware');
const requireCommunityModerator = require('../middleware/requireCommunityModerator');
const community = require('../services/postgresCommunityService');
const payments = require('./paymentRoutes');
const studio = require('./studioRoutes');
const { moderatorRole, communityConfig, moderationThresholds } = require('../../config/forum.config');

const router = express.Router();
const forum = express.Router();
const moderation = express.Router();
const aliases = express.Router();
const users = express.Router();

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function ok(res, data, status = 200, extra = {}) {
  return res.status(status).json({ success: true, data, ...extra });
}

function userId(req) {
  return req.communityUser.id;
}

function validContentType(type) {
  return type === 'discussion' || type === 'comment';
}

router.use(attachUser);
router.use(asyncRoute(async (req, res, next) => {
  try {
    req.communityUser = await community.ensureCommunityUser(req.user);
  } catch (error) {
    return res.status(403).json({ success: false, message: error.message || 'Community account unavailable.' });
  }
  if (req.communityUser.banned) {
    return res.status(403).json({ success: false, message: 'This account cannot access the community.' });
  }
  return next();
}));

// Discussions
router.get('/discussions', asyncRoute(async (req, res) => ok(res, await community.listDiscussions(req.query, userId(req)))));
router.post('/discussions', asyncRoute(async (req, res) => {
  const data = await community.createDiscussion({ ...req.body, authorId: userId(req) });
  return ok(res, data, 201, { notificationsCreated: 0 });
}));
router.get('/discussions/:id', asyncRoute(async (req, res) => {
  const data = await community.getDiscussion(req.params.id, userId(req), true);
  return data ? ok(res, data) : res.status(404).json({ success: false, message: 'Discussion not found' });
}));
router.post('/discussions/:id/vote', asyncRoute(async (req, res) => {
  const data = await community.voteDiscussion(req.params.id, userId(req), req.body.direction);
  return data ? ok(res, data) : res.status(404).json({ success: false, message: 'Discussion not found' });
}));
router.patch('/discussions/:id/solved', asyncRoute(async (req, res) => {
  const data = await community.setSolved(req.params.id, Boolean(req.body.solved), req.communityUser);
  return data ? ok(res, data) : res.status(404).json({ success: false, message: 'Discussion not found' });
}));
router.post('/discussions/:id/flag', asyncRoute(async (req, res) => {
  const data = await community.reportContent({ type: 'discussion', id: req.params.id, reporterId: userId(req), reason: req.body.reason });
  return data ? ok(res, data, 201) : res.status(404).json({ success: false, message: 'Discussion not found' });
}));

// Comments and thread replies
router.get('/comments/:discussionId', asyncRoute(async (req, res) => ok(res, await community.listReplies(req.params.discussionId, ['Admin', 'Moderator'].includes(req.user.role)))));
router.post('/comments', asyncRoute(async (req, res) => {
  const discussionId = String(req.body.discussionId || '');
  const data = await community.createReply({ discussionId, parentId: req.body.parentId, body: req.body.body, authorId: userId(req) });
  return ok(res, data, 201, { notificationsCreated: 0 });
}));
router.post('/comments/:discussionId', asyncRoute(async (req, res) => {
  const data = await community.createReply({ discussionId: req.params.discussionId, parentId: req.body.parentId, body: req.body.body, authorId: userId(req) });
  return ok(res, data, 201, { notificationsCreated: 0 });
}));
router.post('/comments/:id/flag', asyncRoute(async (req, res) => {
  const data = await community.reportContent({ type: 'comment', id: req.params.id, reporterId: userId(req), reason: req.body.reason });
  return data ? ok(res, data, 201) : res.status(404).json({ success: false, message: 'Comment not found' });
}));

// Categories and tags
router.get('/categories', asyncRoute(async (_req, res) => ok(res, await community.listCategories())));
router.post('/categories', requireCommunityModerator, asyncRoute(async (req, res) => ok(res, await community.createCategory(req.body), 201)));
router.put('/categories/:id', requireCommunityModerator, asyncRoute(async (req, res) => {
  const data = await community.updateCategory(req.params.id, req.body);
  return data ? ok(res, data) : res.status(404).json({ success: false, message: 'Category not found' });
}));
router.delete('/categories/:id', requireCommunityModerator, asyncRoute(async (req, res) => {
  const removed = await community.deleteCategory(req.params.id);
  return removed ? ok(res, { id: req.params.id, deleted: true }) : res.status(404).json({ success: false, message: 'Category not found' });
}));
router.get('/tags', asyncRoute(async (_req, res) => ok(res, await community.listTags())));

// Bookmarks: caller identity is always derived from the authenticated token.
router.get('/bookmarks', asyncRoute(async (req, res) => ok(res, await community.listBookmarks(userId(req)), 200, { syncedAt: new Date().toISOString() })));
router.post('/bookmarks', asyncRoute(async (req, res) => {
  const result = await community.addBookmark(userId(req), String(req.body.discussionId || ''));
  return result ? ok(res, { userId: userId(req), discussionId: result.discussionId, bookmarked: true }, 201) : res.status(404).json({ success: false, message: 'Discussion not found' });
}));
router.delete('/bookmarks/:userId/:discussionId', asyncRoute(async (req, res) => {
  if (String(req.params.userId) !== userId(req) && req.user.role !== 'Admin') return res.status(403).json({ success: false, message: 'You can only remove your own bookmarks' });
  const removed = await community.removeBookmark(userId(req), req.params.discussionId);
  return removed ? ok(res, { userId: userId(req), discussionId: req.params.discussionId, bookmarked: false }) : res.status(404).json({ success: false, message: 'Bookmark not found' });
}));

// Per-user notifications and notification settings.
router.get('/notifications', asyncRoute(async (req, res) => ok(res, await community.listNotifications(userId(req), req.query.unreadOnly === 'true'))));
router.post('/notifications/read-all', asyncRoute(async (req, res) => ok(res, { userId: userId(req), marked: await community.markAllNotificationsRead(userId(req)) })));
router.patch('/notifications/:id/read', asyncRoute(async (req, res) => {
  const data = await community.markNotificationRead(userId(req), req.params.id);
  return data ? ok(res, data) : res.status(404).json({ success: false, message: 'Notification not found' });
}));
router.get('/notifications/preferences/:userId', asyncRoute(async (req, res) => {
  if (req.params.userId !== userId(req) && req.user.role !== 'Admin') return res.status(403).json({ success: false, message: 'You can only view your own preferences' });
  return ok(res, await community.getNotificationPreferences(userId(req)));
}));
router.put('/notifications/preferences/:userId', asyncRoute(async (req, res) => {
  if (req.params.userId !== userId(req) && req.user.role !== 'Admin') return res.status(403).json({ success: false, message: 'You can only update your own preferences' });
  return ok(res, await community.saveNotificationPreferences(userId(req), req.body));
}));

// Moderator endpoints
moderation.use(requireCommunityModerator);
moderation.get('/flagged', asyncRoute(async (_req, res) => ok(res, await community.flaggedQueue())));
moderation.get('/hidden', asyncRoute(async (_req, res) => {
  const [discussions, comments] = await Promise.all([
    community.prisma.forumDiscussion.findMany({ where: { hidden: true }, include: { author: true }, orderBy: { updatedAt: 'desc' } }),
    community.prisma.forumComment.findMany({ where: { hidden: true }, include: { author: true }, orderBy: { updatedAt: 'desc' } }),
  ]);
  return ok(res, [
    ...discussions.map((row) => ({ id: row.id, type: 'discussion', title: row.title, excerpt: row.body.slice(0, 160), reason: row.flagReason, hidden: true, authorName: row.author.name, authorId: row.authorId })),
    ...comments.map((row) => ({ id: row.id, type: 'comment', title: 'Reply', excerpt: row.body.slice(0, 160), reason: row.flagReason, hidden: true, authorName: row.author.name, authorId: row.authorId })),
  ]);
}));
moderation.get('/policy', (_req, res) => ok(res, { autoFlagReports: moderationThresholds.autoFlagReports, hideReports: moderationThresholds.hideReports, moderatorRole }));
moderation.get('/roles', asyncRoute(async (_req, res) => {
  const rows = await community.listModerationUsers();
  return ok(res, { role: moderatorRole, moderators: rows.filter((row) => ['Moderator', 'Admin', 'Administrator'].includes(row.role)), supportEmail: communityConfig.supportEmail });
}));
moderation.get('/reports', asyncRoute(async (_req, res) => ok(res, await community.reportLedger())));
moderation.get('/users', asyncRoute(async (req, res) => ok(res, await community.listModerationUsers(String(req.query.q || '')))));
moderation.get('/users/search', asyncRoute(async (req, res) => ok(res, await community.listModerationUsers(String(req.query.q || '')))));
moderation.get('/audit-log', asyncRoute(async (_req, res) => ok(res, await community.listAuditLog())));
moderation.post('/users/:id/ban', asyncRoute(async (req, res) => ok(res, await community.setUserStatus(req.params.id, userId(req), 'banned', true))));
moderation.post('/users/:id/unban', asyncRoute(async (req, res) => ok(res, await community.setUserStatus(req.params.id, userId(req), 'banned', false))));
moderation.post('/users/:id/warn', asyncRoute(async (req, res) => ok(res, await community.setUserStatus(req.params.id, userId(req), 'warned', true))));
moderation.post('/users/:id/mute', asyncRoute(async (req, res) => ok(res, await community.setUserStatus(req.params.id, userId(req), 'muted', req.body.muted !== false))));
moderation.patch('/content/:id', asyncRoute(async (req, res) => {
  const { type, hidden } = req.body || {};
  if (!validContentType(type)) return res.status(400).json({ success: false, message: "type must be 'discussion' or 'comment'" });
  const data = await community.actionContent({ type, id: req.params.id, action: hidden ? 'hide' : 'show', actorId: userId(req) });
  return data ? ok(res, data) : res.status(404).json({ success: false, message: `${type} not found` });
}));
moderation.post('/content/:id/resolve', asyncRoute(async (req, res) => {
  if (!validContentType(req.body?.type)) return res.status(400).json({ success: false, message: "type must be 'discussion' or 'comment'" });
  const data = await community.actionContent({ type: req.body.type, id: req.params.id, action: 'resolve', actorId: userId(req) });
  return data ? ok(res, data) : res.status(404).json({ success: false, message: `${req.body.type} not found` });
}));
router.use('/moderation', moderation);

// Mobile aliases for detail/replies, moderation actions, and user settings.
aliases.get('/threads/:id', asyncRoute(async (req, res) => {
  const data = await community.getDiscussion(req.params.id, userId(req), true);
  return data ? ok(res, data) : res.status(404).json({ success: false, message: 'Discussion not found' });
}));
aliases.get('/threads/:id/replies', asyncRoute(async (req, res) => ok(res, await community.listReplies(req.params.id, ['Admin', 'Moderator'].includes(req.user.role)))));
aliases.post('/threads/:id/replies', asyncRoute(async (req, res) => {
  const data = await community.createReply({ discussionId: req.params.id, parentId: req.body.parentId, body: req.body.body, authorId: userId(req) });
  return ok(res, data, 201, { notificationsCreated: 0 });
}));
aliases.patch('/threads/:id/solved', asyncRoute(async (req, res) => {
  const data = await community.setSolved(req.params.id, Boolean(req.body.solved), req.communityUser);
  return data ? ok(res, data) : res.status(404).json({ success: false, message: 'Discussion not found' });
}));
aliases.get('/flags', requireCommunityModerator, asyncRoute(async (_req, res) => ok(res, await community.flaggedQueue())));
aliases.patch('/posts/:id/action', requireCommunityModerator, asyncRoute(async (req, res) => {
  if (!validContentType(req.body?.type)) return res.status(400).json({ success: false, message: "type must be 'discussion' or 'comment'" });
  if (!['hide', 'show', 'delete', 'resolve'].includes(req.body.action)) return res.status(400).json({ success: false, message: 'Unsupported moderation action' });
  const data = await community.actionContent({ type: req.body.type, id: req.params.id, action: req.body.action, actorId: userId(req) });
  return data ? ok(res, data) : res.status(404).json({ success: false, message: `${req.body.type} not found` });
}));
router.use('/forum', aliases);

users.get('/search', asyncRoute(async (req, res) => ok(res, await community.listModerationUsers(String(req.query.q || '')))));
users.get('/:id/notification-preferences', asyncRoute(async (req, res) => {
  if (req.params.id !== userId(req) && req.user.role !== 'Admin') return res.status(403).json({ success: false, message: 'You can only view your own preferences' });
  return ok(res, await community.getNotificationPreferences(userId(req)));
}));
users.patch('/:id/notification-preferences', asyncRoute(async (req, res) => {
  if (req.params.id !== userId(req) && req.user.role !== 'Admin') return res.status(403).json({ success: false, message: 'You can only update your own preferences' });
  return ok(res, await community.saveNotificationPreferences(userId(req), req.body));
}));
router.use('/users', users);

// Preserve existing payment and live-studio API paths in production mode.
router.use('/v1/payments', payments);
router.use('/payments', payments);
router.use('/live-studio', studio);

router.use((req, res) => res.status(404).json({ success: false, message: `Forum route not found: ${req.method} ${req.originalUrl}` }));
router.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status || (error.message === 'Discussion not found' || error.message === 'Comment not found' ? 404 : 400);
  return res.status(status).json({ success: false, message: error.message || 'Community request failed.' });
});

module.exports = router;
