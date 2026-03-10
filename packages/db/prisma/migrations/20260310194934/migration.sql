/*
  Warnings:

  - You are about to drop the column `military_rating` on the `Pilot` table. All the data in the column will be lost.
  - You are about to drop the column `pilot_rating` on the `Pilot` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Pilot" DROP COLUMN "military_rating",
DROP COLUMN "pilot_rating",
ADD COLUMN     "user_ratings" JSONB;
