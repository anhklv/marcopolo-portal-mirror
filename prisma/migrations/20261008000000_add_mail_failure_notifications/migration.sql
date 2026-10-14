-- CreateEnum
CREATE TYPE "EventMailFailureNotificationStatus" AS ENUM (
  'pending',
  'processing',
  'sent',
  'failed'
);

-- AlterTable
ALTER TABLE "event_mails"
  ADD COLUMN "failure_notification_status" "EventMailFailureNotificationStatus",
  ADD COLUMN "failure_notification_due_at" TIMESTAMP(3),
  ADD COLUMN "failure_notification_claimed_at" TIMESTAMP(3),
  ADD COLUMN "failure_notification_sent_at" TIMESTAMP(3),
  ADD COLUMN "failure_notification_version" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "failure_notification_attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "failure_notification_error" TEXT;

-- AlterTable
ALTER TABLE "event_mail_deliveries"
  ADD COLUMN "failure_notified_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "event_mails_failure_notification_status_failure_notification_due_at_idx"
  ON "event_mails"("failure_notification_status", "failure_notification_due_at");
