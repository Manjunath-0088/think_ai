/**
 * Backend API Client for the root community website.
 * 
 * Replaces the localStorage-based ForumApi with calls to the ThinkZai backend.
 * Uses the same API contract as the mobile app.
 * 
 * Base URL: /api (relative to the backend)
 * Auth: Bearer token in Authorization header
 */

const API_BASE = '/api';

// Token storage key (shared with auth system)
const TOKEN_KEY = 'thinkz_auth_token';
const USER_ID_KEY = 'thinkz_user_id';

/**
 * Get stored auth token
 */
function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get stored user ID
 */
function getUserId() {
  return localStorage.getItem(USER_ID_KEY);
}

/**
 * Set auth token and user ID
 */
export function setAuth(token, userId) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (userId) localStorage.setItem(USER_ID_KEY, userId);
}

/**
 * Clear auth data
 */
export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getAuthToken();
}

/**
 * Build headers for API requests
 */
function buildHeaders(hasBody = false) {
  const headers = {
    'Accept': 'application/json',
    'x-user-id': getUserId() || 'anonymous',
  };
  
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
  
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Generic API request function
 */
async function apiRequest(path, options = {}) {
  const { method = 'GET', body, query } = options;
  const hasBody = body !== undefined;
  
  let url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  if (query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
  }
  
  try {
    const response = await fetch(url, {
      method,
      headers: buildHeaders(hasBody),
      body: hasBody ? JSON.stringify(body) : undefined,
    });
    
    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
    
    if (!response.ok || payload?.success === false) {
      const message = payload?.message ?? `Request failed (${response.status})`;
      throw new Error(message);
    }
    
    return payload;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error — is the backend running?');
    }
    throw error;
  }
}

/**
 * Unwrap the { success, data } envelope
 */
async function apiData(path, options = {}) {
  const payload = await apiRequest(path, options);
  return payload?.data;
}

/**
 * Forum/Community API Client
 * Mirrors the mobile app's communityClient.ts interface
 */
export const BackendCommunityApi = {
  // ---- Discussions ----
  
  async getPosts(params = {}) {
    const query = {
      page: params.page || 1,
      limit: params.limit || 15,
      sort: params.sort || 'recent',
      categoryId: params.categoryId,
      solved: params.solved,
      search: params.search,
      tags: params.tags,
      author: params.author,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    };
    const data = await apiData('/discussions', { query });
    return data?.items || [];
  },
  
  async getPostById(postId) {
    return apiData(`/discussions/${encodeURIComponent(postId)}`);
  },
  
  async getPostsByAuthor(authorId, params = {}) {
    const data = await apiData('/discussions', { 
      query: { author: authorId, limit: params.limit || 20, sort: 'recent' } 
    });
    return data?.items || [];
  },
  
  async addPost({ title, content, tags = [], authorId }) {
    const payload = await apiRequest('/discussions', {
      method: 'POST',
      body: { title, body: content, tags, categoryId: null },
    });
    return payload.data;
  },
  
  async votePost(postId, direction) {
    const payload = await apiRequest(`/discussions/${encodeURIComponent(postId)}/vote`, {
      method: 'POST',
      body: { direction },
    });
    return payload.data;
  },
  
  async toggleSolved(postId) {
    // Get current state first
    const post = await this.getPostById(postId);
    const payload = await apiRequest(`/discussions/${encodeURIComponent(postId)}/solved`, {
      method: 'PATCH',
      body: { solved: !post.solved },
    });
    return payload.data;
  },
  
  async searchPosts({ keyword = '', tag = '', author = '' } = {}) {
    const data = await apiData('/discussions', {
      query: { 
        search: keyword || undefined,
        tags: tag || undefined,
        author: author || undefined,
        limit: 50,
      }
    });
    return data?.items || [];
  },
  
  // ---- Comments/Replies ----
  
  async getComments(postId) {
    return apiData(`/comments/${encodeURIComponent(postId)}`);
  },
  
  async addComment(postId, { authorId, content }) {
    const payload = await apiRequest('/comments', {
      method: 'POST',
      body: { discussionId: postId, body: content, parentId: null },
    });
    return payload.data;
  },
  
  // ---- Categories & Tags ----
  
  async getCategories() {
    return apiData('/categories');
  },
  
  async getTags() {
    const data = await apiData('/tags');
    return data?.map(t => t.name) || [];
  },
  
  // ---- Users ----
  
  async getUsers() {
    // This endpoint might not exist in the backend; return empty array
    return [];
  },
  
  async getUserById(userId) {
    try {
      return await apiData(`/users/${encodeURIComponent(userId)}/notification-preferences`);
    } catch {
      return null;
    }
  },
  
  async getUserByUsername(username) {
    // Search for user by username
    try {
      const data = await apiData('/users/search', { query: { q: username } });
      return data?.[0] || null;
    } catch {
      return null;
    }
  },
  
  // ---- Bookmarks ----
  
  async getBookmarks() {
    const data = await apiData('/bookmarks');
    return data?.bookmarks?.map(b => b.discussionId) || [];
  },
  
  async addBookmark(userId, discussionId) {
    const payload = await apiRequest('/bookmarks', {
      method: 'POST',
      body: { userId, discussionId },
    });
    return payload.data;
  },
  
  async removeBookmark(userId, discussionId) {
    await apiRequest(`/bookmarks/${encodeURIComponent(userId)}/${encodeURIComponent(discussionId)}`, {
      method: 'DELETE',
    });
    return { postId: discussionId, bookmarked: false };
  },
  
  // ---- Notifications ----
  
  async getNotifications(unreadOnly = false) {
    return apiData('/notifications', { query: { unreadOnly: unreadOnly ? 'true' : undefined } });
  },
  
  async markNotificationRead(notificationId) {
    const payload = await apiRequest(`/notifications/${encodeURIComponent(notificationId)}/read`, {
      method: 'PATCH',
    });
    return payload.data;
  },
  
  async markAllNotificationsRead() {
    const payload = await apiRequest('/notifications/read-all', {
      method: 'POST',
      body: {},
    });
    return payload.data;
  },
  
  async getNotificationPreferences(userId) {
    return apiData(`/notifications/preferences/${encodeURIComponent(userId)}`);
  },
  
  async saveNotificationPreferences(userId, preferences) {
    const payload = await apiRequest(`/notifications/preferences/${encodeURIComponent(userId)}`, {
      method: 'PUT',
      body: preferences,
    });
    return payload.data;
  },
};

