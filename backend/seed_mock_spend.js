const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seed() {
  try {
    let org = await prisma.organization.findFirst();
    if (!org) {
      org = await prisma.organization.create({ data: { name: 'Default Org' } });
    }

    // Insert mock data
    await prisma.dailyMetric.createMany({
      data: [
        {
          organizationId: org.id,
          platform: 'GOOGLE',
          accountId: 'act_google_123',
          date: new Date('2026-07-22'),
          spend: 5000,
          impressions: 25000,
          clicks: 1200
        },
        {
          organizationId: org.id,
          platform: 'META',
          accountId: 'act_meta_123',
          date: new Date('2026-07-22'),
          spend: 3000,
          impressions: 15000,
          clicks: 800
        }
      ]
    });
    
    console.log("Mock data inserted successfully.");
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
