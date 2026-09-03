CREATE TYPE "FlatmateListingType" AS ENUM ('LOOKING_FOR_FLATMATE', 'OFFERING_FLAT', 'LOOKING_FOR_FLAT');
CREATE TYPE "MessageStatus" AS ENUM ('SENT', 'DELIVERED', 'READ');

ALTER TABLE "Property"
  ADD COLUMN "listingType" "FlatmateListingType",
  ADD COLUMN "roomType" TEXT,
  ADD COLUMN "existingFlatmates" INTEGER,
  ADD COLUMN "preferredGender" TEXT,
  ADD COLUMN "preferredAgeRange" TEXT,
  ADD COLUMN "occupation" TEXT,
  ADD COLUMN "foodPreference" TEXT,
  ADD COLUMN "smokingPreference" TEXT,
  ADD COLUMN "drinkingPreference" TEXT,
  ADD COLUMN "petsPreference" TEXT,
  ADD COLUMN "contactPreference" TEXT;

CREATE TABLE "Conversation" (
  "id" TEXT NOT NULL,
  "propertyId" TEXT NOT NULL,
  "starterId" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Message" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "attachmentUrl" TEXT,
  "status" "MessageStatus" NOT NULL DEFAULT 'SENT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "BlockedUser" (
  "blockerId" TEXT NOT NULL,
  "blockedId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BlockedUser_pkey" PRIMARY KEY ("blockerId", "blockedId")
);

CREATE UNIQUE INDEX "Conversation_propertyId_starterId_recipientId_key" ON "Conversation"("propertyId", "starterId", "recipientId");
CREATE INDEX "Conversation_starterId_updatedAt_idx" ON "Conversation"("starterId", "updatedAt");
CREATE INDEX "Conversation_recipientId_updatedAt_idx" ON "Conversation"("recipientId", "updatedAt");
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_starterId_fkey" FOREIGN KEY ("starterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlockedUser" ADD CONSTRAINT "BlockedUser_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlockedUser" ADD CONSTRAINT "BlockedUser_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
