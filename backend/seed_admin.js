const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@gmail.com';
  const password = '123456';
  
  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  
  // Find or create an organization first (required by schema)
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({
      data: { name: 'Main Organization' }
    });
  }

  // Check if admin exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  
  if (existingUser) {
    // Update password if exists
    await prisma.user.update({
      where: { email },
      data: { passwordHash, role: 'OWNER' }
    });
    console.log('Updated existing admin user password');
  } else {
    // Create new admin user
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'OWNER',
        organizationId: org.id
      }
    });
    console.log('Created new admin user');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
