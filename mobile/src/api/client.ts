import type {
  CourseSearchParams,
  CourseSearchResult,
  Course,
  CreateThreadInput,
  Enrollment,
  ForumCategory,
  ForumThreadPage,
  ForumThreadQuery,
  GlobalSearchResponse,
  SearchResultType,
  UpdateLessonProgressInput,
} from '@/types';
import type {
  BookmarkPage,
  ContentActionResult,
  ContentTarget,
  CheckoutPlan,
  CommunityNotification,
  CreateDiscussionResult,
  DiscountValidation,
  FlagQueueItem,
  FlagReport,
  MentionUser,
  ModerationPolicy,
  NotificationPreferences,
  ModerationUser,
  AuditLogEntry,
  PaymentConfirmInput,
  PaymentConfirmation,
  PaymentIntent,
  PaymentIntentInput,
  PaymentStatusResponse,
  SubmitReplyInput,
  SubmitReplyResult,
  ThreadDetail,
  ThreadReply,
  UserPostSummary,
  VoteDirection,
  VoteResult,
} from '@/types/community';

/**
 * Single seam between the screens and the data layer.
 *
 * Every hook in this app depends on this interface only, so swapping the mock
 * implementation for a generated OpenAPI client is a one-line change in
 * `src/api/index.ts`. No component or screen imports a transport directly.
 */
export interface LearningApiClient {
  // Page 1 — Learner Dashboard
  fetchEnrollments(): Promise<Enrollment[]>;

  // Page 2 — My Courses
  searchCourses(params: CourseSearchParams): Promise<CourseSearchResult>;

  // Page 3 — Course Detail
  fetchCourse(courseId: string): Promise<Course>;
  /** Enrolls the signed-in learner, or returns the existing enrollment. */
  enrollCourse(courseId: string): Promise<Enrollment>;
  /** Marks a lesson complete/incomplete and returns the updated enrollment. */
  updateLessonProgress(input: UpdateLessonProgressInput): Promise<Enrollment>;

  // Page 4 — Global Search
  fetchAllTags(): Promise<string[]>;
  searchGlobal(
    query: string,
    type: SearchResultType
  ): Promise<GlobalSearchResponse>;

  // Page 5 — Forum Home
  fetchForumCategories(): Promise<ForumCategory[]>;
  fetchForumThreads(query: ForumThreadQuery): Promise<ForumThreadPage>;
  createThread(input: CreateThreadInput): Promise<{ id: string }>;

  // Page 6 — Forum Thread Detail (/forum/threads/:id)
  fetchThreadDetail(threadId: string): Promise<ThreadDetail>;
  fetchThreadReplies(threadId: string): Promise<ThreadReply[]>;
  submitReply(threadId: string, input: SubmitReplyInput): Promise<SubmitReplyResult>;
  voteThread(threadId: string, direction: VoteDirection): Promise<VoteResult>;
  setThreadSolved(threadId: string, solved: boolean): Promise<ThreadDetail>;
  searchMentionUsers(query: string): Promise<MentionUser[]>;

  // Shared forum notification preferences and notification center.
  fetchNotificationPreferences(userId: string): Promise<NotificationPreferences>;
  saveNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<NotificationPreferences>;
  fetchCommunityNotifications(unreadOnly?: boolean): Promise<CommunityNotification[]>;
  markCommunityNotificationRead(notificationId: string): Promise<CommunityNotification>;
  markAllCommunityNotificationsRead(): Promise<{ userId: string; marked: number }>;

  // Page 7 — Create Post (/forum/new)
  fetchDiscussionCategories(): Promise<ForumCategory[]>;
  fetchCommunityCategories(): Promise<ForumCategory[]>;
  createCommunityCategory(input: {
    name: string;
    color: string;
    description: string;
  }): Promise<ForumCategory>;
  updateCommunityCategory(
    categoryId: string,
    input: { name: string; color: string; description: string }
  ): Promise<ForumCategory>;
  deleteCommunityCategory(categoryId: string): Promise<void>;
  createDiscussion(input: CreateThreadInput): Promise<CreateDiscussionResult>;
  reportDiscussion(discussionId: string, reason: string): Promise<void>;
  reportComment(commentId: string, reason: string): Promise<void>;

