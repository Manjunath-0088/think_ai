import { Linking } from 'react-native';

import {
  DEEP_LINK_PREFIXES,
  DEEP_LINK_ROUTES,
  consumeAllowedPendingDeepLink,
  getInitialDeepLink,
  __resetPendingDeepLinkForTests,
  isAuthGatedRoute,
  parseDeepLink,
  resolveDeepLink,
  rememberPendingDeepLink,
  subscribeToDeepLinks,
} from '@/navigation/deepLinks';
import { __resetSessionForTests, signIn } from '@/api/session';

describe('parseDeepLink', () => {
  it('recognises every configured prefix', () => {
    for (const prefix of DEEP_LINK_PREFIXES) {
      expect(parseDeepLink(`${prefix}learner/dashboard`)).not.toBeNull();
    }
  });

  it('rejects foreign URLs', () => {
    expect(parseDeepLink('https://evil.example.com/forum')).toBeNull();
  });

  it('strips slashes and splits path + query', () => {
    const parsed = parseDeepLink(
      'thinkzai:///learner/courses/course-1/?moduleId=mod-1#section'
    );

    expect(parsed?.path).toBe('learner/courses/course-1');
    expect(parsed?.segments).toEqual(['learner', 'courses', 'course-1']);
    expect(parsed?.query).toEqual({ moduleId: 'mod-1' });
  });

  it('decodes percent-encoded query values', () => {
    const parsed = parseDeepLink('thinkzai://forum?categoryId=a%2Fb');
    expect(parsed?.query.categoryId).toBe('a/b');
  });
});

describe('resolveDeepLink', () => {
  afterEach(() => {
    __resetSessionForTests();
  });

  it('maps a static route', () => {
    const result = resolveDeepLink('thinkzai://learner/dashboard', { isSignedIn: true });

    expect(result).toEqual({
      status: 'navigate',
      route: { screen: 'LearnerDashboard', params: {} },
    });
  });

  it('extracts path params', () => {
    const result = resolveDeepLink(
      'thinkzai://learner/courses/course-9?moduleId=mod-2',
      { isSignedIn: true },
    );

    expect(result).toEqual({
      status: 'navigate',
      route: {
        screen: 'CourseDetail',
        params: { courseId: 'course-9', moduleId: 'mod-2' },
      },
    });
  });

  it('passes through known query params on the forum index', () => {
    const result = resolveDeepLink('thinkzai://forum?categoryId=cat-1', { isSignedIn: true });

    expect(result).toEqual({
      status: 'navigate',
      route: { screen: 'ForumHome', params: { categoryId: 'cat-1' } },
    });
  });

  it('ignores unknown query params', () => {
    const result = resolveDeepLink('thinkzai://forum?utm_source=email', { isSignedIn: true });

    expect(result).toEqual({
      status: 'navigate',
      route: { screen: 'ForumHome', params: {} },
    });
  });

  it('accepts the short thinkz scheme and route aliases', () => {
    expect(resolveDeepLink('thinkz://course/course-7', { isSignedIn: true })).toEqual({
      status: 'navigate',
      route: { screen: 'CourseDetail', params: { courseId: 'course-7' } },
    });
    expect(resolveDeepLink('thinkz://forum/thread/thread-7', { isSignedIn: true })).toEqual({
      status: 'navigate',
      route: { screen: 'ForumThread', params: { threadId: 'thread-7' } },
    });
    expect(
      resolveDeepLink('thinkz://assessment/assess-7', { isSignedIn: true })
    ).toEqual({
      status: 'navigate',
      route: { screen: 'Assessment', params: { assessmentId: 'assess-7' } },
    });
  });

  it('reports not-found for an unmapped path', () => {
    expect(resolveDeepLink('thinkzai://does/not/exist')).toEqual({
      status: 'not-found',
      url: 'thinkzai://does/not/exist',
    });
  });

  it('bounces auth-gated routes to sign-in when signed out', () => {
    const result = resolveDeepLink('thinkzai://forum/bookmarks', {
      isSignedIn: false,
    });

    expect(result).toEqual({
      status: 'auth-required',
      route: { screen: 'Bookmarks', params: {} },
      redirectTo: 'Login',
    });
  });

  it('navigates auth-gated routes once signed in', () => {
    const result = resolveDeepLink('thinkzai://forum/bookmarks', {
      isSignedIn: true,
    });

    expect(result).toEqual({
      status: 'navigate',
      route: { screen: 'Bookmarks', params: {} },
    });
  });

  it('resumes a signed-out deep link after sign-in only when the role may open it', () => {
    rememberPendingDeepLink({ screen: 'ForumThread', params: { threadId: 'topic-8' } });
    expect(consumeAllowedPendingDeepLink('Learner')).toEqual({
      screen: 'ForumThread',
      params: { threadId: 'topic-8' },
    });
    rememberPendingDeepLink({ screen: 'Analytics', params: {} });
    expect(consumeAllowedPendingDeepLink('Learner')).toBeNull();
    expect(consumeAllowedPendingDeepLink('Admin')).toBeNull();
  });

  it('routes community categories and notifications through the forum deep links', () => {
    expect(resolveDeepLink('thinkzai://forum/categories', { isSignedIn: true })).toMatchObject({
      status: 'navigate', route: { screen: 'ForumCategories', params: {} },
    });
    expect(resolveDeepLink('thinkzai://forum/notifications', { isSignedIn: true })).toMatchObject({
      status: 'navigate', route: { screen: 'ForumNotifications', params: {} },
    });
    expect(resolveDeepLink('thinkzai://forum/notifications', { isSignedIn: false })).toMatchObject({
      status: 'auth-required', route: { screen: 'ForumNotifications', params: {} },
    });
  });

  it('opens website forum thread and section links in their Android routes', () => {
    expect(resolveDeepLink('thinkzai://forum/d2', { isSignedIn: true })).toMatchObject({
      status: 'navigate', route: { screen: 'ForumThread', params: { threadId: 'd2' } },
    });
    expect(resolveDeepLink('thinkzai://forum/preferences', { isSignedIn: true })).toMatchObject({
      status: 'navigate', route: { screen: 'NotificationPreferences', params: {} },
    });
    expect(resolveDeepLink('thinkzai://forum/studio', { isSignedIn: true })).toMatchObject({
      status: 'navigate', route: { screen: 'LiveStudio', params: {} },
    });
    expect(resolveDeepLink('thinkzai://forum/moderation', { isSignedIn: true })).toMatchObject({
      status: 'navigate', route: { screen: 'Moderation', params: {} },
    });
  });
});

