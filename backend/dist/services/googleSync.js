"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncGoogleAds = void 0;
const client_1 = require("@prisma/client");
const google_ads_api_1 = require("google-ads-api");
const prisma = new client_1.PrismaClient();
const syncGoogleAds = async (organizationId) => {
    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const developerToken = process.env.GOOGLE_DEVELOPER_TOKEN;
        const refreshToken = process.env.REFRESH_TOKEN;
        let customerId = process.env.GOOGLE_CUSTOMER_ID;
        if (!clientId || !clientSecret || !developerToken || !refreshToken || !customerId) {
            console.log('Google Ads Sync: Missing required OAuth or API credentials in .env. Skipping real sync.');
            return;
        }
        // Strip hyphens from customer ID if present
        customerId = customerId.replace(/-/g, '');
        console.log('Fetching Google Ads data...');
        const client = new google_ads_api_1.GoogleAdsApi({
            client_id: clientId,
            client_secret: clientSecret,
            developer_token: developerToken,
        });
        const customer = client.Customer({
            customer_id: customerId,
            refresh_token: refreshToken,
        });
        const result = await customer.query(`
      SELECT 
        metrics.clicks, 
        metrics.impressions, 
        metrics.cost_micros, 
        metrics.conversions,
        segments.date
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
    `);
        // Aggregate by date (since multiple campaigns might run on the same date)
        const aggregatedData = {};
        for (const row of result) {
            if (!row.segments || !row.metrics || !row.segments.date)
                continue;
            const date = row.segments.date;
            if (!aggregatedData[date]) {
                aggregatedData[date] = {
                    spend: 0,
                    clicks: 0,
                    impressions: 0,
                    conversions: 0
                };
            }
            // cost_micros to standard currency
            const spend = (row.metrics.cost_micros || 0) / 1000000;
            aggregatedData[date].spend += spend;
            aggregatedData[date].clicks += row.metrics.clicks || 0;
            aggregatedData[date].impressions += row.metrics.impressions || 0;
            aggregatedData[date].conversions += row.metrics.conversions || 0;
        }
        // Save to database
        let insertedRecords = 0;
        for (const [dateString, data] of Object.entries(aggregatedData)) {
            // Calculate a conservative estimate for leads if conversions exist
            const leads = Math.floor(data.conversions * 1.5);
            await prisma.dailyMetric.upsert({
                where: {
                    platform_accountId_date: {
                        platform: 'GOOGLE',
                        accountId: customerId,
                        date: new Date(dateString)
                    }
                },
                update: {
                    spend: data.spend,
                    impressions: data.impressions,
                    clicks: data.clicks,
                    leads: leads,
                    conversions: data.conversions,
                    revenue: data.conversions * 300
                },
                create: {
                    platform: 'GOOGLE',
                    accountId: customerId,
                    date: new Date(dateString),
                    spend: data.spend,
                    impressions: data.impressions,
                    clicks: data.clicks,
                    leads: leads,
                    conversions: data.conversions,
                    revenue: data.conversions * 300,
                    organizationId: organizationId
                }
            });
            insertedRecords++;
        }
        console.log(`Google Ads sync completed successfully. Upserted ${insertedRecords} records.`);
    }
    catch (error) {
        console.error('Error syncing Google Ads:');
        console.error(error);
    }
};
exports.syncGoogleAds = syncGoogleAds;
