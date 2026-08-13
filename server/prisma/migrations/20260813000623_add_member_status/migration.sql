-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- AlterTable
ALTER TABLE "CookbookMember" ADD COLUMN     "status" "MemberStatus" NOT NULL DEFAULT 'ACCEPTED';
