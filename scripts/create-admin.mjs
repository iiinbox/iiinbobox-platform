#!/usr/bin/env node
// Usage: node scripts/create-admin.mjs <email> <password>
// Example: node scripts/create-admin.mjs admin@iiinbox.com Admin@iiinbox2024

import { createRequire } from "module";
const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: node scripts/create-admin.mjs <email> <password>");
  process.exit(1);
}

const prisma = new PrismaClient();

const hash = await bcrypt.hash(password, 10);

const user = await prisma.user.upsert({
  where: { email },
  update: { passwordHash: hash, role: "ADMIN" },
  create: { name: "Admin", email, passwordHash: hash, role: "ADMIN" },
});

console.log(`Admin user ready: ${user.email} (id: ${user.id})`);
await prisma.$disconnect();
