const { PrismaClient } = require("@prisma/client");

// Reuse a single Prisma client instance across the app (and across
// nodemon hot reloads in dev) to avoid exhausting Postgres connections.
const prisma = global.__prisma || new PrismaClient();
if (process.env.NODE_ENV !== "production") global.__prisma = prisma;

module.exports = prisma;
