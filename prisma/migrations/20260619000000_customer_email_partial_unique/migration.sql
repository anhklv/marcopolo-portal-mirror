-- DropIndex
DROP INDEX "customers_email_key";

-- CreateIndex: 未削除顧客のみメールアドレスを一意にする（論理削除済みは再利用可）
CREATE UNIQUE INDEX "customers_email_active_key" ON "customers"("email") WHERE "deleted_at" IS NULL;
