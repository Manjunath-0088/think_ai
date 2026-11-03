const prisma = require('../../config/database');
const Discussion = require('../models/Discussion');

const TYPES = new Set(['course', 'lesson', 'forum', 'assessment']);
const LIMIT = 30;

function payload(results, type) {
  const empty = { course: [], lesson: [], forum: [], assessment: [] };
  const totals = { course: 0, lesson: 0, forum: 0, assessment: 0 };
  empty[type] = results;
  totals[type] = results.length;
  return { results: empty, totals };
}

function contains(value, query) {
  return String(value ?? '').toLocaleLowerCase().includes(query);
}

async function search(req, res) {
  const query = String(req.query.q ?? '').trim().toLocaleLowerCase();
  const type = String(req.query.type ?? 'course');
  if (!TYPES.has(type)) {
    return res.status(400).json({ success: false, message: 'Unsupported search type.' });
  }
  if (!query) return res.status(200).json({ success: true, data: payload([], type) });

  try {
    let results = [];
    if (type === 'course') {
      const rows = await prisma.course.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { title: 'asc' },
        take: LIMIT,
        select: { id: true, title: true, category: true, duration: true, description: true },
      });
      results = rows.map((row) => ({
        id: String(row.id),
        type,
        courseId: String(row.id),
        title: row.title,
        subtitle: [row.category, row.duration].filter(Boolean).join(' · '),
        href: `/learner/courses/${row.id}`,
      }));
    } else if (type === 'lesson') {
      const rows = await prisma.lesson.findMany({
        where: {
          module: { course: { status: 'ACTIVE' } },
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { content: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: [{ moduleId: 'asc' }, { order: 'asc' }, { id: 'asc' }],
        take: LIMIT,
        include: { module: { include: { course: { select: { id: true, title: true } } } } },
      });
      results = rows.map((row) => ({
        id: String(row.id),
        type,
        courseId: String(row.module.course.id),
        lessonId: String(row.id),
        title: row.title,
        subtitle: `${row.module.course.title}${row.duration ? ` · ${row.duration}` : ''}`,
        href: `/learner/courses/${row.module.course.id}/lessons/${row.id}`,
      }));
    } else if (type === 'assessment') {
      const rows = await prisma.assessment.findMany({
        where: {
          status: 'ACTIVE',
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        orderBy: { id: 'asc' },
        take: LIMIT,
        include: { module: { select: { courseId: true, title: true } } },
      });
      results = rows.map((row) => ({
        id: String(row.id),
        type,
        assessmentId: String(row.id),
        courseId: String(row.module.courseId),
        title: row.title,
        subtitle: `${row.totalMarks} marks · ${row.module.title}`,
        href: `/assessments/${row.id}`,
      }));
    } else {
      if (process.env.NODE_ENV === 'production' || process.env.COMMUNITY_STORAGE === 'postgres') {
        const rows = await prisma.forumDiscussion.findMany({
          where: { hidden: false, OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { body: { contains: query, mode: 'insensitive' } },
          ] },
          orderBy: { createdAt: 'desc' },
          take: LIMIT,
          include: { _count: { select: { comments: { where: { hidden: false } } } } },
        });
        results = rows.map((row) => ({
          id: row.id,
          type,
          title: row.title,
          subtitle: `${row._count.comments} replies · Community`,
          href: `/forum/threads/${row.id}`,
        }));
      } else {
        results = Discussion.listAll()
          .filter((row) => !row.hidden && (contains(row.title, query) || contains(row.body, query)))
          .slice(0, LIMIT)
          .map((row) => ({
            id: row.id,
            type,
            title: row.title,
            subtitle: `${row.replyCount ?? 0} replies · Community`,
            href: `/forum/threads/${row.id}`,
          }));
      }
    }

    return res.status(200).json({ success: true, data: payload(results, type) });
  } catch {
    return res.status(500).json({ success: false, message: 'Search is temporarily unavailable.' });
  }
}

module.exports = { search };