  // Page 8 — Bookmarks (/forum/bookmarks)
  fetchBookmarks(): Promise<BookmarkPage>;
  addBookmark(userId: string, discussionId: string): Promise<void>;
  removeBookmark(userId: string, discussionId: string): Promise<void>;

  // Page 9 — Moderation Dashboard (/forum/moderate)
  fetchFlaggedQueue(): Promise<FlagQueueItem[]>;
  fetchFlagReports(): Promise<FlagReport[]>;
  fetchModerationPolicy(): Promise<ModerationPolicy>;
  fetchModerationUsers(): Promise<ModerationUser[]>;
  fetchAuditLog(): Promise<AuditLogEntry[]>;
  fetchUserPosts(authorUsername: string): Promise<UserPostSummary[]>;
  dismissFlag(target: ContentTarget): Promise<ContentActionResult>;
  setManagedContentVisibility(
    target: ContentTarget,
    hidden: boolean
  ): Promise<ContentActionResult>;
  deleteManagedContent(target: ContentTarget): Promise<ContentActionResult>;
  warnModerationUser(userId: string): Promise<ModerationUser>;
  banModerationUser(userId: string): Promise<ModerationUser>;
  unbanModerationUser(userId: string): Promise<ModerationUser>;

  // Page 10 — Checkout (/checkout)
  fetchPlans(): Promise<CheckoutPlan[]>;
  validateDiscountCode(input: {
    code: string;
    costCenter?: string;
    department?: string;
    amount?: number;
  }): Promise<DiscountValidation>;
  createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntent>;
  confirmPayment(input: PaymentConfirmInput): Promise<PaymentConfirmation>;
  fetchPaymentStatus(paymentId: string): Promise<PaymentStatusResponse>;
}

/** Method names owned by Pages 6–10 (the Day-2 community/commerce slice). */
export type CommunityApiMethod =
  | 'fetchThreadDetail'
  | 'fetchThreadReplies'
  | 'submitReply'
  | 'voteThread'
  | 'setThreadSolved'
  | 'searchMentionUsers'
  | 'fetchNotificationPreferences'
  | 'saveNotificationPreferences'
  | 'fetchCommunityNotifications'
  | 'markCommunityNotificationRead'
  | 'markAllCommunityNotificationsRead'
  | 'fetchDiscussionCategories'
  | 'fetchCommunityCategories'
  | 'createCommunityCategory'
  | 'updateCommunityCategory'
  | 'deleteCommunityCategory'
  | 'createDiscussion'
  | 'reportDiscussion'
  | 'reportComment'
  | 'fetchBookmarks'
  | 'addBookmark'
  | 'removeBookmark'
  | 'fetchFlaggedQueue'
  | 'fetchFlagReports'
  | 'fetchModerationPolicy'
  | 'fetchModerationUsers'
  | 'fetchAuditLog'
  | 'fetchUserPosts'
  | 'dismissFlag'
  | 'setManagedContentVisibility'
  | 'deleteManagedContent'
  | 'warnModerationUser'
  | 'banModerationUser'
  | 'unbanModerationUser'
  | 'fetchPlans'
  | 'validateDiscountCode'
  | 'createPaymentIntent'
  | 'confirmPayment'
  | 'fetchPaymentStatus';

/**
 * Pages 6–10 as a standalone surface. Implemented by the live HTTP client in
 * `src/api/communityClient.ts` (no mock data — every method hits the backend),
 * which is also what tests stub.
 */
export type CommunityApiClient = Pick<LearningApiClient, CommunityApiMethod>;
