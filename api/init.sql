-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "reputationScore" INTEGER NOT NULL DEFAULT 0,
    "photoUrl" TEXT,
    "lat" REAL,
    "lng" REAL,
    "interests" JSONB NOT NULL DEFAULT '[]',
    "emergencyContacts" JSONB,
    "birthYear" INTEGER,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderDaysBefore" INTEGER NOT NULL DEFAULT 1,
    "monthlySummary" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orgType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "contactEmail" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "order" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME,
    "placeName" TEXT NOT NULL,
    "placeAddress" TEXT NOT NULL,
    "placeLat" REAL NOT NULL,
    "placeLng" REAL NOT NULL,
    "placeGeohash" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT NOT NULL,
    "capacity" INTEGER,
    "enrolledCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'disponible',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enrolledBy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmado',
    "activityStartsAt" DATETIME NOT NULL,
    "googleEventId" TEXT,
    "enrolledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FamilyLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caregiverId" TEXT NOT NULL,
    "elderId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME
);

-- CreateTable
CREATE TABLE "Recommendation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ReputationEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "refId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FeaturedPurchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "amountUsd" REAL NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'simulado',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "activityId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "scheduledFor" DATETIME NOT NULL,
    "sentAt" DATETIME,
    "read" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "EventPhoto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "activityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "likeCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'visible',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PhotoLike" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "photoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "photoOwnerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "reportedBy" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'abierto',
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME
);

-- CreateTable
CREATE TABLE "ActivityStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizerId" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "featuredImpressions" INTEGER NOT NULL DEFAULT 0,
    "featuredViews" INTEGER NOT NULL DEFAULT 0,
    "enrolled" INTEGER NOT NULL DEFAULT 0,
    "attended" INTEGER NOT NULL DEFAULT 0,
    "noShow" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MonthlyReport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "enrolled" INTEGER NOT NULL DEFAULT 0,
    "attended" INTEGER NOT NULL DEFAULT 0,
    "attendanceRate" REAL NOT NULL DEFAULT 0,
    "byCategory" JSONB NOT NULL DEFAULT '{}',
    "totalAttendees" INTEGER,
    "activitiesPublished" INTEGER,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ZoneSupply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "geohash" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "activities" INTEGER NOT NULL DEFAULT 0,
    "enrollments" INTEGER NOT NULL DEFAULT 0,
    "byCategory" JSONB NOT NULL DEFAULT '{}',
    "byWeekdayHour" JSONB NOT NULL DEFAULT '{}'
);

-- CreateTable
CREATE TABLE "CalendarSync" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL DEFAULT 'google',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "calendarId" TEXT NOT NULL,
    "lastSyncedAt" DATETIME
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Device_userId_idx" ON "Device"("userId");

-- CreateIndex
CREATE INDEX "Activity_startsAt_idx" ON "Activity"("startsAt");

-- CreateIndex
CREATE INDEX "Activity_categoryId_startsAt_idx" ON "Activity"("categoryId", "startsAt");

-- CreateIndex
CREATE INDEX "Activity_placeGeohash_idx" ON "Activity"("placeGeohash");

-- CreateIndex
CREATE INDEX "Activity_createdBy_idx" ON "Activity"("createdBy");

-- CreateIndex
CREATE INDEX "Enrollment_userId_activityStartsAt_idx" ON "Enrollment"("userId", "activityStartsAt");

-- CreateIndex
CREATE INDEX "Enrollment_activityId_idx" ON "Enrollment"("activityId");

-- CreateIndex
CREATE INDEX "FamilyLink_caregiverId_idx" ON "FamilyLink"("caregiverId");

-- CreateIndex
CREATE INDEX "FamilyLink_elderId_idx" ON "FamilyLink"("elderId");

-- CreateIndex
CREATE INDEX "Recommendation_toUserId_idx" ON "Recommendation"("toUserId");

-- CreateIndex
CREATE INDEX "Recommendation_activityId_idx" ON "Recommendation"("activityId");

-- CreateIndex
CREATE INDEX "Review_activityId_idx" ON "Review"("activityId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE INDEX "ReputationEvent_userId_idx" ON "ReputationEvent"("userId");

-- CreateIndex
CREATE INDEX "FeaturedPurchase_activityId_idx" ON "FeaturedPurchase"("activityId");

-- CreateIndex
CREATE INDEX "FeaturedPurchase_orgId_idx" ON "FeaturedPurchase"("orgId");

-- CreateIndex
CREATE INDEX "Notification_userId_scheduledFor_idx" ON "Notification"("userId", "scheduledFor");

-- CreateIndex
CREATE INDEX "EventPhoto_activityId_idx" ON "EventPhoto"("activityId");

-- CreateIndex
CREATE INDEX "EventPhoto_userId_idx" ON "EventPhoto"("userId");

-- CreateIndex
CREATE INDEX "PhotoLike_photoId_idx" ON "PhotoLike"("photoId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "ActivityStats_organizerId_idx" ON "ActivityStats"("organizerId");

-- CreateIndex
CREATE INDEX "MonthlyReport_ownerId_idx" ON "MonthlyReport"("ownerId");

-- CreateIndex
CREATE INDEX "ZoneSupply_geohash_month_idx" ON "ZoneSupply"("geohash", "month");