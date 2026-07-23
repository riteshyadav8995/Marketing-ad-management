const { PrismaClient } = require('@prisma/client');
const { syncGoogleAds } = require('./src/services/googleSync');
const { syncMetaAds } = require('./src/services/metaSync');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  let org = await prisma.organization.findFirst();
  if (!org) {
    org = await prisma.organization.create({ data: { name: 'Main Org' } });
  }

  console.log("=== Running Meta Sync ===");
  await syncMetaAds(org.id);
  
  console.log("\n=== Running Google Ads Sync ===");
  await syncGoogleAds(org.id);
  
  console.log("\nDone checking both APIs.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
