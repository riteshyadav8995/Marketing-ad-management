"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// We'll fetch the org dynamically like in other routes
router.get('/', async (req, res) => {
    try {
        const connections = await prisma.adPlatformConnection.findMany({
            include: {
                adAccounts: true
            }
        });
        res.json(connections);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch integrations' });
    }
});
// Mock connection endpoint
router.post('/connect', async (req, res) => {
    try {
        const { platform } = req.body;
        // Check if it already exists
        const existing = await prisma.adPlatformConnection.findFirst({
            where: { platform }
        });
        if (existing) {
            const updated = await prisma.adPlatformConnection.update({
                where: { id: existing.id },
                data: { status: 'CONNECTED', lastSync: new Date() }
            });
            return res.json(updated);
        }
        // For MVP, get the first organization
        let org = await prisma.organization.findFirst();
        if (!org) {
            org = await prisma.organization.create({ data: { name: 'Default Org' } });
        }
        const connection = await prisma.adPlatformConnection.create({
            data: {
                platform,
                externalAccountId: `ext_${platform.toLowerCase()}_123`,
                encryptedTokens: "mock_encrypted_token",
                status: 'CONNECTED',
                lastSync: new Date(),
                adAccounts: {
                    create: {
                        organizationId: org.id,
                        platform,
                        accountId: `act_${platform.toLowerCase()}_456`,
                        name: `${platform === 'META' ? 'Facebook' : 'Google'} Ads Account`,
                        currency: 'INR',
                        timezone: 'Asia/Kolkata'
                    }
                }
            },
            include: {
                adAccounts: true
            }
        });
        res.json(connection);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to connect platform' });
    }
});
router.post('/disconnect', async (req, res) => {
    try {
        const { id } = req.body;
        const updated = await prisma.adPlatformConnection.update({
            where: { id },
            data: { status: 'DISCONNECTED' }
        });
        res.json(updated);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to disconnect platform' });
    }
});
router.post('/sync', async (req, res) => {
    try {
        const connections = await prisma.adPlatformConnection.findMany({
            where: { status: 'CONNECTED' },
            include: { adAccounts: true }
        });
        if (connections.length === 0) {
            return res.json({ message: 'No active connections to sync.' });
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let syncedCount = 0;
        // For MVP, get the first organization
        let org = await prisma.organization.findFirst();
        if (!org) {
            org = await prisma.organization.create({ data: { name: 'Default Org' } });
        }
        for (const conn of connections) {
            // Create a mock DailyMetric for today for this platform
            const spend = Math.floor(Math.random() * 5000) + 1000;
            const impressions = Math.floor(spend * (Math.random() * 10 + 5));
            const clicks = Math.floor(impressions * (Math.random() * 0.05 + 0.01));
            // Find if one exists today
            const existing = await prisma.dailyMetric.findFirst({
                where: {
                    platform: conn.platform,
                    date: today
                }
            });
            if (existing) {
                await prisma.dailyMetric.update({
                    where: { id: existing.id },
                    data: {
                        spend: existing.spend + spend,
                        impressions: existing.impressions + impressions,
                        clicks: existing.clicks + clicks,
                    }
                });
            }
            else {
                await prisma.dailyMetric.create({
                    data: {
                        organizationId: org.id,
                        platform: conn.platform,
                        date: today,
                        spend,
                        impressions,
                        clicks,
                        accountId: conn.id
                    }
                });
            }
            await prisma.adPlatformConnection.update({
                where: { id: conn.id },
                data: { lastSync: new Date() }
            });
            syncedCount++;
        }
        res.json({ message: `Successfully synced ${syncedCount} platforms.` });
    }
    catch (error) {
        console.error('Sync error', error);
        res.status(500).json({ error: 'Failed to sync metrics' });
    }
});
exports.default = router;
