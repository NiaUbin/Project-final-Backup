const { PrismaClient } = require('../generated/prisma');
require('dotenv').config();

// Prisma reads DATABASE_URL from environment variables automatically
const prisma = new PrismaClient();

module.exports = prisma;
