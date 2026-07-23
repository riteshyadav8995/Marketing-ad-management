import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all leads
router.get('/', async (req: Request, res: Response) => {
  try {
    const leads = await prisma.lead.findMany({
      include: {
        submissions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(leads);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// Update lead status and attribute revenue
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, revenue } = req.body;

    const lead = await prisma.lead.findUnique({
      where: { id: id as string },
      include: { submissions: true }
    });

    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const updatedLead = await prisma.lead.update({
      where: { id: id as string },
      data: { 
        status,
        revenue: revenue ? parseFloat(revenue) : lead.revenue
      },
    });

    // If marked as ENROLLED and revenue provided, attribute to DailyMetric
    if (status === 'ENROLLED' && revenue && lead.source) {
      const revenueAmount = parseFloat(revenue);
      
      // Determine platform from source (e.g. google -> GOOGLE, facebook -> META)
      let platform = 'GOOGLE';
      if (lead.source.toLowerCase().includes('facebook') || lead.source.toLowerCase().includes('instagram')) {
        platform = 'META';
      } else if (lead.source.toLowerCase().includes('google')) {
        platform = 'GOOGLE';
      }

      // Find the most recent DailyMetric for this platform to attach the revenue to
      const latestMetric = await prisma.dailyMetric.findFirst({
        where: {
          platform,
          organizationId: lead.organizationId
        },
        orderBy: {
          date: 'desc'
        }
      });

      if (latestMetric) {
        await prisma.dailyMetric.update({
          where: { id: latestMetric.id },
          data: {
            revenue: latestMetric.revenue + revenueAmount,
            conversions: latestMetric.conversions + 1
          }
        });
      }
    }

    res.json(updatedLead);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

export default router;
