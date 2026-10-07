-- CreateEnum
CREATE TYPE "EventMailProvider" AS ENUM ('unknown', 'mailpit', 'resend');

-- CreateEnum
CREATE TYPE "EventMailProviderStatus" AS ENUM ('unknown', 'sent', 'delivered', 'delayed', 'bounced', 'failed', 'suppressed', 'complained');

-- CreateEnum
CREATE TYPE "MailWebhookProcessStatus" AS ENUM ('received', 'processed', 'unmatched', 'failed');

-- AlterTable
ALTER TABLE "event_mail_deliveries"
ADD COLUMN "provider" "EventMailProvider" NOT NULL DEFAULT 'unknown',
ADD COLUMN "provider_status" "EventMailProviderStatus" NOT NULL DEFAULT 'unknown',
ADD COLUMN "provider_email_id" VARCHAR(255),
ADD COLUMN "provider_event_at" TIMESTAMP(3),
ADD COLUMN "delivered_at" TIMESTAMP(3),
ADD COLUMN "bounced_at" TIMESTAMP(3),
ADD COLUMN "bounce_type" VARCHAR(100),
ADD COLUMN "bounce_sub_type" VARCHAR(100),
ADD COLUMN "provider_error_code" VARCHAR(100),
ADD COLUMN "provider_error_message" TEXT;

-- CreateTable
CREATE TABLE "mail_provider_webhook_events" (
    "id" SERIAL NOT NULL,
    "provider" "EventMailProvider" NOT NULL,
    "provider_event_id" VARCHAR(255) NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "provider_email_id" VARCHAR(255),
    "smtp_message_id" VARCHAR(255),
    "recipient" VARCHAR(255),
    "payload" JSONB NOT NULL,
    "process_status" "MailWebhookProcessStatus" NOT NULL DEFAULT 'received',
    "process_attempts" INTEGER NOT NULL DEFAULT 0,
    "process_error" TEXT,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mail_provider_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_mail_deliveries_smtp_message_id_idx" ON "event_mail_deliveries"("smtp_message_id");

-- CreateIndex
CREATE INDEX "event_mail_deliveries_provider_provider_email_id_idx" ON "event_mail_deliveries"("provider", "provider_email_id");

-- CreateIndex
CREATE UNIQUE INDEX "mail_provider_webhook_events_provider_provider_event_id_key" ON "mail_provider_webhook_events"("provider", "provider_event_id");

-- CreateIndex
CREATE INDEX "mail_provider_webhook_events_provider_provider_email_id_idx" ON "mail_provider_webhook_events"("provider", "provider_email_id");

-- CreateIndex
CREATE INDEX "mail_provider_webhook_events_provider_smtp_message_id_idx" ON "mail_provider_webhook_events"("provider", "smtp_message_id");

-- CreateIndex
CREATE INDEX "mail_provider_webhook_events_process_status_received_at_idx" ON "mail_provider_webhook_events"("process_status", "received_at");