/**
 * Alias for backward compatibility
 * This allows gradual migration from ForumApi to BackendCommunityApi
 */
export const ForumApi = {
  async getPosts() {
    const posts = await BackendCommunityApi.getPosts();
    // Transform to match old format
    return posts.map(p => ({
      id: p.id,
      authorId: p.authorId,
      title: p.title,
      content: p.body,
      tags: p.tags,
      upvotes: p.upvotes,
      downvotes: p.downvotes,
      views: p.views,
      replies: p.replyCount,
      isSolved: p.solved,
      isPinned: p.pinned,
      createdAt: p.createdAt,
    }));
  },
  
  async getPostById(postId) {
    const p = await BackendCommunityApi.getPostById(postId);
    return p ? {
      id: p.id,
      authorId: p.authorId,
      title: p.title,
      content: p.body,
      tags: p.tags,
      upvotes: p.upvotes,
      downvotes: p.downvotes,
      views: p.views,
      replies: p.replyCount,
      isSolved: p.solved,
      isPinned: p.pinned,
      createdAt: p.createdAt,
    } : null;
  },
  
  async getPostsByAuthor(authorId) {
    const posts = await BackendCommunityApi.getPostsByAuthor(authorId);
    return posts.map(p => ({
      id: p.id,
      authorId: p.authorId,
      title: p.title,
      content: p.body,
      tags: p.tags,
      upvotes: p.upvotes,
      downvotes: p.downvotes,
      views: p.views,
      replies: p.replyCount,
      isSolved: p.solved,
      isPinned: p.pinned,
      createdAt: p.createdAt,
    }));
  },
  
  async getUsers() {
    return [];
  },
  
  async getUserById(userId) {
    return BackendCommunityApi.getUserById(userId);
  },
  
  async getUserByUsername(username) {
    return BackendCommunityApi.getUserByUsername(username);
  },
  
  async getTags() {
    return BackendCommunityApi.getTags();
  },
  
  async getComments(postId) {
    const comments = await BackendCommunityApi.getComments(postId);
    return comments.map(c => ({
      id: c.id,
      postId: c.discussionId,
      parentId: c.parentId,
      authorId: c.authorId,
      content: c.body,
      createdAt: c.createdAt,
      upvotes: 0,
    }));
  },
  
  async addComment(postId, { authorId, content }) {
    const comment = await BackendCommunityApi.addComment(postId, { authorId, content });
    return {
      id: comment.id,
      postId: comment.discussionId,
      parentId: comment.parentId,
      authorId: comment.authorId,
      content: comment.body,
      createdAt: comment.createdAt,
      upvotes: 0,
    };
  },
  
  async votePost(postId, direction) {
    const result = await BackendCommunityApi.votePost(postId, direction);
    return {
      id: postId,
      upvotes: result.upvotes,
      downvotes: result.downvotes,
    };
  },
  
  async toggleSolved(postId) {
    const post = await BackendCommunityApi.toggleSolved(postId);
    return {
      id: post.id,
      isSolved: post.solved,
    };
  },
  
  async addPost({ title, content, tags, authorId }) {
    const post = await BackendCommunityApi.addPost({ title, content, tags, authorId });
    return {
      id: post.id,
      authorId: post.authorId,
      title: post.title,
      content: post.body,
      tags: post.tags,
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      views: post.views,
      replies: post.replyCount,
      isSolved: post.solved,
      isPinned: post.pinned,
      createdAt: post.createdAt,
    };
  },
  
  async searchPosts({ keyword = '', tag = '', author = '' } = {}) {
    const posts = await BackendCommunityApi.searchPosts({ keyword, tag, author });
    return posts.map(p => ({
      id: p.id,
      authorId: p.authorId,
      title: p.title,
      content: p.body,
      tags: p.tags,
      upvotes: p.upvotes,
      downvotes: p.downvotes,
      views: p.views,
      replies: p.replyCount,
      isSolved: p.solved,
      isPinned: p.pinned,
      createdAt: p.createdAt,
    }));
  },
};

