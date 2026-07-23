import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const metrics = await prisma.dailyMetric.aggregate({
      _sum: {
        spend: true,
        impressions: true,
        clicks: true,
      }
    });

    const totalLeads = await prisma.lead.count();
    const uniqueCustomers = await prisma.lead.findMany({
      distinct: ['email'],
      select: { email: true }
    });
    const customers = uniqueCustomers.length;
    const leadRevenueAgg = await prisma.lead.aggregate({ _sum: { revenue: true } });
    const totalRevenue = leadRevenueAgg._sum.revenue || 0;

    const spend = metrics._sum.spend || 0;
    
    // Total Clicks = Actual Tracked Clicks (from PageVisits)
    const actualTrackedClicks = await prisma.pageVisit.count();
    const clicks = actualTrackedClicks;

    const leads = totalLeads;
    const conversions = customers;
    const revenue = totalRevenue;
    const roas = spend > 0 ? (revenue / spend) : 0;
    const cpl = leads > 0 ? (spend / leads) : 0;
    const cpa = conversions > 0 ? (spend / conversions) : 0;

    res.json({
      spend,
      impressions: metrics._sum.impressions || 0,
      clicks,
      leads,
      qualifiedLeads: Math.floor(leads * 0.4),
      customers: conversions,
      revenue,
      cpl: parseFloat(cpl.toFixed(2)),
      cpa: parseFloat(cpa.toFixed(2)),
      roas: parseFloat(roas.toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

router.get('/platform-comparison', async (req: Request, res: Response): Promise<void> => {
  try {
    const platforms = await prisma.dailyMetric.groupBy({
      by: ['platform'],
      _sum: {
        spend: true,
      }
    });

    const leadsBySource = await prisma.lead.groupBy({
      by: ['source'],
      _sum: { revenue: true },
      _count: { id: true }
    });

    const customersBySource = await prisma.lead.groupBy({
      by: ['source'],
      where: { status: 'ENROLLED' },
      _count: { id: true }
    });

    const formatted = platforms.map(p => {
      const sourceName = p.platform === 'META' ? 'facebook' : 'google';
      const leadData = leadsBySource.find(l => (l.source || '').toLowerCase().includes(sourceName));
      const customerData = customersBySource.find(c => (c.source || '').toLowerCase().includes(sourceName));
      
      const spend = p._sum.spend || 0;
      const leads = leadData?._count.id || 0;
      const customers = customerData?._count.id || 0;
      const rev = leadData?._sum.revenue || 0;
      
      return {
        platform: p.platform === 'META' ? 'Facebook' : 'Google',
        spend,
        leads,
        customers,
        revenue: rev,
        roas: spend > 0 ? parseFloat((rev / spend).toFixed(2)) : 0,
        cpl: leads > 0 ? parseFloat((spend / leads).toFixed(2)) : 0
      };
    });
    
    // Sort by spend descending
    formatted.sort((a, b) => b.spend - a.spend);
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch platform comparison' });
  }
});

router.get('/daily-metrics', async (req: Request, res: Response): Promise<void> => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const metrics = await prisma.dailyMetric.groupBy({
      by: ['date'],
      where: {
        date: { gte: thirtyDaysAgo }
      },
      _sum: {
        spend: true,
        revenue: true,
        leads: true
      },
      orderBy: {
        date: 'asc'
      }
    });

    // Also get daily leads from Lead table
    const leadsByDate = await prisma.lead.groupBy({
      by: ['createdAt'],
      _count: { id: true },
      _sum: { revenue: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { createdAt: 'asc' }
    });

    const leadDataMap = new Map();
    leadsByDate.forEach(l => {
      const dateStr = new Date(l.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!leadDataMap.has(dateStr)) {
        leadDataMap.set(dateStr, { leads: 0, revenue: 0 });
      }
      const existing = leadDataMap.get(dateStr);
      existing.leads += l._count.id;
      existing.revenue += l._sum.revenue || 0;
    });

    const formatted = metrics.map(m => {
      const dateStr = new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const leadData = leadDataMap.get(dateStr) || { leads: 0, revenue: 0 };
      // Remove from map so we can add remaining days that have leads but no spend
      leadDataMap.delete(dateStr);
      
      return {
        date: dateStr,
        spend: m._sum.spend || 0,
        revenue: (m._sum.revenue || 0) + leadData.revenue,
        leads: (m._sum.leads || 0) + leadData.leads
      };
    });

    // Add remaining days that had leads but no ad spend
    leadDataMap.forEach((data, dateStr) => {
      formatted.push({
        date: dateStr,
        spend: 0,
        revenue: data.revenue,
        leads: data.leads
      });
    });

    // Sort by date string roughly (this is simplified)
    formatted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch daily metrics' });
  }
});

export default router;
