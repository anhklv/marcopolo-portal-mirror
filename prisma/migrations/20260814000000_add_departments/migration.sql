-- CreateTable
CREATE TABLE "departments" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- SeedData
INSERT INTO "departments" ("name", "sort_order", "updated_at") VALUES
    ('内部監査室', 10, CURRENT_TIMESTAMP),
    ('監査役', 20, CURRENT_TIMESTAMP),
    ('管理部門', 30, CURRENT_TIMESTAMP),
    ('経営者', 40, CURRENT_TIMESTAMP),
    ('コンサルタント', 50, CURRENT_TIMESTAMP),
    ('スポンサー', 60, CURRENT_TIMESTAMP),
    ('オブザーバー', 70, CURRENT_TIMESTAMP),
    ('その他', 80, CURRENT_TIMESTAMP);

-- CreateTable
CREATE TABLE "customer_departments" (
    "id" SERIAL NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "department_id" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_departments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "customer_departments_customer_id_department_id_key" ON "customer_departments"("customer_id", "department_id");

-- AddForeignKey
ALTER TABLE "customer_departments" ADD CONSTRAINT "customer_departments_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_departments" ADD CONSTRAINT "customer_departments_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