describe('isAuthGatedRoute', () => {
  it('gates the routes that need a learner identity', () => {
    expect(isAuthGatedRoute('CreatePost')).toBe(true);
    expect(isAuthGatedRoute('Bookmarks')).toBe(true);
    expect(isAuthGatedRoute('Moderation')).toBe(true);
    expect(isAuthGatedRoute('Checkout')).toBe(true);
    expect(isAuthGatedRoute('LearnerDashboard')).toBe(true);
    expect(isAuthGatedRoute('ForumHome')).toBe(true);
  });

  it('leaves the auth entry points open', () => {
    expect(isAuthGatedRoute('Login')).toBe(false);
    expect(isAuthGatedRoute('Register')).toBe(false);
  });
});

describe('canonical route table', () => {
  it('covers each path exactly once', () => {
    const paths = Object.values(DEEP_LINK_ROUTES);
    expect(new Set(paths).size).toBe(paths.length);
  });
});

describe('subscribeToDeepLinks', () => {
  afterEach(() => {
    __resetSessionForTests();
    jest.restoreAllMocks();
  });

  it('resolves OS URL events and cleans up on unsubscribe', () => {
    const remove = jest.fn();
    let listener: ((event: { url: string }) => void) | undefined;
    jest
      .spyOn(Linking, 'addEventListener')
      .mockImplementation((_type, handler) => {
        listener = handler as (event: { url: string }) => void;
        return { remove } as unknown as ReturnType<
          typeof Linking.addEventListener
        >;
      });

    const handler = jest.fn();
    const unsubscribe = subscribeToDeepLinks(handler);

    listener?.({ url: 'thinkzai://search' });
    expect(handler).toHaveBeenCalledWith(
      {
        status: 'auth-required',
        route: { screen: 'GlobalSearch', params: {} },
        redirectTo: 'Login',
      },
      'thinkzai://search'
    );

    unsubscribe();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});

describe('getInitialDeepLink', () => {
  afterEach(() => {
    __resetSessionForTests();
    __resetPendingDeepLinkForTests();
    jest.restoreAllMocks();
  });

  it('returns null when the app was opened without a URL', async () => {
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(null);
    await expect(getInitialDeepLink()).resolves.toBeNull();
  });

  it('restores the session before gating the launch URL', async () => {
    jest
      .spyOn(Linking, 'getInitialURL')
      .mockResolvedValue('thinkzai://forum/moderate');
    await signIn('u42', 'test-bearer-token');

    const result = await getInitialDeepLink();

    expect(result).toEqual({
      status: 'navigate',
      route: { screen: 'Moderation', params: {} },
    });
  });
});
