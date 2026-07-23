import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const pagesList = await prisma.landingPage.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(pagesList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch pages' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const org = await prisma.organization.findFirst();
    if (!org) {
      return res.status(400).json({ error: 'No organization found' });
    }

    const title = req.body.title || 'Untitled Page';
    let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    if (!slug) slug = 'page-' + Math.random().toString(36).substring(7);
    
    // Ensure uniqueness
    const existing = await prisma.landingPage.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Math.random().toString(36).substring(7)}`;
    }

    const newPage = await prisma.landingPage.create({
      data: {
        organizationId: org.id,
        title: title,
        slug: slug,
        sections: req.body.sections || [],
        status: 'PUBLISHED'
      }
    });
    res.status(201).json(newPage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save page' });
  }
});

router.post('/submit-form', async (req: Request, res: Response) => {
  try {
    const { fields, utm } = req.body;
    
    // For MVP, get the first organization
    const org = await prisma.organization.findFirst();
    if (!org) {
      return res.status(400).json({ error: 'No organization found' });
    }

    // Attempt to find Campaign by UTM Campaign string (if any)
    let campaignId = null;
    if (utm?.campaign) {
      const camp = await prisma.marketingCampaign.findFirst({
        where: { name: utm.campaign }
      });
      if (camp) {
        campaignId = camp.id;
      }
    }

    const lead = await prisma.lead.create({
      data: {
        organizationId: org.id,
        name: fields.name || 'Anonymous',
        email: fields.email || 'no-email@example.com',
        phone: fields.phone || null,
        source: utm?.source || null,
        campaignId: campaignId,
        variantId: utm?.variantId || null,
        submissions: {
          create: {
            utmSource: utm?.source || null,
            utmMedium: utm?.medium || null,
            utmCampaign: utm?.campaign || null,
          }
        }
      },
      include: {
        submissions: true
      }
    });

    res.status(201).json({ success: true, leadId: lead.id, lead });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

router.get('/submissions', async (req: Request, res: Response) => {
  try {
    const leads = await prisma.lead.findMany({ include: { submissions: true }});
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

export default router;
