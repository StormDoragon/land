-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'SOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PRIMARY', 'RESALE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plot" (
    "id" TEXT NOT NULL,
    "gridX" INTEGER NOT NULL,
    "gridY" INTEGER NOT NULL,
    "centerLat" DOUBLE PRECISION NOT NULL,
    "centerLng" DOUBLE PRECISION NOT NULL,
    "name" TEXT,
    "color" TEXT NOT NULL DEFAULT '#22c55e',
    "locationLabel" TEXT,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Plot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "plotId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "sellerId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Plot_centerLat_centerLng_idx" ON "Plot"("centerLat", "centerLng");

-- CreateIndex
CREATE INDEX "Plot_ownerId_idx" ON "Plot"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Plot_gridX_gridY_key" ON "Plot"("gridX", "gridY");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE INDEX "Listing_plotId_idx" ON "Listing"("plotId");

-- CreateIndex
CREATE INDEX "Transaction_plotId_idx" ON "Transaction"("plotId");

-- CreateIndex
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- AddForeignKey
ALTER TABLE "Plot" ADD CONSTRAINT "Plot_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_plotId_fkey" FOREIGN KEY ("plotId") REFERENCES "Plot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
