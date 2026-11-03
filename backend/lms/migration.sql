-- Additive LMS runtime schema migration. IF NOT EXISTS guards make this safe to
-- re-run on databases where some or all changes were applied manually before.
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "completionThreshold" DOUBLE PRECISION NOT NULL DEFAULT 80;

ALTER TABLE "Module" ADD COLUMN IF NOT EXISTS "order" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Lesson"
    ADD COLUMN IF NOT EXISTS "durationSeconds" DOUBLE PRECISION NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "videoBytes" INTEGER;

ALTER TABLE "Assessment"
    ADD COLUMN IF NOT EXISTS "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    ADD COLUMN IF NOT EXISTS "passPercentage" DOUBLE PRECISION NOT NULL DEFAULT 60;

ALTER TABLE "AssessmentSubmission"
    ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "flaggedQuestionIds" JSONB,
    ADD COLUMN IF NOT EXISTS "gradingError" TEXT,
    ADD COLUMN IF NOT EXISTS "gradingLeaseAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "SubmissionAnswer" ADD COLUMN IF NOT EXISTS "language" TEXT;

CREATE TABLE IF NOT EXISTS "LmsNote" (
    "id" SERIAL NOT NULL,
    "enrollmentId" INTEGER NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LmsCertificateDelivery" (
    "id" SERIAL NOT NULL,
    "enrollmentId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LmsCertificateDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LmsNote_enrollmentId_lessonId_key" ON "LmsNote"("enrollmentId", "lessonId");

CREATE UNIQUE INDEX IF NOT EXISTS "LmsCertificateDelivery_enrollmentId_key" ON "LmsCertificateDelivery"("enrollmentId");

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'LmsNote_enrollmentId_fkey'
          AND conrelid = to_regclass('"LmsNote"')
    ) THEN
        ALTER TABLE "LmsNote" ADD CONSTRAINT "LmsNote_enrollmentId_fkey"
            FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- The attendance, instructor controls, push token and scheduled-session APIs
-- are part of the same Postgres LMS schema used by the current client.
ALTER TABLE "AssessmentSubmission"
    ADD COLUMN IF NOT EXISTS "feedback" TEXT,
    ADD COLUMN IF NOT EXISTS "gradedAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "gradedBy" TEXT;

ALTER TABLE "Lesson"
    ADD COLUMN IF NOT EXISTS "completionThreshold" DOUBLE PRECISION NOT NULL DEFAULT 90;

ALTER TABLE "LiveSession"
    ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "AttendanceRecord" (
    "id" SERIAL NOT NULL,
    "enrollmentId" INTEGER NOT NULL,
    "sessionTitle" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "notes" TEXT,
    "recordedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "InstructorSessionControl" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "checklist" JSONB NOT NULL DEFAULT '[]',
    "controls" JSONB NOT NULL DEFAULT '{}',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "InstructorSessionControl_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "DevicePushToken" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "expoPushToken" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DevicePushToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "LmsReportDelivery" (
    "id" SERIAL NOT NULL,
    "periodKey" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "recipients" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "lastError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LmsReportDelivery_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "AttendanceRecord_sessionDate_idx" ON "AttendanceRecord"("sessionDate");
CREATE INDEX IF NOT EXISTS "AttendanceRecord_status_idx" ON "AttendanceRecord"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "AttendanceRecord_enrollmentId_sessionDate_sessionTitle_key"
    ON "AttendanceRecord"("enrollmentId", "sessionDate", "sessionTitle");
CREATE INDEX IF NOT EXISTS "InstructorSessionControl_sessionId_idx" ON "InstructorSessionControl"("sessionId");
CREATE UNIQUE INDEX IF NOT EXISTS "InstructorSessionControl_userId_sessionId_key"
    ON "InstructorSessionControl"("userId", "sessionId");
CREATE UNIQUE INDEX IF NOT EXISTS "DevicePushToken_expoPushToken_key" ON "DevicePushToken"("expoPushToken");
CREATE INDEX IF NOT EXISTS "DevicePushToken_userId_idx" ON "DevicePushToken"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "LmsReportDelivery_periodKey_key" ON "LmsReportDelivery"("periodKey");

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'AttendanceRecord_enrollmentId_fkey'
          AND conrelid = to_regclass('"AttendanceRecord"')
    ) THEN
        ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_enrollmentId_fkey"
            FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'LmsNote_lessonId_fkey'
          AND conrelid = to_regclass('"LmsNote"')
    ) THEN
        ALTER TABLE "LmsNote" ADD CONSTRAINT "LmsNote_lessonId_fkey"
            FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'LmsCertificateDelivery_enrollmentId_fkey'
          AND conrelid = to_regclass('"LmsCertificateDelivery"')
    ) THEN
        ALTER TABLE "LmsCertificateDelivery" ADD CONSTRAINT "LmsCertificateDelivery_enrollmentId_fkey"
            FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
