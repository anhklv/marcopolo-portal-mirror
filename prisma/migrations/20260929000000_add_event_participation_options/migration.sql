-- CreateEnum
CREATE TYPE "ParticipationMode" AS ENUM ('disabled', 'optional', 'required');

-- AlterTable
ALTER TABLE "events"
ADD COLUMN "participation_mode" "ParticipationMode" NOT NULL DEFAULT 'disabled';

-- CreateTable
CREATE TABLE "event_participation_options" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "label" VARCHAR(200) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_participation_options_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "rsvps"
ADD COLUMN "participation_option_id" INTEGER;

-- CreateIndex
CREATE INDEX "event_participation_options_event_id_is_active_sort_order_idx"
ON "event_participation_options"("event_id", "is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "event_participation_options_active_label_key"
ON "event_participation_options"("event_id", "label")
WHERE "is_active" = true;

-- CreateIndex
CREATE INDEX "rsvps_participation_option_id_idx"
ON "rsvps"("participation_option_id");

-- AddForeignKey
ALTER TABLE "event_participation_options"
ADD CONSTRAINT "event_participation_options_event_id_fkey"
FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvps"
ADD CONSTRAINT "rsvps_participation_option_id_fkey"
FOREIGN KEY ("participation_option_id") REFERENCES "event_participation_options"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
