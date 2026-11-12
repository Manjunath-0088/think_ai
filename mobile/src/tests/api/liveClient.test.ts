import { apiData } from '@/api/http';
import { createLiveApiClient } from '@/api/liveClient';

jest.mock('@/api/http', () => ({ apiData: jest.fn() }));

const apiDataMock = apiData as jest.MockedFunction<typeof apiData>;

const catalogCourse = {
  id: 12,
  title: 'Mobile foundations',
  category: 'Mobile Development',
  description: 'Build native apps.',
  duration: '8 hours',
  price: 0,
  status: 'ACTIVE',
  thumbnail: null,
};

beforeEach(() => apiDataMock.mockReset());

it('reads the backend catalogue array and returns courses to Explore', async () => {
  apiDataMock.mockImplementation(async (path) => {
    if (path === '/courses') return [catalogCourse] as never;
    if (path === '/learner/enrollments') return [] as never;
    throw new Error(`Unexpected API path: ${path}`);
  });

  const result = await createLiveApiClient().searchCourses({ query: '', status: 'all' });

  expect(result.courses).toHaveLength(1);
  expect(result.courses[0]).toMatchObject({
    id: '12',
    title: 'Mobile foundations',
    isEnrolled: false,
  });
  expect(apiDataMock).toHaveBeenCalledWith('/courses', {
    query: { page: 1, limit: 100, search: '' },
  });
});

it('loads enrolled course details from the learner enrollment record', async () => {
  const enrollment = {
    id: 3,
    studentName: 'A learner',
    studentEmail: 'learner@example.test',
    enrollmentStatus: 'ENROLLED',
    enrolledAt: '2026-11-01T00:00:00.000Z',
    batchName: 'November',
    course: {
      ...catalogCourse,
      modules: [{
        id: 5,
        title: 'Getting started',
        lessons: [{ id: 8, title: 'Install the tools', duration: '10 minutes', videoUrl: 'https://example.test/lesson.mp4' }],
      }],
    },
    lessonProgress: [{ lessonId: 8, completed: false, watchedSeconds: 120, updatedAt: '2026-11-03T10:00:00.000Z' }],
  };
  apiDataMock.mockImplementation(async (path) => {
    if (path === '/learner/enrollments') return [enrollment] as never;
    throw new Error(`Unexpected API path: ${path}`);
  });

  const client = createLiveApiClient();
  const course = await client.fetchCourse('12');
  const [mappedEnrollment] = await client.fetchEnrollments();

  expect(course.isEnrolled).toBe(true);
  expect(course.modules[0]?.lessons[0]).toMatchObject({ id: '8', type: 'video' });
  expect(mappedEnrollment?.resumeLessonId).toBe('8');
  expect(apiDataMock).toHaveBeenCalledTimes(2);
});

it('uses the existing public single-course route when the paged list omits a course', async () => {
  apiDataMock.mockImplementation(async (path) => {
    if (path === '/learner/enrollments') return [] as never;
    if (path === '/courses') return [] as never;
    if (path === '/courses/99') return { ...catalogCourse, id: 99, title: 'Course 99' } as never;
    throw new Error(`Unexpected API path: ${path}`);
  });

  const course = await createLiveApiClient().fetchCourse('99');

  expect(course.title).toBe('Course 99');
  expect(apiDataMock).toHaveBeenCalledWith('/courses/99');
  expect(apiDataMock).not.toHaveBeenCalledWith('/courses/99/content');
});
