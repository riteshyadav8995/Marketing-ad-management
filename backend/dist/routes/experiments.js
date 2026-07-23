"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const DEFAULT_ORG_ID = "org-1";
// List all experiments
router.get('/', async (req, res) => {
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch experiments' });
    }
});
// Create a new experiment
router.post('/', async (req, res) => {
    try {
        const { name, variants } = req.body;
        if (!name || !variants || variants.length < 2) {
            res.status(400).json({ error: 'Name and at least 2 variants are required' });
            return;
        }
        const experiment = await prisma.aBExperiment.create({
            data: {
                organizationId: DEFAULT_ORG_ID,
                name,
                variants: {
                    create: variants.map((v) => ({
                        name: v.name,
                        trafficWeight: v.trafficWeight || 50,
                        landingPageId: v.landingPageId
                    }))
                }
            },
            include: {
                variants: true
            }
        });
        res.json(experiment);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create experiment' });
    }
});
// Update experiment status
router.post('/:id/status', async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const updateData = { status };
        if (status === 'RUNNING')
            updateData.startDate = new Date();
        if (status === 'ENDED' || status === 'PAUSED')
            updateData.endDate = new Date();
        const experiment = await prisma.aBExperiment.update({
            where: { id },
            data: updateData
        });
        res.json(experiment);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update experiment status' });
    }
});
exports.default = router;
