import { parseNativePlayerParams } from '@/navigation/playerRoute';

it('parses backend numeric identifiers for the native video player', () => {
  expect(parseNativePlayerParams('27', '104')).toEqual({ courseId: 27, lessonId: 104 });
  expect(parseNativePlayerParams('27')).toEqual({ courseId: 27 });
});

it('rejects nonnumeric course IDs and ignores an invalid optional lesson ID', () => {
  expect(parseNativePlayerParams('course-alpha', '104')).toBeNull();
  expect(parseNativePlayerParams('27', 'lesson-alpha')).toEqual({ courseId: 27 });
});
