-- CreateTable
CREATE TABLE "Major" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Major_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MajorOccupation" (
    "id" TEXT NOT NULL,
    "major_id" TEXT NOT NULL,
    "occupation_id" TEXT NOT NULL,
    "relevance" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MajorOccupation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Major_name_key" ON "Major"("name");

-- CreateIndex
CREATE INDEX "MajorOccupation_major_id_idx" ON "MajorOccupation"("major_id");

-- CreateIndex
CREATE INDEX "MajorOccupation_occupation_id_idx" ON "MajorOccupation"("occupation_id");

-- CreateIndex
CREATE UNIQUE INDEX "MajorOccupation_major_id_occupation_id_key" ON "MajorOccupation"("major_id", "occupation_id");

-- AddForeignKey
ALTER TABLE "MajorOccupation" ADD CONSTRAINT "MajorOccupation_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "Major"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MajorOccupation" ADD CONSTRAINT "MajorOccupation_occupation_id_fkey" FOREIGN KEY ("occupation_id") REFERENCES "OccupationSubCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
