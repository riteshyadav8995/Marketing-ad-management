import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const DEFAULT_ORG_ID = "org-1";

// List all experiments
router.get('/', async (req: Request, res: Response) => {
  try {
    const experiments = await prisma.aBExperiment.findMany({
      include: {
        variants: {
          include: {
            _count: {
              select: { visits: true, leads: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(experiments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch experiments' });
  }
});

// Create a new experiment
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, variants } = req.body;
    
    if (!name || !variants || variants.length < 2) {
      res.status(400).json({ error: 'Name and at least 2 variants are required' });
      return;
    }

    const org = await prisma.organization.findFirst();
    if (!org) {
      res.status(500).json({ error: 'Organization not found' });
      return;
    }

    const experiment = await prisma.aBExperiment.create({
      data: {
        organizationId: org.id,
        name,
        variants: {
          create: variants.map((v: any) => ({
            name: v.name,
            trafficWeight: v.trafficWeight || 50,
            landingPageId: v.landingPageId
          }))
        }
      },
      include: { variants: true }
    });
    res.status(201).json(experiment);
  } catch (error: any) {
    console.error('Experiment creation error:', error);
    res.status(500).json({ error: 'Failed to create experiment', details: error.message || String(error) });
  }
});

// Update experiment status
router.post('/:id/status', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    
    const updateData: any = { status };
    if (status === 'RUNNING') updateData.startDate = new Date();
    if (status === 'ENDED' || status === 'PAUSED') updateData.endDate = new Date();

    const experiment = await prisma.aBExperiment.update({
      where: { id },
      data: updateData
    });

    res.json(experiment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update experiment status' });
  }
});

export default router;
