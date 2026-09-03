UPDATE "Property"
SET "ownerId" = (SELECT "id" FROM "User" WHERE "email" = 'owner2@flatfinder.in')
WHERE "ownerId" = (SELECT "id" FROM "User" WHERE "email" = 'owner1@flatfinder.in');

DELETE FROM "User"
WHERE "email" IN ('owner1@flatfinder.in', 'tenant@flatfinder.in');