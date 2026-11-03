-- CreateTable
CREATE TABLE "CommunityUser" (
    "id" TEXT NOT NULL,
    "lmsUserId" INTEGER,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT,
    "role" TEXT NOT NULL DEFAULT 'Learner',
    "banned" BOOLEAN NOT NULL DEFAULT false,
    "warned" BOOLEAN NOT NULL DEFAULT false,
    "muted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumDiscussion" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "categoryId" TEXT,
    "solved" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "views" INTEGER NOT NULL DEFAULT 0,
    "flagReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumDiscussion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumDiscussionTag" (
    "discussionId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "ForumDiscussionTag_pkey" PRIMARY KEY ("discussionId","tagId")
);

-- CreateTable
CREATE TABLE "ForumComment" (
    "id" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "parentId" TEXT,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumDiscussionVote" (
    "id" SERIAL NOT NULL,
    "discussionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumDiscussionVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumCommentVote" (
    "id" SERIAL NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumCommentVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumBookmark" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumBookmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'system',
    "message" TEXT NOT NULL,
    "link" TEXT NOT NULL DEFAULT '/forum',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumNotificationPreference" (
    "userId" TEXT NOT NULL,
    "email" BOOLEAN NOT NULL DEFAULT true,
    "inApp" BOOLEAN NOT NULL DEFAULT true,
    "sms" BOOLEAN NOT NULL DEFAULT false,
    "settings" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForumNotificationPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "ForumReport" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "discussionId" TEXT,
    "commentId" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForumAuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "targetUserId" TEXT,
    "targetContentId" TEXT,
    "contentType" TEXT,
    "action" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForumAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CommunityUser_lmsUserId_key" ON "CommunityUser"("lmsUserId");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityUser_username_key" ON "CommunityUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "CommunityUser_email_key" ON "CommunityUser"("email");

-- CreateIndex
CREATE INDEX "CommunityUser_role_idx" ON "CommunityUser"("role");

-- CreateIndex
CREATE INDEX "CommunityUser_banned_idx" ON "CommunityUser"("banned");

-- CreateIndex
CREATE UNIQUE INDEX "ForumCategory_name_key" ON "ForumCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ForumCategory_slug_key" ON "ForumCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ForumTag_name_key" ON "ForumTag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ForumTag_slug_key" ON "ForumTag"("slug");

-- CreateIndex
CREATE INDEX "ForumDiscussion_categoryId_createdAt_idx" ON "ForumDiscussion"("categoryId", "createdAt");

-- CreateIndex
CREATE INDEX "ForumDiscussion_authorId_createdAt_idx" ON "ForumDiscussion"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "ForumDiscussion_hidden_pinned_createdAt_idx" ON "ForumDiscussion"("hidden", "pinned", "createdAt");

-- CreateIndex
CREATE INDEX "ForumDiscussion_solved_idx" ON "ForumDiscussion"("solved");

-- CreateIndex
CREATE INDEX "ForumDiscussionTag_tagId_discussionId_idx" ON "ForumDiscussionTag"("tagId", "discussionId");

-- CreateIndex
CREATE INDEX "ForumComment_discussionId_createdAt_idx" ON "ForumComment"("discussionId", "createdAt");

-- CreateIndex
CREATE INDEX "ForumComment_parentId_idx" ON "ForumComment"("parentId");

-- CreateIndex
CREATE INDEX "ForumComment_authorId_createdAt_idx" ON "ForumComment"("authorId", "createdAt");

-- CreateIndex
CREATE INDEX "ForumDiscussionVote_userId_idx" ON "ForumDiscussionVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ForumDiscussionVote_discussionId_userId_key" ON "ForumDiscussionVote"("discussionId", "userId");

-- CreateIndex
CREATE INDEX "ForumCommentVote_userId_idx" ON "ForumCommentVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ForumCommentVote_commentId_userId_key" ON "ForumCommentVote"("commentId", "userId");

-- CreateIndex
CREATE INDEX "ForumBookmark_userId_createdAt_idx" ON "ForumBookmark"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ForumBookmark_userId_discussionId_key" ON "ForumBookmark"("userId", "discussionId");

-- CreateIndex
CREATE INDEX "ForumNotification_userId_read_createdAt_idx" ON "ForumNotification"("userId", "read", "createdAt");

-- CreateIndex
CREATE INDEX "ForumReport_status_createdAt_idx" ON "ForumReport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ForumReport_discussionId_authorId_idx" ON "ForumReport"("discussionId", "authorId");

-- CreateIndex
CREATE INDEX "ForumReport_commentId_authorId_idx" ON "ForumReport"("commentId", "authorId");

-- One active report per user and content item; nullable content columns allow
-- the independent discussion/comment constraints to coexist in PostgreSQL.
CREATE UNIQUE INDEX "ForumReport_discussionId_authorId_key" ON "ForumReport"("discussionId", "authorId");
CREATE UNIQUE INDEX "ForumReport_commentId_authorId_key" ON "ForumReport"("commentId", "authorId");

-- CreateIndex
CREATE INDEX "ForumAuditLog_createdAt_idx" ON "ForumAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "ForumAuditLog_targetUserId_createdAt_idx" ON "ForumAuditLog"("targetUserId", "createdAt");

-- CreateIndex
CREATE INDEX "BreakoutRoom_sessionId_idx" ON "BreakoutRoom"("sessionId");

-- CreateIndex
CREATE INDEX "BreakoutRoom_status_idx" ON "BreakoutRoom"("status");

-- AddForeignKey
ALTER TABLE "CommunityUser" ADD CONSTRAINT "CommunityUser_lmsUserId_fkey" FOREIGN KEY ("lmsUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumDiscussion" ADD CONSTRAINT "ForumDiscussion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "CommunityUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumDiscussion" ADD CONSTRAINT "ForumDiscussion_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ForumCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumDiscussionTag" ADD CONSTRAINT "ForumDiscussionTag_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "ForumDiscussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumDiscussionTag" ADD CONSTRAINT "ForumDiscussionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "ForumTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumComment" ADD CONSTRAINT "ForumComment_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "ForumDiscussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumComment" ADD CONSTRAINT "ForumComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ForumComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumComment" ADD CONSTRAINT "ForumComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "CommunityUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumDiscussionVote" ADD CONSTRAINT "ForumDiscussionVote_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "ForumDiscussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumDiscussionVote" ADD CONSTRAINT "ForumDiscussionVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CommunityUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumCommentVote" ADD CONSTRAINT "ForumCommentVote_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "ForumComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumCommentVote" ADD CONSTRAINT "ForumCommentVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CommunityUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumBookmark" ADD CONSTRAINT "ForumBookmark_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CommunityUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumBookmark" ADD CONSTRAINT "ForumBookmark_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "ForumDiscussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumNotification" ADD CONSTRAINT "ForumNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CommunityUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumNotification" ADD CONSTRAINT "ForumNotification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "CommunityUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumNotificationPreference" ADD CONSTRAINT "ForumNotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "CommunityUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumReport" ADD CONSTRAINT "ForumReport_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "CommunityUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumReport" ADD CONSTRAINT "ForumReport_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "ForumDiscussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumReport" ADD CONSTRAINT "ForumReport_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "ForumComment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumAuditLog" ADD CONSTRAINT "ForumAuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "CommunityUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForumAuditLog" ADD CONSTRAINT "ForumAuditLog_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "CommunityUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
