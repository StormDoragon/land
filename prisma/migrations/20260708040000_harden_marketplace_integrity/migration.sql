-- Add a distinct transaction kind for tier upgrades.
ALTER TYPE "TransactionType" ADD VALUE IF NOT EXISTS 'UPGRADE';

-- Enforce at most one active resale listing per plot at the database level.
CREATE UNIQUE INDEX IF NOT EXISTS "Listing_one_active_per_plot_idx"
ON "Listing"("plotId")
WHERE "status" = 'ACTIVE';
