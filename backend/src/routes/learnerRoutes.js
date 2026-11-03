const express = require('express');

const prisma = require('../../config/database');
const authenticateToken = require('../../middleware/authenticateToken');
const authorizeRoles = require('../../middleware/requireRole');
const enrollmentService = require('../../services/enrollmentService');
const lessonProgressService = require('../../services/lessonProgressService');

const router = express.Router();
router.use(authenticateToken, authorizeRoles(['Learner']));

function currentEmail(req) {
  return typeof req.user?.email === 'string' ? req.user.email.trim().toLowerCase() : '';
}

function validId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function listEnrollments(email) {
  const rows = await prisma.enrollment.findMany({
    where: { studentEmail: { equals: email, mode: 'insensitive' } },
    include: {
      batch: {
        include: {
          course: {
            include: {
              modules: {
                orderBy: { id: 'asc' },
                include: { lessons: { orderBy: [{ order: 'asc' }, { id: 'asc' }] } },
              },
            },
          },
        },
      },
      lessonProgress: true,
    },
    orderBy: { enrolledAt: 'desc' },
  });

  return rows.map((row) => ({
    id: row.id,
    studentName: row.studentName,
    studentEmail: row.studentEmail,
    enrollmentStatus: row.enrollmentStatus,
    enrolledAt: row.enrolledAt,
    batchName: row.batch.name,
    course: row.batch.course,
    lessonProgress: row.lessonProgress,
  }));
}

router.get('/enrollments', async (req, res) => {
  const email = currentEmail(req);
  if (!email) {
    return res.status(401).json({ success: false, message: 'The signed-in account has no email.' });
  }
  try {
    return res.status(200).json({ success: true, data: await listEnrollments(email) });
  } catch {
    return res.status(500).json({ success: false, message: 'Failed to retrieve learner enrollments.' });
  }
});

router.post('/courses/:courseId/enroll', async (req, res) => {
  const email = currentEmail(req);
  const courseId = validId(req.params.courseId);
  if (!email || !courseId) {
    return res.status(400).json({ success: false, message: 'A valid learner account and course are required.' });
  }

  try {
    const userId = validId(req.user.id);
    const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
    if (!user || user.email.trim().toLowerCase() !== email) {
      return res.status(401).json({ success: false, message: 'The sign-in token is no longer valid.' });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, status: true } });
    if (!course || course.status !== 'ACTIVE') {
      return res.status(404).json({ success: false, message: 'Course not found or unavailable.' });
    }

    const batches = await prisma.batch.findMany({
      where: { courseId, status: 'ACTIVE' },
      orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
      include: { _count: { select: { enrollments: true } } },
    });
    const batch = batches.find((entry) => entry._count.enrollments < entry.capacity);
    if (!batch) {
      return res.status(409).json({ success: false, message: 'No active batch has a remaining seat.' });
    }

    const enrollment = await enrollmentService.createEnrollment({
      studentName: user.name || email.split('@')[0],
      studentEmail: email,
      batchId: batch.id,
    });
    const data = (await listEnrollments(email)).find((entry) => entry.id === enrollment.id);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    if (error.message === 'Student is already enrolled in this batch') {
      return res.status(409).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to enroll in this course.' });
  }
});

router.patch('/enrollments/:enrollmentId/lessons/:lessonId', async (req, res) => {
  const email = currentEmail(req);
  const enrollmentId = validId(req.params.enrollmentId);
  const lessonId = validId(req.params.lessonId);
  if (!email || !enrollmentId || !lessonId || typeof req.body?.completed !== 'boolean') {
    return res.status(400).json({ success: false, message: 'A valid enrollment, lesson, and completion state are required.' });
  }

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      select: {
        studentEmail: true,
        enrollmentStatus: true,
        batch: { select: { courseId: true } },
      },
    });
    if (!enrollment || enrollment.studentEmail.trim().toLowerCase() !== email) {
      return res.status(404).json({ success: false, message: 'Enrollment not found.' });
    }
    if (!['ACTIVE', 'ENROLLED'].includes(enrollment.enrollmentStatus)) {
      return res.status(403).json({ success: false, message: 'Enrollment is not active.' });
    }
    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, module: { courseId: enrollment.batch.courseId } },
      select: { id: true },
    });
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found in this course.' });
    }

    if (req.body.completed) {
      const result = await lessonProgressService.completeLesson(enrollmentId, lessonId);
      return res.status(200).json({ success: true, data: result.progress });
    }

    const existing = await prisma.lessonProgress.findUnique({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
    });
    const progress = await prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      update: {
        watchedSeconds: 0,
        watchPercentage: 0,
        completed: false,
        completedAt: null,
      },
      create: {
        enrollmentId,
        lessonId,
        watchedSeconds: 0,
        totalDuration: existing?.totalDuration ?? 0,
        watchPercentage: 0,
        completed: false,
        completedAt: null,
      },
    });
    return res.status(200).json({ success: true, data: progress });
  } catch (error) {
    if (error.message === 'Course access is not unlocked') {
      return res.status(403).json({ success: false, message: error.message });
    }
    if (error.message === 'Enrollment not found' || error.message === 'Lesson not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    return res.status(500).json({ success: false, message: 'Failed to update lesson progress.' });
  }
});

module.exports = router;