/**
 * Bookmark Service using backend API
 */
export const BookmarkService = {
  async getBookmarks() {
    return BackendCommunityApi.getBookmarks();
  },
  
  async isBookmarked(postId) {
    const bookmarks = await BackendCommunityApi.getBookmarks();
    return bookmarks.includes(postId);
  },
  
  async toggleBookmark(postId) {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');
    
    const bookmarked = await this.isBookmarked(postId);
    if (bookmarked) {
      await BackendCommunityApi.removeBookmark(userId, postId);
      return { postId, bookmarked: false };
    } else {
      await BackendCommunityApi.addBookmark(userId, postId);
      return { postId, bookmarked: true };
    }
  },
  
  async addBookmark(postId) {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');
    await BackendCommunityApi.addBookmark(userId, postId);
    return { postId, bookmarked: true };
  },
  
  async removeBookmark(postId) {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');
    await BackendCommunityApi.removeBookmark(userId, postId);
    return { postId, bookmarked: false };
  },
  
  async getBookmarkCount() {
    const bookmarks = await BackendCommunityApi.getBookmarks();
    return bookmarks.length;
  },
};

/**
 * Notification Service using backend API
 */
export const NotificationService = {
  async getNotifications(unreadOnly = false) {
    return BackendCommunityApi.getNotifications(unreadOnly);
  },
  
  async markRead(notificationId) {
    return BackendCommunityApi.markNotificationRead(notificationId);
  },
  
  async markAllRead() {
    return BackendCommunityApi.markAllNotificationsRead();
  },
  
  async getPreferences() {
    const userId = getUserId();
    if (!userId) return {};
    return BackendCommunityApi.getNotificationPreferences(userId);
  },
  
  async savePreferences(preferences) {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');
    return BackendCommunityApi.saveNotificationPreferences(userId, preferences);
  },
  
  // Local notification display (toast/alert)
  pushNotification(notification) {
    // This could integrate with a toast library
    console.log('Notification:', notification);
    if (window.showToast) {
      window.showToast(notification.title, notification.message);
    } else {
      alert(`${notification.title}: ${notification.message}`);
    }
  },
};

/**
 * Assessment API using backend
 */
export const AssessmentApi = {
  async getQuestions() {
    try {
      return await apiData('/assessments/questions');
    } catch {
      return [];
    }
  },
  
  async submitAssessment({ userId, answers }) {
    const payload = await apiRequest('/assessments/submit', {
      method: 'POST',
      body: { userId, answers },
    });
    return payload.data;
  },
  
  async getSubmissionsByUser(userId) {
    try {
      return await apiData('/assessments/submissions', { query: { userId } });
    } catch {
      return [];
    }
  },
};

export default {
  BackendCommunityApi,
  ForumApi,
  BookmarkService,
  NotificationService,
  AssessmentApi,
  setAuth,
  clearAuth,
  isAuthenticated,
  getAuthToken,
  getUserId,
};