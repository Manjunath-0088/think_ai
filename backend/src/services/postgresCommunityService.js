const prisma = require('../../config/database');
const forumSocket = require('../websocket/forumSocket');
const { moderationThresholds } = require('../../config/forum.config');

const DEFAULT_PREFERENCES = {
  replies: { email: true, inApp: true, sms: false },
  mentions: { email: true, inApp: true, sms: false },
  sessions: { email: false, inApp: true, sms: false },
  payments: { email: true, inApp: true, sms: false },
};

const DISCUSSION_INCLUDE = {
  author: true,
  category: true,
  tags: { include: { tag: true } },
  votes: { select: { userId: true, direction: true } },
  _count: { select: { comments: { where: { hidden: false } } } },
};

function slugify(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function makeUserName(email, id) {
  const base = String(email || 'learner').split('@')[0].toLowerCase().replace(/[^a-z0-9_]+/g, '_').slice(0, 18) || 'learner';
  return `${base}_${String(id).replace(/[^a-z0-9]/gi, '').slice(-6) || 'user'}`;
}

async function ensureCommunityUser(claims) {
  const numericId = Number(claims.id);
  if (!Number.isSafeInteger(numericId) || numericId <= 0) throw new Error('Invalid account identity');
  const lmsUser = await prisma.user.findUnique({ where: { id: numericId } });
  if (!lmsUser || lmsUser.email.toLowerCase() !== String(claims.email || '').toLowerCase()) {
    throw new Error('The signed-in account no longer exists');
  }
  const id = String(lmsUser.id);
  const existing = await prisma.communityUser.findUnique({ where: { id } });
  const assignedModerator = existing?.role === 'Moderator' && !['Admin', 'Administrator'].includes(lmsUser.role);
  const currentRole = ['Admin', 'Administrator'].includes(lmsUser.role)
    ? lmsUser.role
    : assignedModerator ? 'Moderator' : lmsUser.role;
  return prisma.communityUser.upsert({
    where: { id },
    update: {
      lmsUserId: lmsUser.id,
      name: lmsUser.name || lmsUser.email.split('@')[0],
      email: lmsUser.email,
      role: currentRole,
    },
    create: {
      id,
      lmsUserId: lmsUser.id,
      name: lmsUser.name || lmsUser.email.split('@')[0],
      username: makeUserName(lmsUser.email, id),
      email: lmsUser.email,
      role: currentRole,
    },
  });
}

async function ensureCategory({ name, color = '#6366f1', description = '' }) {
  const cleanName = String(name || '').trim();
  if (!cleanName) throw new Error('Category name is required');
  const slug = slugify(cleanName);
  const existing = await prisma.forumCategory.findFirst({ where: { OR: [{ name: cleanName }, { slug }] } });
  if (existing) return existing;
  return prisma.forumCategory.create({ data: { id: `c-${slug || Date.now()}`, name: cleanName, slug, color, description } });
}

async function ensureTag(name) {
  const cleanName = String(name || '').trim().toLowerCase().replace(/^#/, '').slice(0, 40);
  if (!cleanName) return null;
  const slug = slugify(cleanName);
  const existing = await prisma.forumTag.findFirst({ where: { OR: [{ name: cleanName }, { slug }] } });
  return existing || prisma.forumTag.create({ data: { id: `tag-${slug || Date.now()}`, name: cleanName, slug } });
}

function serializeDiscussion(row, viewerId) {
  const votes = row.votes || [];
  const upvotes = (row.seedUpvotes || 0) + votes.filter((vote) => vote.direction === 'up').length;
  const downvotes = (row.seedDownvotes || 0) + votes.filter((vote) => vote.direction === 'down').length;
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    tags: (row.tags || []).map((entry) => entry.tag.name),
    categoryId: row.categoryId || 'c-general',
    authorId: row.authorId,
    author: { id: row.author.id, name: row.author.name, username: row.author.username },
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    solved: Boolean(row.solved),
    hidden: Boolean(row.hidden),
    flagged: Boolean(row.flagged),
    flagReason: row.flagReason || undefined,
    pinned: Boolean(row.pinned),
    views: row.views,
    upvotes,
    downvotes,
    score: upvotes - downvotes,
    replyCount: row._count?.comments ?? 0,
    userVote: votes.find((vote) => vote.userId === viewerId)?.direction || 'none',
  };
}

function serializeComment(row) {
  return {
    id: row.id,
    discussionId: row.discussionId,
    parentId: row.parentId,
    body: row.body,
    authorId: row.authorId,
    author: { id: row.author.id, name: row.author.name, username: row.author.username },
    createdAt: row.createdAt,
    hidden: Boolean(row.hidden),
  };
}

async function listDiscussions(query, viewerId) {
  const pageSize = Math.min(Math.max(Number(query.limit || query.pageSize) || 15, 1), 100);
  const page = Math.max(Number(query.page) || 1, 1);
  const where = { hidden: false };
  if (query.categoryId) where.categoryId = String(query.categoryId);
  if (query.solved === 'true' || query.solved === true) where.solved = true;
  if (query.solved === 'false' || query.solved === false) where.solved = false;
  if (query.search) {
    const term = String(query.search).trim();
    where.OR = [
      { title: { contains: term, mode: 'insensitive' } },
      { body: { contains: term, mode: 'insensitive' } },
    ];
  }
  // Accept `tags=jest,react`, `tags=jest&tags=react` and the legacy single `tag`.
  // Multiple tags are ANDed: a thread must carry every selected tag.
  const rawTags = query.tags ?? query.tag;
  const tagList = (Array.isArray(rawTags) ? rawTags : String(rawTags ?? '').split(','))
    .map((tag) => String(tag).trim().replace(/^#/, ''))
    .filter(Boolean);
  if (tagList.length) {
    where.AND = tagList.map((name) => ({
      tags: { some: { tag: { name: { equals: name, mode: 'insensitive' } } } },
    }));
  }
  if (query.author) {
    where.author = { OR: [
      { id: { contains: String(query.author), mode: 'insensitive' } },
      { username: { contains: String(query.author), mode: 'insensitive' } },
      { name: { contains: String(query.author), mode: 'insensitive' } },
    ] };
  }
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {};
    if (query.dateFrom) where.createdAt.gte = new Date(`${query.dateFrom}T00:00:00.000Z`);
    if (query.dateTo) where.createdAt.lte = new Date(`${query.dateTo}T23:59:59.999Z`);
  }

  const isVoteSort = query.sort === 'votes' || query.sort === 'most-voted';
  // `recently-active` sorts by the last reply; the reply writer bumps `updatedAt`.
  const isRecentlyActive = query.sort === 'recently-active' || query.sort === 'recent';
  const orderBy = isRecentlyActive
    ? [{ pinned: 'desc' }, { updatedAt: 'desc' }]
    : [{ pinned: 'desc' }, { createdAt: 'desc' }];

  const [total, rows] = await Promise.all([
    prisma.forumDiscussion.count({ where }),
    prisma.forumDiscussion.findMany({
      where,
      include: DISCUSSION_INCLUDE,
      orderBy,
      // Vote sorting is applied after the DB filter; cap prevents unbounded scans.
      take: isVoteSort ? 5000 : pageSize,
      skip: isVoteSort ? 0 : (page - 1) * pageSize,
    }),
  ]);
  let ordered = rows;
  if (isVoteSort) {
    ordered = [...rows].sort((left, right) => {
      const score = (row) => (row.seedUpvotes || 0) - (row.seedDownvotes || 0) + row.votes.reduce((sum, vote) => sum + (vote.direction === 'up' ? 1 : -1), 0);
      return Number(right.pinned) - Number(left.pinned) || score(right) - score(left) || right.createdAt - left.createdAt;
    }).slice((page - 1) * pageSize, page * pageSize);
  }
  const result = {
    items: ordered.map((row) => serializeDiscussion(row, viewerId)),
    page,
    limit: pageSize,
    total,
    totalPages: Math.max(Math.ceil(total / pageSize), 1),
    cached: false,
    responseTimeMs: 0,
  };
  return result;
}

async function getDiscussion(id, viewerId, incrementView = false) {
  if (incrementView) {
    await prisma.forumDiscussion.updateMany({ where: { id, hidden: false }, data: { views: { increment: 1 } } });
  }
  const row = await prisma.forumDiscussion.findFirst({ where: { id, hidden: false }, include: DISCUSSION_INCLUDE });
  return row ? serializeDiscussion(row, viewerId) : null;
}

async function createDiscussion({ title, body, tags = [], categoryId, authorId }) {
  const cleanTitle = String(title || '').trim();
  const cleanBody = String(body || '').trim();
  if (cleanTitle.length < 5 || cleanTitle.length > 150) throw new Error('Title must be between 5 and 150 characters');
  if (cleanBody.length < 10 || cleanBody.length > 5000) throw new Error('Body must be between 10 and 5000 characters');
  if (categoryId && !await prisma.forumCategory.findUnique({ where: { id: String(categoryId) } })) {
    throw new Error('Category not found');
  }
  const tagNames = [...new Set((Array.isArray(tags) ? tags : []).map((tag) => String(tag).trim().toLowerCase().replace(/^#/, '')).filter(Boolean))].slice(0, 6);
  const tagRows = await Promise.all(tagNames.map(ensureTag));
  const row = await prisma.forumDiscussion.create({
    data: {
      title: cleanTitle,
      body: cleanBody,
      authorId,
      categoryId: categoryId ? String(categoryId) : null,
      tags: { create: tagRows.filter(Boolean).map((tag) => ({ tag: { connect: { id: tag.id } } })) },
    },
    include: DISCUSSION_INCLUDE,
  });
  const serialized = serializeDiscussion(row, authorId);
  forumSocket.pushDiscussionNew(serialized);
  return serialized;
}

async function voteDiscussion(id, userId, direction) {
  if (!['up', 'down', 'none'].includes(direction)) throw new Error('direction must be one of: up, down, none');
  const discussion = await prisma.forumDiscussion.findFirst({ where: { id, hidden: false }, select: { seedUpvotes: true, seedDownvotes: true } });
  if (!discussion) return null;
  const existing = await prisma.forumDiscussionVote.findUnique({ where: { discussionId_userId: { discussionId: id, userId } } });
  if (direction === 'none' || existing?.direction === direction) {
    if (existing) await prisma.forumDiscussionVote.delete({ where: { id: existing.id } });
  } else {
    await prisma.forumDiscussionVote.upsert({
      where: { discussionId_userId: { discussionId: id, userId } },
      create: { discussionId: id, userId, direction },
      update: { direction },
    });
  }
  const votes = await prisma.forumDiscussionVote.findMany({ where: { discussionId: id }, select: { userId: true, direction: true } });
  const upvotes = discussion.seedUpvotes + votes.filter((vote) => vote.direction === 'up').length;
  const downvotes = discussion.seedDownvotes + votes.filter((vote) => vote.direction === 'down').length;
  return { id, upvotes, downvotes, score: upvotes - downvotes, userVote: votes.find((vote) => vote.userId === userId)?.direction || 'none' };
}

async function setSolved(id, solved, user) {
  const discussion = await prisma.forumDiscussion.findUnique({ where: { id } });
  if (!discussion) return null;
  if (discussion.authorId !== user.id && !['Admin', 'Moderator'].includes(user.role)) throw new Error('Only the thread author can change the solved state');
  await prisma.forumDiscussion.update({ where: { id }, data: { solved: Boolean(solved) } });
  return getDiscussion(id, user.id);
}

async function listReplies(discussionId, includeHidden = false) {
  const rows = await prisma.forumComment.findMany({
    where: { discussionId, ...(includeHidden ? {} : { hidden: false }) },
    include: { author: true },
    orderBy: { createdAt: 'asc' },
  });
  return rows.map(serializeComment);
}

async function createReply({ discussionId, parentId, body, authorId }) {
  const discussion = await prisma.forumDiscussion.findFirst({ where: { id: discussionId, hidden: false } });
  if (!discussion) throw new Error('Discussion not found');
  const cleanBody = String(body || '').trim();
  if (cleanBody.length < 2 || cleanBody.length > 5000) throw new Error('Comment must be between 2 and 5000 characters');
  if (parentId) {
    const parent = await prisma.forumComment.findFirst({ where: { id: String(parentId), discussionId } });
    if (!parent) throw new Error('Parent reply not found');
  }
  const reply = await prisma.forumComment.create({
    data: { discussionId, parentId: parentId ? String(parentId) : null, authorId, body: cleanBody },
    include: { author: true },
  });
  // Keep `recently-active` ordering meaningful: a reply is activity on the thread.
  await prisma.forumDiscussion.update({ where: { id: discussionId }, data: { updatedAt: new Date() } });
  const serialized = serializeComment(reply);
  if (discussion.authorId !== authorId) {
    await createNotification({ userId: discussion.authorId, actorId: authorId, type: 'reply', message: `${reply.author.name} replied to "${discussion.title}"`, link: `/forum/${discussionId}` });
  }
  const mentions = [...new Set(cleanBody.match(/@([a-zA-Z0-9_]{2,20})/g) || [])].map((mention) => mention.slice(1).toLowerCase());
  if (mentions.length) {
    const users = await prisma.communityUser.findMany({ where: { username: { in: mentions }, id: { not: authorId } } });
    await Promise.all(users.map((user) => createNotification({ userId: user.id, actorId: authorId, type: 'mention', message: `${reply.author.username} mentioned you in a reply`, link: `/forum/${discussionId}` })));
  }
  return serialized;
}

async function createNotification({ userId, actorId, type = 'system', message, link = '/forum' }) {
  if (!userId || !message) return null;
  const notification = await prisma.forumNotification.create({ data: { userId, actorId: actorId || null, type, message, link } });
  forumSocket.pushNotification(notification);
  return notification;
}

async function listCategories() {
  const rows = await prisma.forumCategory.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { discussions: { where: { hidden: false } } } } } });
  return rows.map((row) => ({ id: row.id, name: row.name, slug: row.slug, color: row.color, description: row.description || '', discussionCount: row._count.discussions }));
}

async function createCategory(input) {
  return ensureCategory(input);
}

async function updateCategory(id, patch) {
  const current = await prisma.forumCategory.findUnique({ where: { id } });
  if (!current) return null;
  const name = patch.name == null ? current.name : String(patch.name).trim();
  return prisma.forumCategory.update({ where: { id }, data: { name, slug: slugify(name), color: patch.color ?? current.color, description: patch.description ?? current.description } });
}

async function deleteCategory(id) {
  const existing = await prisma.forumCategory.findUnique({ where: { id } });
  if (!existing) return false;
  await prisma.forumCategory.delete({ where: { id } });
  return true;
}

async function listTags() {
  const tags = await prisma.forumTag.findMany({ orderBy: { name: 'asc' } });
  return tags.map((tag) => ({ name: tag.name, description: '' }));
}

async function listBookmarks(userId) {
  const rows = await prisma.forumBookmark.findMany({
    where: { userId, discussion: { hidden: false } },
    orderBy: { createdAt: 'desc' },
    include: { discussion: { include: DISCUSSION_INCLUDE } },
  });
  return rows.map((row) => ({ id: String(row.id), userId, discussionId: row.discussionId, createdAt: row.createdAt, discussion: serializeDiscussion(row.discussion, userId) }));
}

async function addBookmark(userId, discussionId) {
  if (!await prisma.forumDiscussion.findFirst({ where: { id: discussionId, hidden: false } })) return null;
  const result = await prisma.forumBookmark.upsert({
    where: { userId_discussionId: { userId, discussionId } },
    create: { userId, discussionId },
    update: {},
  });
  forumSocket.pushBookmarkChanged({ userId, discussionId, bookmarked: true });
  return result;
}

async function removeBookmark(userId, discussionId) {
  const result = await prisma.forumBookmark.deleteMany({ where: { userId, discussionId } });
  if (result.count) forumSocket.pushBookmarkChanged({ userId, discussionId, bookmarked: false });
  return result.count > 0;
}

async function listNotifications(userId, unreadOnly = false) {
  return prisma.forumNotification.findMany({ where: { userId, ...(unreadOnly ? { read: false } : {}) }, orderBy: { createdAt: 'desc' }, take: 100 });
}

async function markNotificationRead(userId, id) {
  const result = await prisma.forumNotification.updateMany({ where: { id, userId }, data: { read: true } });
  if (!result.count) return null;
  return prisma.forumNotification.findUnique({ where: { id } });
}

async function markAllNotificationsRead(userId) {
  const result = await prisma.forumNotification.updateMany({ where: { userId, read: false }, data: { read: true } });
  return result.count;
}

async function getNotificationPreferences(userId) {
  const existing = await prisma.forumNotificationPreference.findUnique({ where: { userId } });
  const saved = existing?.settings && typeof existing.settings === 'object' ? existing.settings : {};
  return Object.fromEntries(Object.entries(DEFAULT_PREFERENCES).map(([group, defaults]) => [group, { ...defaults, ...(saved[group] || {}) }]));
}

async function saveNotificationPreferences(userId, patch) {
  const current = await getNotificationPreferences(userId);
  for (const [group, defaults] of Object.entries(DEFAULT_PREFERENCES)) {
    const incoming = patch?.[group];
    if (!incoming || typeof incoming !== 'object') continue;
    for (const channel of Object.keys(defaults)) {
      if (typeof incoming[channel] === 'boolean') current[group][channel] = incoming[channel];
    }
  }
  const flat = patch && typeof patch === 'object' ? patch : {};
  await prisma.forumNotificationPreference.upsert({
    where: { userId },
    create: {
      userId,
      email: typeof flat.email === 'boolean' ? flat.email : true,
      inApp: typeof flat.inApp === 'boolean' ? flat.inApp : true,
      sms: typeof flat.sms === 'boolean' ? flat.sms : false,
      settings: current,
    },
    update: {
      email: typeof flat.email === 'boolean' ? flat.email : undefined,
      inApp: typeof flat.inApp === 'boolean' ? flat.inApp : undefined,
      sms: typeof flat.sms === 'boolean' ? flat.sms : undefined,
      settings: current,
    },
  });
  return current;
}

async function reportContent({ type, id, reporterId, reason }) {
  const model = type === 'discussion' ? prisma.forumDiscussion : prisma.forumComment;
  const content = await model.findUnique({ where: { id } });
  if (!content) return null;
  if (content.hidden) return { id, type, action: 'hidden-existing', reportCount: 0, flagged: content.flagged, hidden: true };
  const create = { authorId: reporterId, reason: reason || 'Reported by user', ...(type === 'discussion' ? { discussionId: id } : { commentId: id }) };
  const existing = await prisma.forumReport.findFirst({ where: { authorId: reporterId, ...(type === 'discussion' ? { discussionId: id } : { commentId: id }) } });
  if (!existing) {
    await prisma.forumReport.create({ data: create }).catch(async (error) => {
      // A concurrent duplicate report is already represented in the ledger.
      if (error.code !== 'P2002') throw error;
    });
  }
  const cutoff = new Date(Date.now() - moderationThresholds.hideWindowMs);
  const targetField = type === 'discussion' ? { discussionId: id } : { commentId: id };
  const reportCount = await prisma.forumReport.count({ where: { ...targetField, createdAt: { gte: cutoff }, status: 'open' } });
  const hidden = reportCount >= moderationThresholds.hideReports;
  const flagged = reportCount >= moderationThresholds.autoFlagReports;
  const action = hidden ? 'auto-hidden' : flagged ? 'flagged' : existing ? 'already-reported' : 'recorded';
  if (flagged || hidden) await model.update({ where: { id }, data: { flagged, hidden, flagReason: `${reportCount} reports (${action})` } });
  return { id, type, action, reportCount, flagged, hidden, autoFlagReports: moderationThresholds.autoFlagReports, hideReports: moderationThresholds.hideReports };
}

async function flaggedQueue() {
  const discussions = await prisma.forumDiscussion.findMany({ where: { flagged: true }, include: { author: true }, orderBy: { updatedAt: 'desc' } });
  const comments = await prisma.forumComment.findMany({ where: { flagged: true }, include: { author: true }, orderBy: { updatedAt: 'desc' } });
  const toItem = async (type, row) => {
    const reportCount = await prisma.forumReport.count({ where: type === 'discussion' ? { discussionId: row.id, status: 'open' } : { commentId: row.id, status: 'open' } });
    return { id: row.id, type, title: type === 'discussion' ? row.title : 'Reply', excerpt: row.body.slice(0, 160), reason: row.flagReason, flaggedAt: row.updatedAt, reporterName: 'Community report', hidden: row.hidden, authorName: row.author.name, authorId: row.authorId, reportCount, severity: reportCount >= moderationThresholds.hideReports ? 'high' : reportCount >= moderationThresholds.autoFlagReports ? 'medium' : 'low' };
  };
  return Promise.all([...discussions.map((row) => toItem('discussion', row)), ...comments.map((row) => toItem('comment', row))]);
}

async function reportLedger() {
  const rows = await prisma.forumReport.findMany({ include: { author: true, discussion: true, comment: true }, orderBy: { createdAt: 'desc' }, take: 500 });
  return rows.map((row) => ({ id: row.id, contentType: row.discussionId ? 'discussion' : 'comment', contentId: row.discussionId || row.commentId, reason: row.reason, createdAt: row.createdAt, reporterName: row.author.name, authorId: row.discussion?.authorId || row.comment?.authorId || null, excerpt: (row.discussion?.body || row.comment?.body || '').slice(0, 120) }));
}

async function listModerationUsers(query = '') {
  const where = query ? { OR: [
    { name: { contains: query, mode: 'insensitive' } },
    { username: { contains: query, mode: 'insensitive' } },
    { email: { contains: query, mode: 'insensitive' } },
  ] } : {};
  return prisma.communityUser.findMany({ where, orderBy: { name: 'asc' }, take: 200 });
}

async function actionContent({ type, id, action, actorId }) {
  const model = type === 'discussion' ? prisma.forumDiscussion : prisma.forumComment;
  const current = await model.findUnique({ where: { id } });
  if (!current) return null;
  let data = {};
  if (action === 'hide') data = { hidden: true };
  if (action === 'show') data = { hidden: false };
  if (action === 'resolve') data = { hidden: false, flagged: false };
  if (action === 'delete') data = { hidden: true, flagged: false };
  const updated = await model.update({ where: { id }, data });
  await prisma.forumReport.updateMany({ where: type === 'discussion' ? { discussionId: id } : { commentId: id }, data: { status: 'resolved' } });
  await prisma.forumAuditLog.create({ data: { actorId, targetContentId: id, contentType: type, action: `${action}_content` } });
  forumSocket.pushModerationUpdate({ action, contentType: type, contentId: id, hidden: updated.hidden, resolved: action === 'resolve' || action === 'delete' });
  return { id, type, hidden: updated.hidden, resolved: action === 'resolve' || action === 'delete', deleted: action === 'delete' };
}

async function listAuditLog() {
  const rows = await prisma.forumAuditLog.findMany({ include: { actor: true, targetUser: true }, orderBy: { createdAt: 'desc' }, take: 500 });
  return rows.map((row) => ({ id: row.id, type: row.action, actorId: row.actorId, actorName: row.actor?.name || 'System', targetUserId: row.targetUserId, targetUserName: row.targetUser?.name, targetContentId: row.targetContentId, contentType: row.contentType, detail: row.detail, timestamp: row.createdAt }));
}

async function setUserStatus(id, actorId, status, enabled = true) {
  const data = { [status]: enabled };
  const user = await prisma.communityUser.update({ where: { id }, data });
  await prisma.forumAuditLog.create({ data: { actorId, targetUserId: id, action: `${enabled ? '' : 'un'}${status}` } });
  forumSocket.pushModerationUpdate({ action: status, userId: id, [status]: enabled });
  return user;
}

async function listUserPosts(username) {
  const rows = await prisma.forumDiscussion.findMany({ where: { author: { username: { equals: username, mode: 'insensitive' } } }, orderBy: { createdAt: 'desc' }, take: 20 });
  return rows.map((row) => ({ id: row.id, title: row.title, excerpt: row.body.slice(0, 160), createdAt: row.createdAt, solved: row.solved, hidden: row.hidden, replyCount: 0 }));
}

module.exports = {
  prisma,
  ensureCommunityUser,
  ensureCategory,
  ensureTag,
  serializeDiscussion,
  serializeComment,
  listDiscussions,
  getDiscussion,
  createDiscussion,
  voteDiscussion,
  setSolved,
  listReplies,
  createReply,
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listTags,
  listBookmarks,
  addBookmark,
  removeBookmark,
  createNotification,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationPreferences,
  saveNotificationPreferences,
  reportContent,
  flaggedQueue,
  reportLedger,
  listModerationUsers,
  actionContent,
  listAuditLog,
  setUserStatus,
  listUserPosts,
  DEFAULT_PREFERENCES,
};
