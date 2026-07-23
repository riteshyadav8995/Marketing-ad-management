const { PrismaClient } = require('@prisma/client');
const { syncMetaAds } = require('./src/services/metaSync');
const prisma = new PrismaClient();

async function run() {
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({ data: { name: 'My Real Org' } });
  }

  console.log('Running real Meta Sync...');
  await syncMetaAds(org.id);
  console.log('Done!');
}

run().catch(console.error).finally(() => prisma.$disconnect());
