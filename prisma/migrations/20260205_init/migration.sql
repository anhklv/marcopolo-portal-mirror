-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female');

-- CreateEnum
CREATE TYPE "MemberCategory" AS ENUM ('member', 'sponsor', 'observer');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('corporate', 'individual');

-- CreateEnum
CREATE TYPE "AuditMemberType" AS ENUM ('regular', 'online');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('super', 'community_admin');

-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('pending', 'attending', 'online', 'absent');

-- CreateEnum
CREATE TYPE "AfterPartyStatus" AS ENUM ('attending', 'not_attending');

-- CreateEnum
CREATE TYPE "SurveyRating" AS ENUM ('excellent', 'good', 'fair', 'poor');

-- CreateEnum
CREATE TYPE "FutureParticipation" AS ENUM ('definitely_yes', 'considering', 'no');

-- CreateEnum
CREATE TYPE "MembershipInterest" AS ENUM ('want_to_join', 'considering', 'not_interested');

-- CreateTable
CREATE TABLE "communities" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "has_survey" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "name_kana" VARCHAR(100),
    "company" VARCHAR(200),
    "email" VARCHAR(255) NOT NULL,
    "sub_emails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "phone" VARCHAR(20),
    "postal_code" VARCHAR(10),
    "prefecture" VARCHAR(20),
    "city" VARCHAR(255),
    "gender" "Gender",
    "listing_category" VARCHAR(100),
    "origin_industry" VARCHAR(100),
    "membership_qualification" VARCHAR(100),
    "member_category" "MemberCategory",
    "contract_type" "ContractType",
    "note" TEXT,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_communities" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "community_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMP(3),
    "resigned_at" TIMESTAMP(3),
    "audit_member_type" "AuditMemberType",
    "audit_member_premium" BOOLEAN,
    "affiliation" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_communities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "community_id" INTEGER NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" VARCHAR(255),
    "description" TEXT,
    "timetable" TEXT,
    "note" TEXT,
    "attendees_count" INTEGER NOT NULL DEFAULT 0,
    "response_deadline" TIMESTAMP(3),
    "is_paused" BOOLEAN NOT NULL DEFAULT false,
    "allows_online" BOOLEAN NOT NULL DEFAULT false,
    "has_after_party" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rsvps" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "token" VARCHAR(100) NOT NULL,
    "status" "RsvpStatus" NOT NULL DEFAULT 'pending',
    "after_party_status" "AfterPartyStatus",
    "comment" TEXT,
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rsvps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surveys" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_questions" (
    "id" SERIAL NOT NULL,
    "survey_id" INTEGER NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "survey_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_responses" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "survey_token_id" INTEGER NOT NULL,
    "rating" "SurveyRating",
    "reason" TEXT,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fixed_survey_responses" (
    "id" SERIAL NOT NULL,
    "survey_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "survey_token_id" INTEGER NOT NULL,
    "after_party_rating" "SurveyRating",
    "after_party_reason" TEXT,
    "future_participation" "FutureParticipation",
    "future_participation_reason" TEXT,
    "membership" "MembershipInterest",
    "membership_reason" TEXT,
    "comments" TEXT,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "fixed_survey_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "survey_tokens" (
    "id" SERIAL NOT NULL,
    "survey_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "token" VARCHAR(100) NOT NULL,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "survey_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(50) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "AdminRole" NOT NULL,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_communities" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "community_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_communities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "communities_code_key" ON "communities"("code");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customer_communities_customer_id_community_id_key" ON "customer_communities"("customer_id", "community_id");

-- CreateIndex
CREATE UNIQUE INDEX "rsvps_token_key" ON "rsvps"("token");

-- CreateIndex
CREATE UNIQUE INDEX "rsvps_event_id_customer_id_key" ON "rsvps"("event_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "surveys_event_id_key" ON "surveys"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "survey_responses_question_id_customer_id_key" ON "survey_responses"("question_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "fixed_survey_responses_survey_id_customer_id_key" ON "fixed_survey_responses"("survey_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "survey_tokens_token_key" ON "survey_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "survey_tokens_survey_id_customer_id_key" ON "survey_tokens"("survey_id", "customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_communities_admin_id_community_id_key" ON "admin_communities"("admin_id", "community_id");

-- AddForeignKey
ALTER TABLE "customer_communities" ADD CONSTRAINT "customer_communities_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_communities" ADD CONSTRAINT "customer_communities_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rsvps" ADD CONSTRAINT "rsvps_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveys" ADD CONSTRAINT "surveys_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "survey_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_survey_token_id_fkey" FOREIGN KEY ("survey_token_id") REFERENCES "survey_tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_survey_responses" ADD CONSTRAINT "fixed_survey_responses_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_survey_responses" ADD CONSTRAINT "fixed_survey_responses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fixed_survey_responses" ADD CONSTRAINT "fixed_survey_responses_survey_token_id_fkey" FOREIGN KEY ("survey_token_id") REFERENCES "survey_tokens"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_tokens" ADD CONSTRAINT "survey_tokens_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "surveys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "survey_tokens" ADD CONSTRAINT "survey_tokens_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_communities" ADD CONSTRAINT "admin_communities_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_communities" ADD CONSTRAINT "admin_communities_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

