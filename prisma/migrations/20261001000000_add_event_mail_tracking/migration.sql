-- CreateEnum
CREATE TYPE "EventMailKind" AS ENUM ('rsvp', 'survey', 'notice');

-- CreateEnum
CREATE TYPE "EventMailState" AS ENUM ('draft', 'sent');

-- CreateEnum
CREATE TYPE "EventMailSendStatus" AS ENUM ('processing', 'success', 'partial_failed', 'failed');

-- CreateEnum
CREATE TYPE "EventMailAddressType" AS ENUM ('main', 'sub');

-- CreateEnum
CREATE TYPE "EventMailDeliveryStatus" AS ENUM ('pending', 'success', 'failed');

-- CreateTable
CREATE TABLE "event_mails" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "template_name_snapshot" VARCHAR(200),
    "kind" "EventMailKind" NOT NULL,
    "state" "EventMailState" NOT NULL DEFAULT 'sent',
    "subject" VARCHAR(500) NOT NULL,
    "body" TEXT NOT NULL,
    "from_address" VARCHAR(255) NOT NULL,
    "created_by_admin_id" INTEGER NOT NULL,
    "sent_by_admin_id" INTEGER,
    "send_status" "EventMailSendStatus",
    "target_count" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_mails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_mail_deliveries" (
    "id" SERIAL NOT NULL,
    "event_mail_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "last_name_snapshot" VARCHAR(100) NOT NULL,
    "first_name_snapshot" VARCHAR(100) NOT NULL,
    "email_address" VARCHAR(255) NOT NULL,
    "email_type" "EventMailAddressType" NOT NULL,
    "sub_email_order" INTEGER,
    "status" "EventMailDeliveryStatus" NOT NULL DEFAULT 'pending',
    "smtp_message_id" VARCHAR(255),
    "error_code" VARCHAR(100),
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_mail_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_mails_event_id_sent_at_idx" ON "event_mails"("event_id", "sent_at");

-- CreateIndex
CREATE INDEX "event_mails_event_id_state_idx" ON "event_mails"("event_id", "state");

-- CreateIndex
CREATE INDEX "event_mails_send_status_idx" ON "event_mails"("send_status");

-- CreateIndex
CREATE INDEX "event_mail_deliveries_event_mail_id_status_idx" ON "event_mail_deliveries"("event_mail_id", "status");

-- CreateIndex
CREATE INDEX "event_mail_deliveries_customer_id_idx" ON "event_mail_deliveries"("customer_id");

-- AddForeignKey
ALTER TABLE "event_mails" ADD CONSTRAINT "event_mails_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_mails" ADD CONSTRAINT "event_mails_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_mails" ADD CONSTRAINT "event_mails_sent_by_admin_id_fkey" FOREIGN KEY ("sent_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_mail_deliveries" ADD CONSTRAINT "event_mail_deliveries_event_mail_id_fkey" FOREIGN KEY ("event_mail_id") REFERENCES "event_mails"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_mail_deliveries" ADD CONSTRAINT "event_mail_deliveries_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
