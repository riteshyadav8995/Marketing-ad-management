"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.get('/funnel', async (req, res) => {
    try {
        const leads = await prisma.lead.findMany({
            include: {
                submissions: {
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        const firstTouch = {
            organic: { leads: 0, customers: 0, revenue: 0 },
            paid_social: { leads: 0, customers: 0, revenue: 0 },
            paid_search: { leads: 0, customers: 0, revenue: 0 }
        };
        const lastTouch = {
            organic: { leads: 0, customers: 0, revenue: 0 },
            paid_social: { leads: 0, customers: 0, revenue: 0 },
            paid_search: { leads: 0, customers: 0, revenue: 0 }
        };
        const getChannel = (source) => {
            if (!source)
                return 'organic';
            const s = source.toLowerCase();
            if (s.includes('facebook') || s.includes('meta') || s.includes('instagram'))
                return 'paid_social';
            if (s.includes('google') || s.includes('adwords'))
                return 'paid_search';
            return 'organic';
        };
        for (const lead of leads) {
            const isCustomer = lead.status === 'ENROLLED';
            const revenue = lead.revenue || 0;
            // Calculate first touch
            let ftChannel = 'organic';
            if (lead.submissions && lead.submissions.length > 0) {
                ftChannel = getChannel(lead.submissions[0].utmSource);
            }
            else {
                ftChannel = getChannel(lead.source);
            }
            firstTouch[ftChannel].leads += 1;
            if (isCustomer)
                firstTouch[ftChannel].customers += 1;
            firstTouch[ftChannel].revenue += revenue;
            // Calculate last touch
            let ltChannel = 'organic';
            if (lead.submissions && lead.submissions.length > 0) {
                ltChannel = getChannel(lead.submissions[lead.submissions.length - 1].utmSource);
            }
            else {
                ltChannel = getChannel(lead.source);
            }
            lastTouch[ltChannel].leads += 1;
            if (isCustomer)
                lastTouch[ltChannel].customers += 1;
            lastTouch[ltChannel].revenue += revenue;
        }
        res.json({ firstTouch, lastTouch });
    }
    catch (error) {
        console.error('Error fetching attribution:', error);
        res.status(500).json({ error: 'Failed to fetch attribution' });
    }
});
exports.default = router;
