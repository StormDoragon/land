-- AlterTable
ALTER TABLE "Plot" ADD COLUMN     "countryCode" TEXT;

-- CreateIndex
CREATE INDEX "Plot_countryCode_idx" ON "Plot"("countryCode");
