-- CreateTable
CREATE TABLE "OccupationCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "occupation_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OccupationCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OccupationSubCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "occupation_code" TEXT NOT NULL,
    "annual_salary" DOUBLE PRECISION NOT NULL,
    "category_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OccupationSubCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TuitionMedian" (
    "id" TEXT NOT NULL,
    "cohort" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sticker_annual" INTEGER,
    "net_price_annual" INTEGER,
    "cost_of_attendance_annual" INTEGER,
    "sample_size" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'College Scorecard: Most-Recent-Cohorts-Institution',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TuitionMedian_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OccupationCategory_name_key" ON "OccupationCategory"("name");

-- CreateIndex
CREATE UNIQUE INDEX "OccupationCategory_occupation_code_key" ON "OccupationCategory"("occupation_code");

-- CreateIndex
CREATE INDEX "OccupationSubCategory_occupation_code_idx" ON "OccupationSubCategory"("occupation_code");

-- CreateIndex
CREATE UNIQUE INDEX "OccupationSubCategory_category_id_occupation_code_key" ON "OccupationSubCategory"("category_id", "occupation_code");

-- CreateIndex
CREATE UNIQUE INDEX "TuitionMedian_cohort_key" ON "TuitionMedian"("cohort");

-- AddForeignKey
ALTER TABLE "OccupationSubCategory" ADD CONSTRAINT "OccupationSubCategory_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "OccupationCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

