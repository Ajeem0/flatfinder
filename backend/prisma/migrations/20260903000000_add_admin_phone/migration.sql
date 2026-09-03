ALTER TABLE "User" ADD COLUMN "adminPhone" TEXT;

UPDATE "User"
SET "adminPhone" = "phone"
WHERE "userType" = 'ADMIN' AND "phone" IS NOT NULL;