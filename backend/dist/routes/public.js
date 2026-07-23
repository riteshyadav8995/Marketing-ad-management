"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET /api/public/pages/:slug
// Fetches the published page JSON and logs the visit with UTM parameters
router.get('/pages/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const { utm_source, utm_medium, utm_campaign, utm_content, variantId } = req.query;
        const page = await prisma.landingPage.findUnique({
            where: { slug: slug }
        });
        if (!page || page.status !== 'PUBLISHED') {
            return res.status(404).json({ error: 'Page not found' });
        }
        // Log the visit
        await prisma.pageVisit.create({
            data: {
                landingPageId: page.id,
                utmSource: utm_source || null,
                utmMedium: utm_medium || null,
                utmCampaign: utm_campaign || null,
                utmContent: utm_content || null,
                variantId: variantId || null
            }
        });
        res.json(page);
    }
    catch (error) {
        console.error('Error fetching public page:', error);
        res.status(500).json({ error: 'Failed to fetch page' });
    }
});
// GET /api/public/experiment/:id
// Splits traffic between variants and redirects to the chosen landing page slug
router.get('/experiment/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { utm_source, utm_medium, utm_campaign, utm_content } = req.query;
        const experiment = await prisma.aBExperiment.findUnique({
            where: { id },
            include: { variants: { include: { landingPage: true } } }
        });
        if (!experiment || experiment.status !== 'RUNNING') {
            return res.status(404).send('Experiment not found or not running');
        }
        // Weighted random selection
        const totalWeight = experiment.variants.reduce((sum, v) => sum + v.trafficWeight, 0);
        let random = Math.floor(Math.random() * totalWeight);
        let selectedVariant = experiment.variants[0];
        for (const variant of experiment.variants) {
            if (random < variant.trafficWeight) {
                selectedVariant = variant;
                break;
            }
            random -= variant.trafficWeight;
        }
        if (!selectedVariant.landingPage) {
            return res.status(404).send('Variant landing page not found');
        }
        // Build the redirect URL with all UTM parameters PLUS the variantId for attribution
        const params = new URLSearchParams();
        if (utm_source)
            params.append('utm_source', utm_source);
        if (utm_medium)
            params.append('utm_medium', utm_medium);
        if (utm_campaign)
            params.append('utm_campaign', utm_campaign);
        if (utm_content)
            params.append('utm_content', utm_content);
        params.append('variantId', selectedVariant.id); // For attribution
        const frontendUrl = `http://localhost:5173/p/${selectedVariant.landingPage.slug}?${params.toString()}`;
        res.redirect(frontendUrl);
    }
    catch (error) {
        console.error('Error in experiment routing:', error);
        res.status(500).send('Routing error');
    }
});
exports.default = router;
