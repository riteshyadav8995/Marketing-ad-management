import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const syncMetaAds = async (organizationId: string) => {
  try {
    const token = process.env.META_PAGE_ACCESS_TOKEN;
    if (!token) throw new Error('META_PAGE_ACCESS_TOKEN is not defined');

    // Fetch ad accounts
    const accountsRes = await axios.get(`https://graph.facebook.com/v18.0/me/adaccounts`, {
      params: { access_token: token }
    });
    
    const accounts = accountsRes.data.data;
    
    for (const account of accounts) {
      const accountId = account.id;

      // Fetch insights for the last 30 days
      const insightsRes = await axios.get(`https://graph.facebook.com/v18.0/${accountId}/insights`, {
        params: {
          access_token: token,
          date_preset: 'last_30d',
          time_increment: 1,
          fields: 'spend,impressions,clicks,actions'
        }
      });
      
      const insights = insightsRes.data.data;
      
      let insertedRecords = 0;
      
      for (const day of insights) {
        let leads = 0;
        let conversions = 0;
        if (day.actions) {
          const leadAction = day.actions.find((a: any) => a.action_type === 'lead');
          if (leadAction) leads = parseInt(leadAction.value);
          const convAction = day.actions.find((a: any) => a.action_type === 'offsite_conversion');
          if (convAction) conversions = parseInt(convAction.value);
        }
        
        await prisma.dailyMetric.upsert({
          where: {
            platform_accountId_date: {
              platform: 'META',
              accountId: accountId,
              date: new Date(day.date_start)
            }
          },
          update: {
            spend: parseFloat(day.spend || 0),
            impressions: parseInt(day.impressions || 0),
            clicks: parseInt(day.clicks || 0),
            leads: leads,
            conversions: conversions,
            revenue: conversions * 150 
          },
          create: {
            platform: 'META',
            accountId: accountId,
            date: new Date(day.date_start),
            spend: parseFloat(day.spend || 0),
            impressions: parseInt(day.impressions || 0),
            clicks: parseInt(day.clicks || 0),
            leads: leads,
            conversions: conversions,
            revenue: conversions * 150,
            organizationId: organizationId
          }
        });
        insertedRecords++;
      }

    }

    console.log('Meta Ads sync completed successfully.');
  } catch (error: any) {
    console.error('Error syncing Meta Ads:', error.response?.data || error.message);
  }
};
