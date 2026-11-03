/**
 * Idempotently imports the approved client-provided forum seed into PostgreSQL.
 * Existing discussions, replies, bookmarks and user preferences are preserved.
 */
require('dotenv').config();

const prisma = require('../config/database');
const seed = require('../src/data/mockData');

function slugify(value) {
  return String(value).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function resolveUsers() {
  const idMap = new Map();
  for (const user of seed.users) {
    const email = String(user.email || '').trim().toLowerCase() || null;
    const lmsUser = email ? await prisma.user.findUnique({ where: { email } }) : null;
    const byLmsId = lmsUser ? await prisma.communityUser.findUnique({ where: { lmsUserId: lmsUser.id } }) : null;
    const byEmail = email ? await prisma.communityUser.findUnique({ where: { email } }) : null;
    const id = byLmsId?.id || byEmail?.id || (lmsUser ? String(lmsUser.id) : String(user.id));
    const existing = await prisma.communityUser.findUnique({ where: { id } });
    const username = existing?.username || String(user.username || `learner_${id}`).slice(0, 32);
    await prisma.communityUser.upsert({
      where: { id },
      create: {
        id,
        lmsUserId: lmsUser?.id ?? null,
        name: user.name || email?.split('@')[0] || 'Thinkz AI learner',
        username,
        email,
        role: user.role || 'Learner',
        banned: Boolean(user.banned),
      },
      update: {
        ...(lmsUser ? { lmsUserId: lmsUser.id } : {}),
        name: existing?.name || user.name || 'Thinkz AI learner',
        role: ['Admin', 'Administrator', 'Moderator'].includes(existing?.role) ? existing.role : (user.role || existing?.role || 'Learner'),
      },
    });
    idMap.set(String(user.id), id);
  }
  return idMap;
}

async function main() {
  const userIds = await resolveUsers();
  const categoryIds = new Map();
  for (const category of seed.categories) {
    const slug = slugify(category.name);
    const existing = await prisma.forumCategory.findFirst({ where: { OR: [{ id: category.id }, { slug }] } });
    const row = existing || await prisma.forumCategory.create({
      data: { id: category.id, name: category.name, slug, color: category.color || '#6366f1', description: category.description || '' },
    });
    categoryIds.set(String(category.id), row.id);
  }

  const tagIds = new Map();
  for (const sourceTag of seed.tags) {
    const name = String(sourceTag.name || sourceTag).replace(/^#/, '').trim().toLowerCase();
    if (!name) continue;
    const slug = slugify(name);
    const existing = await prisma.forumTag.findFirst({ where: { OR: [{ name }, { slug }] } });
    const row = existing || await prisma.forumTag.create({ data: { id: `tag-${slug}`, name, slug } });
    tagIds.set(name, row.id);
  }

  const discussionIds = new Set();
  for (const discussion of seed.discussions) {
    const id = String(discussion.id);
    discussionIds.add(id);
    let row = await prisma.forumDiscussion.findUnique({ where: { id } });
    if (!row) {
      const authorId = userIds.get(String(discussion.authorId));
      if (!authorId) throw new Error(`No community author mapping for ${discussion.id}`);
      row = await prisma.forumDiscussion.create({
        data: {
          id,
          title: discussion.title,
          body: discussion.body,
          authorId,
          categoryId: categoryIds.get(String(discussion.categoryId)) || null,
          solved: Boolean(discussion.solved),
          hidden: Boolean(discussion.hidden),
          flagged: Boolean(discussion.flagged),
          pinned: Boolean(discussion.pinned),
          views: Number(discussion.views) || 0,
          seedUpvotes: Number(discussion.upvotes) || 0,
          seedDownvotes: Number(discussion.downvotes) || 0,
          flagReason: discussion.flagReason || null,
          createdAt: new Date(discussion.createdAt),
          updatedAt: new Date(discussion.updatedAt || discussion.createdAt),
        },
      });
    }
    for (const tagName of discussion.tags || []) {
      const tagId = tagIds.get(String(tagName).replace(/^#/, '').trim().toLowerCase());
      if (tagId) await prisma.forumDiscussionTag.upsert({
        where: { discussionId_tagId: { discussionId: id, tagId } },
        create: { discussionId: id, tagId },
        update: {},
      });
    }
  }

  const pendingParents = [];
  for (const comment of seed.comments) {
    const id = String(comment.id);
    if (!discussionIds.has(String(comment.discussionId))) continue;
    let row = await prisma.forumComment.findUnique({ where: { id } });
    if (!row) {
      const authorId = userIds.get(String(comment.authorId));
      if (!authorId) throw new Error(`No community author mapping for reply ${id}`);
      row = await prisma.forumComment.create({
        data: {
          id,
          discussionId: String(comment.discussionId),
          authorId,
          body: comment.body,
          hidden: Boolean(comment.hidden),
          flagged: Boolean(comment.flagged),
          createdAt: new Date(comment.createdAt),
          updatedAt: new Date(comment.createdAt),
        },
      });
    }
    if (comment.parentId) pendingParents.push({ id, parentId: String(comment.parentId) });
  }
  for (const relation of pendingParents) {
    if (await prisma.forumComment.findUnique({ where: { id: relation.parentId } })) {
      await prisma.forumComment.update({ where: { id: relation.id }, data: { parentId: relation.parentId } });
    }
  }

  for (const bookmark of seed.bookmarks) {
    const userId = userIds.get(String(bookmark.userId));
    if (!userId || !discussionIds.has(String(bookmark.discussionId))) continue;
    await prisma.forumBookmark.upsert({
      where: { userId_discussionId: { userId, discussionId: String(bookmark.discussionId) } },
      create: { userId, discussionId: String(bookmark.discussionId), createdAt: new Date(bookmark.createdAt) },
      update: {},
    });
  }

  for (const [sourceId, settings] of Object.entries(seed.notificationPrefs || {})) {
    const userId = userIds.get(String(sourceId));
    if (!userId) continue;
    await prisma.forumNotificationPreference.upsert({
      where: { userId },
      create: { userId, email: settings.email !== false, inApp: settings.inApp !== false, sms: settings.sms === true, settings },
      update: {},
    });
  }

  const [users, categories, discussions, comments, bookmarks] = await Promise.all([
    prisma.communityUser.count(), prisma.forumCategory.count(), prisma.forumDiscussion.count(),
    prisma.forumComment.count(), prisma.forumBookmark.count(),
  ]);
  console.log(JSON.stringify({ imported: true, users, categories, discussions, comments, bookmarks }));
}

main().catch((error) => {
  console.error(`Community seed import failed: ${error.message}`);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
